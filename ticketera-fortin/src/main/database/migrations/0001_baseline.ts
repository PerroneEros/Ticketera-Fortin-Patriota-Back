import { LEGACY_COLUMNS, LEGACY_DDL, LEGACY_TABLES } from './legacySchema'
import { Migration } from './runner'

// Starting point for every installation. A new database gets the schema `sync()` used to
// create; an existing one is only checked, so later migrations can rely on its columns.
// Missing tables are created, as `sync()` did on every start.
export const baseline: Migration = {
  id: 1,
  name: 'baseline',
  async up(db) {
    for (const table of LEGACY_TABLES) {
      const columns = await db.all<{ name: string }>(`PRAGMA table_info(\`${table}\`)`)
      if (columns.length === 0) {
        await db.exec(LEGACY_DDL[table])
        continue
      }
      const present = new Set(columns.map((column) => column.name))
      const missing = LEGACY_COLUMNS[table].filter((column) => !present.has(column))
      if (missing.length > 0) {
        throw new Error(
          `la tabla ${table} no tiene ${missing.length === 1 ? 'la columna' : 'las columnas'} ${missing.join(', ')}; la base es de una versión desconocida`
        )
      }
    }
  }
}
