import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { mkdtempSync, rmSync } from 'fs'
import { tmpdir } from 'os'
import path from 'path'
import { createLegacyDb, dumpDb } from './legacyDb'
import { tryMigration } from './tryMigration'

let dir: string
let dbPath: string

beforeEach(async () => {
  dir = mkdtempSync(path.join(tmpdir(), 'ticketera-try-'))
  dbPath = path.join(dir, 'baseTicketera.sqlite')
  await createLegacyDb(dbPath, {
    Category: [{ category_id: 1, name: 'Bebidas' }],
    Products: [{ id_product: 1, name: 'Coca', price: 1500, category_id: 1 }],
    cash_register: [
      {
        cash_register_id: 1,
        opening: 5000,
        closing: 9000,
        opened_at: '2026-10-03 17:00:00.000 +00:00',
        closed_at: '2026-10-03 23:00:00.000 +00:00',
        status: 'closed'
      },
      {
        cash_register_id: 2,
        opening: 1000,
        closing: 0,
        opened_at: '2026-10-04 17:00:00.000 +00:00',
        status: 'open'
      }
    ],
    Sales: [
      {
        sales_id: 1,
        cash_register_id: 1,
        date: '2026-10-03 18:00:00.000 +00:00',
        total: 3000,
        payment_method: 'combinado',
        cash_amount: 1000,
        transfer_amount: 2000
      }
    ],
    Sale_items: [
      { sale_id: 1, id_product: 1, quantity: 1, unit_price: 1500, total: 1500, printed: 1 },
      { sale_id: 1, id_product: 1, quantity: 1, unit_price: 1500, total: 1500, printed: 1 }
    ],
    Cash_movements: [
      {
        cash_register_id: 1,
        type: 'egreso',
        amount: 300,
        description: 'Hielo',
        method: 'efectivo',
        date: '2026-10-03 19:00:00.000 +00:00'
      }
    ]
  })
})

afterEach(() => {
  rmSync(dir, { recursive: true, force: true })
})

describe('tryMigration', () => {
  it('migrates a copy and finds no differences, without touching the original', async () => {
    const original = await dumpDb(dbPath)

    const result = await tryMigration(dbPath, { addCases: true })

    try {
      expect(result.differences).toEqual([])
      expect(result.addedCases).toHaveLength(2)
      expect(result.migration.report.rounded).toEqual([
        expect.objectContaining({ original: 10.5, rounded: 11 })
      ])
      expect(result.migration.report.inconsistencies).toHaveLength(2)
      expect(result.after.registers[2].status).toBe('open')
      expect(await dumpDb(dbPath)).toEqual(original)
      // Going back: the pre-update copy holds exactly what was there before migrating.
      const copy = await dumpDb(result.migration.backupPath as string)
      expect(copy.rows.Sales).toHaveLength(original.rows.Sales.length + 1)
      expect(copy.rows.schema_migrations).toBeUndefined()
    } finally {
      rmSync(result.workDir, { recursive: true, force: true })
    }
  })

  it('reports a difference when data changes', async () => {
    const { compare } = await import('./tryMigration')
    const register = {
      status: 'closed',
      opening: 0,
      closing: 0,
      sales: 1,
      salesCash: 100,
      salesTransfer: 0,
      items: 1,
      itemsTotal: 100,
      movements: { 'ingreso/efectivo': 50 }
    }
    const before = { counts: { Sales: 1 }, registers: { 1: register } }
    const after = {
      counts: { Sales: 0 },
      registers: { 1: { ...register, salesCash: 90, movements: { 'ingreso/efectivo': 51 } } }
    }

    expect(compare(before, after, new Map())).toEqual([
      'Sales: 1 filas antes, 0 después',
      'Caja 1, salesCash: 100 → 90',
      'Caja 1, movimientos: 50 → 51 (redondeo reportado 0)'
    ])
    expect(
      compare(
        before,
        {
          ...after,
          counts: before.counts,
          registers: { 1: { ...register, movements: { 'ingreso/efectivo': 51 } } }
        },
        new Map([[1, 1]])
      )
    ).toEqual([])
  })
})
