import { BackupError, createBackup } from '../backup'
import { openSqlite, SqliteDb } from '../sqlite'
import { findOrphans, writeReport } from './report'

// Findings collected while migrating, for the update report: nothing is changed silently.
export interface MigrationReport {
  rounded: { movementId: number; original: number; rounded: number }[]
  inconsistencies: string[]
}

export interface Migration {
  id: number
  name: string
  up(db: SqliteDb, report: MigrationReport): Promise<void>
}

export interface MigrationResult {
  fromVersion: number
  toVersion: number
  applied: { id: number; name: string }[]
  report: MigrationReport
  // Only when an existing database was copied before applying pending migrations.
  backupPath?: string
  // Only when something was applied and there is a folder to write it to.
  reportPath?: string
}

export interface RunOptions {
  now?: () => Date
  // Where to copy the database before migrating; without it no copy is made (tests only).
  backupDir?: string
}

// Thrown after the rollback, so its message can be shown to the user as is.
export class MigrationError extends Error {
  readonly migrationId?: number
  readonly migrationName?: string
  readonly backupPath?: string

  constructor(cause: unknown, migration?: Migration, backupPath?: string) {
    const reason = cause instanceof Error ? cause.message : String(cause)
    const step = migration ? ` (paso ${migration.id}: ${migration.name})` : ''
    super(`No se pudo actualizar la base de datos${step}: ${reason}. La base quedó como estaba.`, {
      cause
    })
    this.name = 'MigrationError'
    this.migrationId = migration?.id
    this.migrationName = migration?.name
    this.backupPath = backupPath
  }
}

const CREATE_REGISTRY = `CREATE TABLE IF NOT EXISTS schema_migrations (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  applied_at TEXT NOT NULL
)`

async function readState(db: SqliteDb): Promise<{ done: Set<number>; hasTables: boolean }> {
  const tables = await db.all<{ name: string }>(
    "SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%'"
  )
  const hasRegistry = tables.some((table) => table.name === 'schema_migrations')
  const done = hasRegistry
    ? (await db.all<{ id: number }>('SELECT id FROM schema_migrations')).map((row) => row.id)
    : []
  return { done: new Set(done), hasTables: tables.length > 0 }
}

// A wrong order would apply migrations against a schema they were not written for.
function assertOrdered(migrations: Migration[]): void {
  let previous = 0
  for (const migration of migrations) {
    if (!Number.isInteger(migration.id) || migration.id <= previous) {
      throw new Error(
        `Lista de migraciones fuera de orden: el id ${migration.id} (${migration.name}) debe ser un entero mayor que ${previous}.`
      )
    }
    previous = migration.id
  }
}

export async function runMigrations(
  filePath: string,
  migrations: Migration[],
  options: RunOptions = {}
): Promise<MigrationResult> {
  assertOrdered(migrations)
  const now = options.now ?? ((): Date => new Date())

  const db = await openSqlite(filePath)
  let current: Migration | undefined
  let backupPath: string | undefined
  try {
    // Read outside the transaction because the backup cannot run inside one. Safe: the app's
    // single-instance lock means nobody else writes to the file meanwhile.
    const { done, hasTables } = await readState(db)
    const fromVersion = Math.max(0, ...done)
    const pending = migrations.filter((migration) => !done.has(migration.id))
    const toVersion = Math.max(fromVersion, ...pending.map((migration) => migration.id))

    if (options.backupDir && hasTables && pending.length > 0) {
      backupPath = await createBackup(db, options.backupDir, {
        fromVersion,
        toVersion,
        now: now()
      })
    }

    // One transaction for the registry, every pending migration and user_version: either the
    // whole update lands or the database stays as it was (also after a power cut, via the
    // rollback journal). IMMEDIATE takes the write lock up front.
    await db.exec('BEGIN IMMEDIATE')
    await db.exec(CREATE_REGISTRY)

    const report: MigrationReport = { rounded: [], inconsistencies: [] }
    for (const migration of pending) {
      current = migration
      await migration.up(db, report)
      await db.run('INSERT INTO schema_migrations (id, name, applied_at) VALUES (?, ?, ?)', [
        migration.id,
        migration.name,
        now().toISOString()
      ])
    }
    current = undefined
    if (pending.length > 0) report.inconsistencies.push(...(await findOrphans(db)))

    // PRAGMA does not accept bound parameters; toVersion is a validated integer.
    await db.exec(`PRAGMA user_version = ${toVersion}`)
    await db.exec('COMMIT')

    const applied = pending.map(({ id, name }) => ({ id, name }))
    let reportPath: string | undefined
    if (options.backupDir && hasTables && pending.length > 0) {
      try {
        reportPath = writeReport(options.backupDir, {
          now: now(),
          fromVersion,
          toVersion,
          applied,
          backupPath,
          report
        })
      } catch (error) {
        // The update already landed; a missing report file must not stop the till.
        console.error('No se pudo escribir el reporte de actualización:', error)
      }
    }

    return {
      fromVersion,
      toVersion,
      applied,
      report,
      ...(backupPath ? { backupPath } : {}),
      ...(reportPath ? { reportPath } : {})
    }
  } catch (error) {
    if (error instanceof BackupError) throw error
    // SQLite already rolls back on some errors (e.g. disk full); a second ROLLBACK then fails
    // with "no transaction is active", which is harmless.
    await db.exec('ROLLBACK').catch(() => undefined)
    throw new MigrationError(error, current, backupPath)
  } finally {
    await db.close()
  }
}
