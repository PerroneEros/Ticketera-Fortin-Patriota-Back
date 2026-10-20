import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { execFileSync } from 'child_process'
import { createRequire } from 'module'
import { existsSync, mkdtempSync, readdirSync, rmSync } from 'fs'
import { tmpdir } from 'os'
import path from 'path'
import { createLegacyDb, dumpDb } from '../testing/legacyDb'
import { baseline } from './0001_baseline'
import { Migration, MigrationError, runMigrations } from './runner'

let dir: string
let dbPath: string
let backupDir: string

beforeEach(async () => {
  dir = mkdtempSync(path.join(tmpdir(), 'ticketera-retry-'))
  dbPath = path.join(dir, 'baseTicketera.sqlite')
  backupDir = path.join(dir, 'copias-actualizacion')
  await createLegacyDb(dbPath, {
    Category: [{ category_id: 1, name: 'Bebidas' }],
    cash_register: [
      {
        cash_register_id: 1,
        opening: 5000,
        closing: 0,
        opened_at: '2026-10-03 17:11:39.864 +00:00',
        status: 'open'
      }
    ]
  })
})

afterEach(() => {
  rmSync(dir, { recursive: true, force: true })
})

const fixedNow = (): Date => new Date(2026, 9, 20, 17, 30, 5)

function addNotes(failing: boolean): Migration {
  return {
    id: 2,
    name: 'add_notes',
    up: async (db) => {
      await db.exec('CREATE TABLE notes (id INTEGER PRIMARY KEY)')
      if (failing) throw new Error('se cortó')
    }
  }
}

const copies = (): string[] =>
  readdirSync(backupDir)
    .filter((f) => f.endsWith('.sqlite'))
    .sort()

describe('retry after an interrupted update', () => {
  it('applies everything from the start, with a new copy, after a failed run', async () => {
    const original = await dumpDb(dbPath)
    await expect(
      runMigrations(dbPath, [baseline, addNotes(true)], { backupDir, now: fixedNow })
    ).rejects.toBeInstanceOf(MigrationError)

    // Same second as the failed attempt: the new copy must not overwrite the first one.
    const result = await runMigrations(dbPath, [baseline, addNotes(false)], {
      backupDir,
      now: fixedNow
    })

    expect(result.fromVersion).toBe(0)
    expect(result.applied.map((m) => m.id)).toEqual([1, 2])
    expect(copies()).toEqual([
      'pre-v0-a-v2-20261020-173005-2.sqlite',
      'pre-v0-a-v2-20261020-173005.sqlite'
    ])
    expect(await dumpDb(result.backupPath as string)).toEqual(original)
  })

  it('recovers a database whose process died in the middle of the transaction', async () => {
    const original = await dumpDb(dbPath)
    // Child process that opens the transaction, writes enough to spill pages to the file
    // (tiny cache) and exits without COMMIT, as a crash or power cut would leave it.
    const sqlite3Path = createRequire(import.meta.url).resolve('sqlite3')
    const script = `
      const sqlite3 = require(${JSON.stringify(sqlite3Path)})
      const db = new sqlite3.Database(${JSON.stringify(dbPath)})
      db.serialize(() => {
        db.run('PRAGMA cache_size = 1')
        db.run('BEGIN IMMEDIATE')
        db.run('CREATE TABLE schema_migrations (id INTEGER PRIMARY KEY, name TEXT NOT NULL, applied_at TEXT NOT NULL)')
        db.run('CREATE TABLE notes (id INTEGER PRIMARY KEY, body TEXT)')
        for (let i = 0; i < 300; i++) db.run("INSERT INTO notes (body) VALUES (hex(randomblob(500)))")
        db.run("UPDATE cash_register SET status = 'closed'", () => process.exit(0))
      })
    `
    execFileSync(process.execPath, ['-e', script])
    // Precondition: the crash left a hot rollback journal next to the database.
    expect(existsSync(`${dbPath}-journal`)).toBe(true)

    const result = await runMigrations(dbPath, [baseline, addNotes(false)], {
      backupDir,
      now: fixedNow
    })

    expect(result.applied.map((m) => m.id)).toEqual([1, 2])
    expect(await dumpDb(result.backupPath as string)).toEqual(original)
    const after = await dumpDb(dbPath)
    expect(after.rows.cash_register).toEqual(original.rows.cash_register)
    expect(after.rows.notes).toEqual([])
  })
})
