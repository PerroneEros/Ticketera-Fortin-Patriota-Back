import sequelize, { backupDir, dbPath } from './db'
import { initAssociations } from '../model/associations'
import '../model/cash_registers'
import '../model/category'
import '../model/product'
import '../model/sale_items'
import '../model/sales'
import '../model/cash_movements'
import { MIGRATIONS } from './migrations'
import { MigrationResult, runMigrations } from './migrations/runner'

// Migrations own the schema: they run on their own connection before Sequelize touches the
// file, and `sync()` is no longer used (it cannot update an existing table safely).
// Errors propagate so the app refuses to start instead of selling without a database.
export const initDB = async (): Promise<MigrationResult> => {
  const result = await runMigrations(dbPath, MIGRATIONS, { backupDir })
  initAssociations()
  await sequelize.authenticate()
  console.log(`base de datos lista (versión ${result.toVersion})`)
  return result
}
