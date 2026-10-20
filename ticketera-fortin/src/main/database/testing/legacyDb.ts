import { existsSync } from 'fs'
import { LEGACY_DDL, LEGACY_TABLES, LegacyTable } from '../migrations/legacySchema'
import { openSqlite } from '../sqlite'

// Test-only: builds a database as an installation from before migrations has it, so the
// migration runner can be exercised against realistic data without touching a real file.

export type LegacySeed = Partial<Record<LegacyTable, Record<string, unknown>[]>>

const TIMESTAMP = '2026-10-01 12:00:00.000 +00:00'

export async function createLegacyDb(filePath: string, seed: LegacySeed = {}): Promise<void> {
  if (existsSync(filePath)) {
    throw new Error(`La base ${filePath} ya existe; el fixture solo crea bases nuevas.`)
  }

  const db = await openSqlite(filePath)
  try {
    await db.exec('BEGIN')
    for (const table of LEGACY_TABLES) {
      await db.exec(LEGACY_DDL[table])
    }
    // Parents first, matching the order of LEGACY_TABLES. Foreign keys are off on a raw
    // sqlite3 connection, so orphan rows can be seeded on purpose.
    for (const table of LEGACY_TABLES) {
      for (const row of seed[table] ?? []) {
        const values = { created_at: TIMESTAMP, updated_at: TIMESTAMP, ...row }
        const columns = Object.keys(values)
        await db.run(
          `INSERT INTO \`${table}\` (${columns.map((c) => `\`${c}\``).join(', ')}) VALUES (${columns.map(() => '?').join(', ')})`,
          Object.values(values)
        )
      }
    }
    await db.exec('COMMIT')
  } catch (error) {
    await db.exec('ROLLBACK').catch(() => undefined)
    throw error
  } finally {
    await db.close()
  }
}

export interface DbDump {
  schema: { name: string; sql: string | null }[]
  rows: Record<string, unknown[]>
  userVersion: number
}

// Full content snapshot: every object's DDL, every row of every table and user_version.
export async function dumpDb(filePath: string): Promise<DbDump> {
  const db = await openSqlite(filePath, { readonly: true })
  try {
    const schema = await db.all<{ name: string; type: string; sql: string | null }>(
      "SELECT name, type, sql FROM sqlite_master WHERE name NOT LIKE 'sqlite_%' ORDER BY name"
    )
    const rows: Record<string, unknown[]> = {}
    for (const table of schema.filter((entry) => entry.type === 'table')) {
      rows[table.name] = await db.all(`SELECT * FROM "${table.name}" ORDER BY rowid`)
    }
    const [{ user_version: userVersion }] = await db.all<{ user_version: number }>(
      'PRAGMA user_version'
    )
    return { schema: schema.map(({ name, sql }) => ({ name, sql })), rows, userVersion }
  } finally {
    await db.close()
  }
}

export interface SchemaSnapshot {
  tables: Record<string, string>
  indexes: string[]
}

// User tables with their DDL, plus explicit index names (autoindexes excluded).
export async function readSchema(filePath: string): Promise<SchemaSnapshot> {
  const db = await openSqlite(filePath, { readonly: true })
  try {
    const rows = await db.all<{ type: string; name: string; sql: string | null }>(
      "SELECT type, name, sql FROM sqlite_master WHERE name NOT LIKE 'sqlite_%' ORDER BY name"
    )
    return {
      tables: Object.fromEntries(
        rows.filter((r) => r.type === 'table').map((r) => [r.name, r.sql ?? ''])
      ),
      indexes: rows.filter((r) => r.type === 'index').map((r) => r.name)
    }
  } finally {
    await db.close()
  }
}
