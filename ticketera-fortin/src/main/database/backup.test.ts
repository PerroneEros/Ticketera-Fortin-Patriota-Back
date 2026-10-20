import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { existsSync, mkdirSync, mkdtempSync, readdirSync, rmSync, writeFileSync } from 'fs'
import { tmpdir } from 'os'
import path from 'path'
import { BackupError, createBackup } from './backup'
import { openSqlite } from './sqlite'
import { baseline } from './migrations/0001_baseline'
import { Migration, MigrationError, runMigrations } from './migrations/runner'
import { createLegacyDb, dumpDb } from './testing/legacyDb'

let dir: string
let dbPath: string
let backupDir: string

beforeEach(() => {
  dir = mkdtempSync(path.join(tmpdir(), 'ticketera-backup-'))
  dbPath = path.join(dir, 'baseTicketera.sqlite')
  backupDir = path.join(dir, 'copias-actualizacion')
})

afterEach(() => {
  rmSync(dir, { recursive: true, force: true })
})

const addNotes: Migration = {
  id: 2,
  name: 'add_notes',
  up: async (db) => {
    await db.exec('CREATE TABLE notes (id INTEGER PRIMARY KEY)')
  }
}

const fixedNow = (): Date => new Date(2026, 9, 20, 17, 30, 5)

async function seedLegacy(): Promise<void> {
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
}

const backups = (): string[] =>
  existsSync(backupDir)
    ? readdirSync(backupDir)
        .filter((f) => !f.startsWith('reporte-'))
        .sort()
    : []

describe('backup before migrating', () => {
  it('copies an existing database with all its data before applying migrations', async () => {
    await seedLegacy()
    const before = await dumpDb(dbPath)

    const result = await runMigrations(dbPath, [baseline, addNotes], { backupDir, now: fixedNow })

    expect(backups()).toEqual(['pre-v0-a-v2-20261020-173005.sqlite'])
    expect(result.backupPath).toBe(path.join(backupDir, 'pre-v0-a-v2-20261020-173005.sqlite'))
    expect(await dumpDb(result.backupPath as string)).toEqual(before)
  })

  it('does not copy a brand-new database', async () => {
    const result = await runMigrations(dbPath, [baseline, addNotes], { backupDir, now: fixedNow })

    expect(result.backupPath).toBeUndefined()
    expect(backups()).toEqual([])
  })

  it('does not copy when nothing is pending', async () => {
    await seedLegacy()
    await runMigrations(dbPath, [baseline], { backupDir, now: fixedNow })

    const result = await runMigrations(dbPath, [baseline], {
      backupDir,
      now: () => new Date(2026, 9, 21, 9, 0, 0)
    })

    expect(result.backupPath).toBeUndefined()
    expect(backups()).toEqual(['pre-v0-a-v1-20261020-173005.sqlite'])
  })

  it('names the copy after the versions it goes from and to', async () => {
    await seedLegacy()
    await runMigrations(dbPath, [baseline], { backupDir, now: fixedNow })

    await runMigrations(dbPath, [baseline, addNotes], {
      backupDir,
      now: () => new Date(2026, 9, 21, 9, 0, 0)
    })

    expect(backups()).toEqual([
      'pre-v0-a-v1-20261020-173005.sqlite',
      'pre-v1-a-v2-20261021-090000.sqlite'
    ])
  })

  it('tells where the copy is when a migration fails after copying', async () => {
    await seedLegacy()
    const broken: Migration = {
      id: 2,
      name: 'broken',
      up: async () => {
        throw new Error('falla')
      }
    }

    const failure = await runMigrations(dbPath, [baseline, broken], {
      backupDir,
      now: fixedNow
    }).catch((error: unknown) => error)

    expect(failure).toBeInstanceOf(MigrationError)
    expect((failure as MigrationError).backupPath).toBe(
      path.join(backupDir, 'pre-v0-a-v2-20261020-173005.sqlite')
    )
    expect(existsSync((failure as MigrationError).backupPath as string)).toBe(true)
  })

  describe('retention', () => {
    // Simulated earlier copies, one per day from 2026-10-01; contents do not matter here.
    function previousCopies(count: number): string[] {
      mkdirSync(backupDir, { recursive: true })
      const names = Array.from(
        { length: count },
        (_, i) => `pre-v${i}-a-v${i + 1}-202610${String(i + 1).padStart(2, '0')}-120000.sqlite`
      )
      for (const name of names) writeFileSync(path.join(backupDir, name), 'copia vieja')
      return names
    }

    it('keeps the new copy and the four most recent ones', async () => {
      const old = previousCopies(6)
      await seedLegacy()

      const result = await runMigrations(dbPath, [baseline], { backupDir, now: fixedNow })

      expect(backups()).toEqual(
        [...old.slice(2), path.basename(result.backupPath as string)].sort()
      )
    })

    it('deletes only the oldest when there were exactly five', async () => {
      const old = previousCopies(5)
      await seedLegacy()

      await runMigrations(dbPath, [baseline], { backupDir, now: fixedNow })

      expect(backups()).not.toContain(old[0])
      expect(backups()).toHaveLength(5)
    })

    it('orders by date, not by version, and never deletes the new copy', async () => {
      previousCopies(5)
      await seedLegacy()

      // A till whose clock is behind: the new copy looks older than all the others.
      const result = await runMigrations(dbPath, [baseline], {
        backupDir,
        now: () => new Date(2025, 0, 1, 8, 0, 0)
      })

      expect(backups()).toContain(path.basename(result.backupPath as string))
      expect(backups()).toHaveLength(5)
      expect(backups()).not.toContain('pre-v0-a-v1-20261001-120000.sqlite')
    })

    it('leaves files it did not create alone', async () => {
      previousCopies(6)
      writeFileSync(path.join(backupDir, 'notas.txt'), 'reporte')
      writeFileSync(path.join(backupDir, 'manual.sqlite'), 'copia hecha a mano')
      await seedLegacy()

      await runMigrations(dbPath, [baseline], { backupDir, now: fixedNow })

      expect(backups()).toContain('notas.txt')
      expect(backups()).toContain('manual.sqlite')
    })

    it('deletes nothing when the new copy fails', async () => {
      const old = previousCopies(5)
      const closed = await openSqlite(path.join(dir, 'otra.sqlite'))
      await closed.close()

      await expect(
        createBackup(closed, backupDir, { fromVersion: 0, toVersion: 1, now: fixedNow() })
      ).rejects.toBeInstanceOf(BackupError)

      expect(backups()).toEqual(old)
    })
  })

  it('does not migrate when the copy cannot be written', async () => {
    await seedLegacy()
    const before = await dumpDb(dbPath)
    // A file where the folder should be: the copy cannot be created on any OS.
    writeFileSync(backupDir, 'no soy una carpeta')

    const failure = await runMigrations(dbPath, [baseline, addNotes], { backupDir }).catch(
      (error: unknown) => error
    )

    expect(failure).toBeInstanceOf(BackupError)
    expect(failure).not.toBeInstanceOf(MigrationError)
    expect((failure as Error).message).toMatch(/copia de seguridad.*no se actualizó/)
    expect(await dumpDb(dbPath)).toEqual(before)
  })
})
