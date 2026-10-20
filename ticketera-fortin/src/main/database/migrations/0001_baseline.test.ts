import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { mkdtempSync, rmSync } from 'fs'
import { tmpdir } from 'os'
import path from 'path'
import { openSqlite } from '../sqlite'
import { createLegacyDb, dumpDb, readSchema } from '../testing/legacyDb'
import { baseline } from './0001_baseline'
import { LEGACY_COLUMNS, LEGACY_DDL, LEGACY_TABLES } from './legacySchema'
import { MigrationError, runMigrations } from './runner'

let dir: string
let dbPath: string

beforeEach(() => {
  dir = mkdtempSync(path.join(tmpdir(), 'ticketera-baseline-'))
  dbPath = path.join(dir, 'test.sqlite')
})

afterEach(() => {
  rmSync(dir, { recursive: true, force: true })
})

// Builds a database from raw DDL, to simulate installations that differ from the legacy schema.
async function createFromDdl(statements: string[]): Promise<void> {
  const db = await openSqlite(dbPath)
  try {
    for (const statement of statements) await db.exec(statement)
  } finally {
    await db.close()
  }
}

const legacyRows = (dump: Awaited<ReturnType<typeof dumpDb>>): Record<string, unknown[]> =>
  Object.fromEntries(LEGACY_TABLES.map((table) => [table, dump.rows[table]]))

describe('0001_baseline', () => {
  it('lists exactly the columns the legacy tables have', async () => {
    await createLegacyDb(dbPath)
    const db = await openSqlite(dbPath, { readonly: true })
    try {
      for (const table of LEGACY_TABLES) {
        const columns = await db.all<{ name: string }>(`PRAGMA table_info(\`${table}\`)`)
        expect(
          columns.map((c) => c.name),
          table
        ).toEqual(LEGACY_COLUMNS[table])
      }
    } finally {
      await db.close()
    }
  })

  it('creates the six legacy tables on an empty database', async () => {
    const result = await runMigrations(dbPath, [baseline])

    expect(result.applied).toEqual([{ id: 1, name: 'baseline' }])
    const { tables } = await readSchema(dbPath)
    for (const table of LEGACY_TABLES) {
      expect(tables[table], table).toBe(LEGACY_DDL[table])
    }
  })

  it('leaves an existing legacy database and its data untouched', async () => {
    await createLegacyDb(dbPath, {
      Category: [{ category_id: 1, name: 'Bebidas' }],
      Products: [{ id_product: 1, name: 'Coca', price: 1500, category_id: 1 }],
      cash_register: [
        {
          cash_register_id: 1,
          opening: 5000,
          closing: 0,
          opened_at: '2026-10-03 17:11:39.864 +00:00',
          status: 'open'
        }
      ],
      Cash_movements: [
        {
          cash_register_id: 1,
          type: 'ingreso',
          amount: 10.5,
          description: 'Cambio',
          method: 'efectivo',
          date: '2026-10-03 18:00:00.000 +00:00'
        }
      ]
    })
    const before = await dumpDb(dbPath)

    await runMigrations(dbPath, [baseline])

    const after = await dumpDb(dbPath)
    expect(legacyRows(after)).toEqual(legacyRows(before))
    expect(after.schema.filter((entry) => entry.name !== 'schema_migrations')).toEqual(
      before.schema
    )
  })

  it('creates only the tables that are missing', async () => {
    await createFromDdl([LEGACY_DDL.Category])

    await runMigrations(dbPath, [baseline])

    const { tables } = await readSchema(dbPath)
    for (const table of LEGACY_TABLES) {
      expect(tables[table], table).toBe(LEGACY_DDL[table])
    }
  })

  it('aborts without touching anything when an existing table lacks a column', async () => {
    const withoutMethod = LEGACY_DDL.Cash_movements.replace(' `method` TEXT NOT NULL,', '')
    await createFromDdl(
      LEGACY_TABLES.map((table) => (table === 'Cash_movements' ? withoutMethod : LEGACY_DDL[table]))
    )
    const before = await dumpDb(dbPath)

    const failure = await runMigrations(dbPath, [baseline]).catch((error: unknown) => error)

    expect(failure).toBeInstanceOf(MigrationError)
    expect((failure as Error).message).toMatch(/Cash_movements.*method/)
    expect(await dumpDb(dbPath)).toEqual(before)
  })
})
