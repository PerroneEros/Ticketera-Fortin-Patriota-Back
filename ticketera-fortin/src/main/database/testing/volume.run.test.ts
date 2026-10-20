import { describe, expect, it, vi } from 'vitest'

// Manual measurement, skipped by `npm test` (RNF of spec 001):
//   $env:TICKETERA_PERF = "1"; npm run db:volume
// Builds a pre-migration database with 20.000 sales in 200 registers (one with 1.500 sales),
// times the update, the all-time summary and the detail of the biggest register.
const enabled = Boolean(process.env.TICKETERA_PERF)

const { REGISTERS, SALES, BIG_REGISTER_SALES } = vi.hoisted(() => ({
  REGISTERS: 200,
  SALES: 20_000,
  BIG_REGISTER_SALES: 1_500
}))

vi.mock('../db', async () => {
  const { Sequelize } = await import('sequelize')
  if (!process.env.TICKETERA_PERF) {
    return { default: new Sequelize({ dialect: 'sqlite', storage: ':memory:', logging: false }) }
  }
  const fs = await import('fs')
  const os = await import('os')
  const p = await import('path')
  const { createLegacyDb } = await import('./legacyDb')
  const { openSqlite } = await import('../sqlite')
  const { runMigrations } = await import('../migrations/runner')
  const { MIGRATIONS } = await import('../migrations')

  const dir = fs.mkdtempSync(p.join(os.tmpdir(), 'ticketera-volume-'))
  const storage = p.join(dir, 'baseTicketera.sqlite')
  await createLegacyDb(storage, {
    Category: [{ category_id: 1, name: 'Bebidas' }],
    Products: Array.from({ length: 12 }, (_, i) => ({
      id_product: i + 1,
      name: `Producto ${i + 1}`,
      price: 1000 + i * 250,
      category_id: 1
    }))
  })

  const db = await openSqlite(storage)
  await db.exec('BEGIN')
  const day = (n: number): string =>
    new Date(Date.UTC(2026, 0, 1) + n * 86_400_000)
      .toISOString()
      .replace('T', ' ')
      .replace('Z', ' +00:00')
  let saleId = 0
  for (let r = 1; r <= REGISTERS; r++) {
    await db.run(
      `INSERT INTO cash_register (cash_register_id, opening, closing, opened_at, closed_at, status, created_at, updated_at)
       VALUES (?, 10000, 0, ?, ?, 'closed', ?, ?)`,
      [r, day(r), day(r), day(r), day(r)]
    )
    const salesHere =
      r === 1 ? BIG_REGISTER_SALES : Math.floor((SALES - BIG_REGISTER_SALES) / (REGISTERS - 1))
    for (let s = 0; s < salesHere; s++) {
      saleId++
      const units = 1 + (s % 3)
      const productId = 1 + (s % 12)
      const price = 1000 + (productId - 1) * 250
      await db.run(
        `INSERT INTO Sales (sales_id, cash_register_id, date, total, payment_method, cash_amount, transfer_amount, created_at, updated_at)
         VALUES (?, ?, ?, ?, 'efectivo', ?, 0, ?, ?)`,
        [saleId, r, day(r), units * price, units * price, day(r), day(r)]
      )
      for (let u = 0; u < units; u++) {
        await db.run(
          `INSERT INTO Sale_items (sale_id, id_product, quantity, unit_price, total, printed, created_at, updated_at)
           VALUES (?, ?, 1, ?, ?, 1, ?, ?)`,
          [saleId, productId, price, price, day(r), day(r)]
        )
      }
    }
    for (let m = 0; m < 5; m++) {
      await db.run(
        `INSERT INTO Cash_movements (cash_register_id, type, amount, description, method, date, created_at, updated_at)
         VALUES (?, ?, 500, 'Movimiento', 'efectivo', ?, ?, ?)`,
        [r, m % 2 ? 'egreso' : 'ingreso', day(r), day(r), day(r)]
      )
    }
  }
  await db.exec('COMMIT')
  await db.close()

  const started = Date.now()
  await runMigrations(storage, MIGRATIONS, { backupDir: p.join(dir, 'copias') })
  ;(globalThis as Record<string, unknown>).__migrationMs = Date.now() - started
  ;(globalThis as Record<string, unknown>).__volumeDir = dir
  return { default: new Sequelize({ dialect: 'sqlite', storage, logging: false }) }
})

import sequelize from '../db'
import { initAssociations } from '../../model/associations'
import { salesService } from '../../services/salesService'
import { salesSummaryService } from '../../services/salesSummaryService'

const time = async <T>(task: () => Promise<T>): Promise<[T, number]> => {
  const started = Date.now()
  const result = await task()
  return [result, Date.now() - started]
}

describe.skipIf(!enabled)('volume (manual)', () => {
  it('measures update, summary and register detail', async () => {
    initAssociations()
    const [[{ n }]] = (await sequelize.query('SELECT count(*) AS n FROM Sales')) as [
      { n: number }[],
      unknown
    ]
    const [summary, summaryMs] = await time(() => salesSummaryService.getSummary({}))
    const [detail, detailMs] = await time(async () => {
      await salesSummaryService.getSummary({ cashRegisterId: 1 })
      return salesService.getSalesByRegister('1')
    })
    const migrationMs = (globalThis as Record<string, unknown>).__migrationMs as number

    console.log(
      [
        `Ventas: ${n} en ${REGISTERS} cajas; unidades: ${summary.unitsCount}`,
        `Actualización de la base: ${migrationMs} ms (umbral 30.000 ms)`,
        `Resumen de todo el tiempo: ${summaryMs} ms (umbral 2.000 ms)`,
        `Detalle de la caja de ${BIG_REGISTER_SALES} ventas: ${detailMs} ms (umbral 1.000 ms, ${detail.length} filas)`,
        `Carpeta temporal: ${(globalThis as Record<string, unknown>).__volumeDir}`
      ].join('\n')
    )

    expect(n).toBeGreaterThanOrEqual(SALES - REGISTERS)
    expect(migrationMs).toBeLessThan(30_000)
    expect(summaryMs).toBeLessThan(2_000)
    expect(detailMs).toBeLessThan(1_000)
  }, 600_000)
})
