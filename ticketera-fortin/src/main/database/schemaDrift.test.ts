import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'
import { mkdtempSync, rmSync } from 'fs'
import { tmpdir } from 'os'
import path from 'path'
import { DataTypes, Model, ModelStatic } from 'sequelize'

// Models only need a Sequelize instance to be defined; they never touch this one.
vi.mock('./db', async () => {
  const { Sequelize } = await import('sequelize')
  return { default: new Sequelize({ dialect: 'sqlite', storage: ':memory:', logging: false }) }
})

import Category from '../model/category'
import Product from '../model/product'
import Cash_register from '../model/cash_registers'
import Sales from '../model/sales'
import Sale_items from '../model/sale_items'
import Cash_movements from '../model/cash_movements'
import { MIGRATIONS } from './migrations'
import { runMigrations } from './migrations/runner'
import { openSqlite, SqliteDb } from './sqlite'

let dir: string
let db: SqliteDb

beforeAll(async () => {
  dir = mkdtempSync(path.join(tmpdir(), 'ticketera-drift-'))
  const dbPath = path.join(dir, 'migrated.sqlite')
  await runMigrations(dbPath, MIGRATIONS)
  db = await openSqlite(dbPath, { readonly: true })
})

afterAll(async () => {
  await db.close()
  rmSync(dir, { recursive: true, force: true })
})

// What a model expects of each column vs. what the migrations built. A difference means a
// model changed without a migration (or the other way around).
describe.each([
  ['Category', Category],
  ['Products', Product],
  ['cash_register', Cash_register],
  ['Sales', Sales],
  ['Sale_items', Sale_items],
  ['Cash_movements', Cash_movements]
])('%s', (table, model) => {
  it('has the columns and nullability its model declares', async () => {
    const columns = await db.all<{ name: string; notnull: number; pk: number }>(
      `PRAGMA table_info(\`${table}\`)`
    )
    const fromDb = columns
      .map((c) => ({ column: c.name, required: c.notnull === 1 || c.pk === 1 }))
      .sort((a, b) => a.column.localeCompare(b.column))
    // Sale_items declares `created_at` and also gets it from `timestamps`: same column, once.
    const attributes = Object.values((model as ModelStatic<Model>).getAttributes())
    const byColumn = new Map(
      attributes.map((attribute) => [
        attribute.field as string,
        attribute.allowNull === false || attribute.primaryKey === true
      ])
    )
    const fromModel = [...byColumn]
      .map(([column, required]) => ({ column, required }))
      .sort((a, b) => a.column.localeCompare(b.column))

    expect(fromModel).toEqual(fromDb)
  })
})

describe('Cash_movements.amount', () => {
  it('is declared as an integer in the model', () => {
    expect(Cash_movements.getAttributes().amount.type).toBeInstanceOf(DataTypes.INTEGER)
  })
})
