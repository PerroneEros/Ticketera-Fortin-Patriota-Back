import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { mkdtempSync, rmSync } from 'fs'
import { tmpdir } from 'os'
import path from 'path'
import { LEGACY_DDL, LEGACY_TABLES } from '../migrations/legacySchema'
import { openSqlite } from '../sqlite'
import { createLegacyDb, readSchema } from './legacyDb'

// The legacy DDL was checked against sync() of the models of that time (2026-10-20, T01) and
// against a real database. Models have moved on since; schemaDrift.test.ts covers them now.

let dir: string
let dbPath: string

beforeEach(() => {
  dir = mkdtempSync(path.join(tmpdir(), 'ticketera-legacy-'))
  dbPath = path.join(dir, 'legacy.sqlite')
})

afterEach(() => {
  rmSync(dir, { recursive: true, force: true })
})

describe('createLegacyDb', () => {
  it('creates exactly the captured legacy tables and no indexes', async () => {
    await createLegacyDb(dbPath)

    const schema = await readSchema(dbPath)
    expect(schema.tables).toEqual(LEGACY_DDL)
    expect(schema.indexes).toEqual([])
  })

  it('seeds rows in dependency order, keeping decimal amounts and orphans as given', async () => {
    await createLegacyDb(dbPath, {
      Category: [{ category_id: 1, name: 'Bebidas' }],
      Products: [{ id_product: 1, name: 'Coca', price: 1500, category_id: 1 }],
      cash_register: [
        {
          cash_register_id: 1,
          opening: 10000,
          closing: 0,
          opened_at: '2026-10-03 17:11:39.864 +00:00',
          status: 'open'
        }
      ],
      Sales: [
        {
          sales_id: 1,
          cash_register_id: 1,
          date: '2026-10-03 17:13:11.442 +00:00',
          total: 1500,
          payment_method: 'efectivo',
          cash_amount: 1500,
          transfer_amount: 0
        }
      ],
      Sale_items: [
        { sale_id: 1, id_product: 1, quantity: 1, unit_price: 1500, total: 1500, printed: 1 }
      ],
      Cash_movements: [
        {
          cash_register_id: 1,
          type: 'ingreso',
          amount: 10.5,
          description: 'Cambio',
          method: 'efectivo',
          date: '2026-10-03 18:00:00.000 +00:00'
        },
        {
          cash_register_id: 999,
          type: 'egreso',
          amount: 200,
          description: 'Huérfano',
          method: 'transferencia',
          date: '2026-10-03 18:05:00.000 +00:00'
        }
      ]
    })

    const db = await openSqlite(dbPath, { readonly: true })
    try {
      const counts = await db.all<{ name: string; n: number }>(
        LEGACY_TABLES.map((t) => `SELECT '${t}' AS name, count(*) AS n FROM \`${t}\``).join(
          ' UNION ALL '
        )
      )
      expect(Object.fromEntries(counts.map((c) => [c.name, c.n]))).toEqual({
        Category: 1,
        Products: 1,
        cash_register: 1,
        Sales: 1,
        Sale_items: 1,
        Cash_movements: 2
      })

      const amounts = await db.all<{ amount: number; kind: string }>(
        'SELECT amount, typeof(amount) AS kind FROM Cash_movements ORDER BY movement_id'
      )
      expect(amounts).toEqual([
        { amount: 10.5, kind: 'real' },
        { amount: 200, kind: 'integer' }
      ])

      const [item] = await db.all<{ created_at: string }>('SELECT created_at FROM Sale_items')
      expect(item.created_at).toMatch(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}\.\d{3} \+00:00$/)
    } finally {
      await db.close()
    }
  })

  it('refuses to overwrite an existing database', async () => {
    await createLegacyDb(dbPath)
    await expect(createLegacyDb(dbPath)).rejects.toThrow(/ya existe/)
  })
})
