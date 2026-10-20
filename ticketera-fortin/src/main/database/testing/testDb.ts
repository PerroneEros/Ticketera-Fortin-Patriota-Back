import { mkdtempSync, rmSync } from 'fs'
import { tmpdir } from 'os'
import path from 'path'
import { Sequelize } from 'sequelize'
import { MIGRATIONS } from '../migrations'
import { runMigrations } from '../migrations/runner'

// Test-only: a Sequelize instance over a temp file built by the real migrations, so services
// are tested against the schema installations actually have (not what sync() would create).
// Use from a `vi.mock('../database/db', ...)` factory.
export async function createMigratedSequelize(): Promise<Sequelize> {
  const dir = mkdtempSync(path.join(tmpdir(), 'ticketera-test-db-'))
  const storage = path.join(dir, 'test.sqlite')
  await runMigrations(storage, MIGRATIONS)
  process.on('exit', () => rmSync(dir, { recursive: true, force: true }))
  return new Sequelize({ dialect: 'sqlite', storage, logging: false })
}

// Children before parents, so foreign keys never block the cleanup.
const TABLES = ['Sale_items', 'Sales', 'Cash_movements', 'cash_register', 'Products', 'Category']

// Empties every table and restarts the ids, like the old `sync({ force: true })` did.
export async function resetData(sequelize: Sequelize): Promise<void> {
  for (const table of TABLES) await sequelize.query(`DELETE FROM \`${table}\``)
  await sequelize.query('DELETE FROM sqlite_sequence')
}
