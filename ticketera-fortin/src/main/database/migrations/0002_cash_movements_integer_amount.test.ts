import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { mkdtempSync, rmSync } from 'fs'
import { tmpdir } from 'os'
import path from 'path'
import { openSqlite } from '../sqlite'
import { createLegacyDb } from '../testing/legacyDb'
import { baseline } from './0001_baseline'
import { cashMovementsIntegerAmount } from './0002_cash_movements_integer_amount'
import { runMigrations } from './runner'

let dir: string
let dbPath: string

beforeEach(() => {
  dir = mkdtempSync(path.join(tmpdir(), 'ticketera-0002-'))
  dbPath = path.join(dir, 'test.sqlite')
})

afterEach(() => {
  rmSync(dir, { recursive: true, force: true })
})

const movement = (movement_id: number, amount: unknown): Record<string, unknown> => ({
  movement_id,
  cash_register_id: 1,
  type: 'ingreso',
  amount,
  description: 'Movimiento',
  method: 'efectivo',
  date: '2026-10-03 18:00:00.000 +00:00'
})

async function migrateWith(amounts: unknown[]): ReturnType<typeof runMigrations> {
  await createLegacyDb(dbPath, {
    cash_register: [
      {
        cash_register_id: 1,
        opening: 0,
        closing: 0,
        opened_at: '2026-10-03 17:00:00.000 +00:00',
        status: 'open'
      }
    ],
    Cash_movements: amounts.map((amount, i) => movement(i + 1, amount))
  })
  return runMigrations(dbPath, [baseline, cashMovementsIntegerAmount])
}

async function amounts(): Promise<{ movement_id: number; amount: unknown; kind: string }[]> {
  const db = await openSqlite(dbPath, { readonly: true })
  try {
    return await db.all(
      'SELECT movement_id, amount, typeof(amount) AS kind FROM Cash_movements ORDER BY movement_id'
    )
  } finally {
    await db.close()
  }
}

async function insertAmount(amount: unknown): Promise<void> {
  const db = await openSqlite(dbPath)
  try {
    await db.run(
      `INSERT INTO Cash_movements (cash_register_id, type, amount, description, method, date, created_at, updated_at)
       VALUES (1, 'egreso', ?, 'Nuevo', 'efectivo', '2026-10-04', '2026-10-04', '2026-10-04')`,
      [amount]
    )
  } finally {
    await db.close()
  }
}

describe('0002_cash_movements_integer_amount', () => {
  it('rounds amounts with cents to the nearest peso, half up', async () => {
    await migrateWith([10.5, 10.49, 99.999, 1500])

    expect(await amounts()).toEqual([
      { movement_id: 1, amount: 11, kind: 'integer' },
      { movement_id: 2, amount: 10, kind: 'integer' },
      { movement_id: 3, amount: 100, kind: 'integer' },
      { movement_id: 4, amount: 1500, kind: 'integer' }
    ])
  })

  it('records every rounded movement with its original and new amount', async () => {
    const result = await migrateWith([10.5, 10.49, 99.999, 1500])

    expect(result.report.rounded).toEqual([
      { movementId: 1, original: 10.5, rounded: 11 },
      { movementId: 2, original: 10.49, rounded: 10 },
      { movementId: 3, original: 99.999, rounded: 100 }
    ])
  })

  it('keeps and reports amounts that are not numbers or not positive', async () => {
    const result = await migrateWith(['diez', 0, -300])

    expect(await amounts()).toEqual([
      { movement_id: 1, amount: 'diez', kind: 'text' },
      { movement_id: 2, amount: 0, kind: 'integer' },
      { movement_id: 3, amount: -300, kind: 'integer' }
    ])
    expect(result.report.rounded).toEqual([])
    expect(result.report.inconsistencies).toEqual([
      'Movimiento 1: monto "diez" no es un número; se conservó sin cambios.',
      'Movimiento 2: monto 0 no es positivo; se conservó sin cambios.',
      'Movimiento 3: monto -300 no es positivo; se conservó sin cambios.'
    ])
  })

  it('rejects new amounts with decimals and accepts whole pesos', async () => {
    await migrateWith([])

    await expect(insertAmount(10.5)).rejects.toThrow(/entero/)
    await expect(insertAmount('10')).resolves.toBeUndefined()
    await expect(insertAmount(2500)).resolves.toBeUndefined()
    expect((await amounts()).map((row) => row.kind)).toEqual(['integer', 'integer'])
  })

  it('rejects updating an amount to a value with decimals', async () => {
    await migrateWith([1000])
    const db = await openSqlite(dbPath)
    try {
      await expect(
        db.run('UPDATE Cash_movements SET amount = 999.5 WHERE movement_id = 1')
      ).rejects.toThrow(/entero/)
      await db.run("UPDATE Cash_movements SET description = 'Editado' WHERE movement_id = 1")
    } finally {
      await db.close()
    }
  })
})
