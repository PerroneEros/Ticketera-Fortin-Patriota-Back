import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { mkdtempSync, rmSync } from 'fs'
import { tmpdir } from 'os'
import path from 'path'
import { openSqlite } from '../sqlite'
import { createLegacyDb, dumpDb } from '../testing/legacyDb'
import { baseline } from './0001_baseline'
import { cashMovementsIntegerAmount } from './0002_cash_movements_integer_amount'
import { cashRegisterClosingBreakdown } from './0003_cash_register_closing_breakdown'
import { indexes } from './0004_indexes'
import { runMigrations } from './runner'

let dir: string
let dbPath: string

beforeEach(() => {
  dir = mkdtempSync(path.join(tmpdir(), 'ticketera-0003-'))
  dbPath = path.join(dir, 'test.sqlite')
})

afterEach(() => {
  rmSync(dir, { recursive: true, force: true })
})

const all = [baseline, cashMovementsIntegerAmount, cashRegisterClosingBreakdown, indexes]

async function query<T>(sql: string): Promise<T[]> {
  const db = await openSqlite(dbPath, { readonly: true })
  try {
    return await db.all<T>(sql)
  } finally {
    await db.close()
  }
}

async function seed(): Promise<void> {
  await createLegacyDb(dbPath, {
    cash_register: [
      {
        cash_register_id: 1,
        opening: 1000,
        closing: 25000,
        opened_at: '2026-10-01 17:00:00.000 +00:00',
        closed_at: '2026-10-01 23:00:00.000 +00:00',
        status: 'closed'
      },
      {
        cash_register_id: 2,
        opening: 2000,
        closing: 0,
        opened_at: '2026-10-03 17:00:00.000 +00:00',
        status: 'open'
      }
    ],
    Sales: [
      {
        sales_id: 1,
        cash_register_id: 2,
        date: '2026-10-03 18:00:00.000 +00:00',
        total: 1500,
        payment_method: 'efectivo',
        cash_amount: 1500,
        transfer_amount: 0
      }
    ],
    Cash_movements: [
      {
        movement_id: 1,
        cash_register_id: 2,
        type: 'egreso',
        amount: 300,
        description: 'Hielo',
        method: 'efectivo',
        date: '2026-10-03 19:00:00.000 +00:00'
      }
    ]
  })
}

describe('0003_cash_register_closing_breakdown', () => {
  it('adds the four nullable breakdown columns', async () => {
    await seed()
    await runMigrations(dbPath, all)

    const columns = await query<{ name: string; type: string; notnull: number }>(
      'PRAGMA table_info(cash_register)'
    )
    expect(columns.slice(-4)).toEqual([
      expect.objectContaining({ name: 'counted_cash', type: 'INTEGER', notnull: 0 }),
      expect.objectContaining({ name: 'counted_transfer', type: 'INTEGER', notnull: 0 }),
      expect.objectContaining({ name: 'expected_cash', type: 'INTEGER', notnull: 0 }),
      expect.objectContaining({ name: 'expected_transfer', type: 'INTEGER', notnull: 0 })
    ])
  })

  it('leaves legacy registers without breakdown and the open one open with its data', async () => {
    await seed()
    const before = await dumpDb(dbPath)

    await runMigrations(dbPath, all)

    const registers = await query(
      'SELECT cash_register_id, status, closing, counted_cash, counted_transfer, expected_cash, expected_transfer FROM cash_register ORDER BY 1'
    )
    expect(registers).toEqual([
      {
        cash_register_id: 1,
        status: 'closed',
        closing: 25000,
        counted_cash: null,
        counted_transfer: null,
        expected_cash: null,
        expected_transfer: null
      },
      {
        cash_register_id: 2,
        status: 'open',
        closing: 0,
        counted_cash: null,
        counted_transfer: null,
        expected_cash: null,
        expected_transfer: null
      }
    ])
    const after = await dumpDb(dbPath)
    expect(after.rows.Sales).toEqual(before.rows.Sales)
    expect(after.rows.Cash_movements).toEqual(before.rows.Cash_movements)
  })
})

describe('0004_indexes', () => {
  it('creates the five indexes', async () => {
    await runMigrations(dbPath, all)

    const names = await query<{ name: string; tbl_name: string }>(
      "SELECT name, tbl_name FROM sqlite_master WHERE type = 'index' AND name NOT LIKE 'sqlite_%' ORDER BY name"
    )
    expect(names).toEqual([
      { name: 'cash_movements_cash_register_id', tbl_name: 'Cash_movements' },
      { name: 'cash_movements_date', tbl_name: 'Cash_movements' },
      { name: 'sale_items_sale_id', tbl_name: 'Sale_items' },
      { name: 'sales_cash_register_id', tbl_name: 'Sales' },
      { name: 'sales_date', tbl_name: 'Sales' }
    ])
  })

  it.each([
    ['SELECT * FROM Sales WHERE cash_register_id = 1', 'sales_cash_register_id'],
    ["SELECT * FROM Sales WHERE date BETWEEN '2026-10-01' AND '2026-10-02'", 'sales_date'],
    ['SELECT * FROM Sale_items WHERE sale_id = 1', 'sale_items_sale_id'],
    ['SELECT * FROM Cash_movements WHERE cash_register_id = 1', 'cash_movements_cash_register_id'],
    [
      "SELECT * FROM Cash_movements WHERE date BETWEEN '2026-10-01' AND '2026-10-02'",
      'cash_movements_date'
    ]
  ])('uses an index for %s', async (sql, index) => {
    await runMigrations(dbPath, all)

    const plan = await query<{ detail: string }>(`EXPLAIN QUERY PLAN ${sql}`)
    expect(plan.map((step) => step.detail).join(' ')).toContain(`USING INDEX ${index}`)
  })
})
