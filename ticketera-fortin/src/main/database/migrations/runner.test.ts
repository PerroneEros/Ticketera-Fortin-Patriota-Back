import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { mkdtempSync, rmSync } from 'fs'
import { tmpdir } from 'os'
import path from 'path'
import { openSqlite, SqliteDb } from '../sqlite'
import { dumpDb } from '../testing/legacyDb'
import { Migration, MigrationError, runMigrations } from './runner'

let dir: string
let dbPath: string

beforeEach(() => {
  dir = mkdtempSync(path.join(tmpdir(), 'ticketera-runner-'))
  dbPath = path.join(dir, 'test.sqlite')
})

afterEach(() => {
  rmSync(dir, { recursive: true, force: true })
})

async function query<T>(sql: string): Promise<T[]> {
  const db = await openSqlite(dbPath, { readonly: true })
  try {
    return await db.all<T>(sql)
  } finally {
    await db.close()
  }
}

const dump = (): ReturnType<typeof dumpDb> => dumpDb(dbPath)

function testMigrations(): Migration[] {
  return [
    {
      id: 1,
      name: 'create_things',
      up: vi.fn(async (db: SqliteDb) => {
        await db.exec('CREATE TABLE things (id INTEGER PRIMARY KEY, label TEXT NOT NULL)')
      })
    },
    {
      id: 2,
      name: 'seed_things',
      up: vi.fn(async (db: SqliteDb) => {
        await db.run('INSERT INTO things (label) VALUES (?)', ['primera'])
      })
    }
  ]
}

const fixedNow = (): Date => new Date('2026-10-20T20:00:00.000Z')

describe('runMigrations', () => {
  it('applies pending migrations in order and records them', async () => {
    const migrations = testMigrations()

    const result = await runMigrations(dbPath, migrations, { now: fixedNow })

    expect(result).toMatchObject({
      fromVersion: 0,
      toVersion: 2,
      applied: [
        { id: 1, name: 'create_things' },
        { id: 2, name: 'seed_things' }
      ]
    })
    expect(await query('SELECT id, name, applied_at FROM schema_migrations ORDER BY id')).toEqual([
      { id: 1, name: 'create_things', applied_at: '2026-10-20T20:00:00.000Z' },
      { id: 2, name: 'seed_things', applied_at: '2026-10-20T20:00:00.000Z' }
    ])
    expect(await query('SELECT label FROM things')).toEqual([{ label: 'primera' }])
    expect(await query('PRAGMA user_version')).toEqual([{ user_version: 2 }])
  })

  it('does not apply anything on a second run', async () => {
    await runMigrations(dbPath, testMigrations(), { now: fixedNow })
    const again = testMigrations()

    const result = await runMigrations(dbPath, again, { now: fixedNow })

    expect(result).toMatchObject({ fromVersion: 2, toVersion: 2, applied: [] })
    expect(again[0].up).not.toHaveBeenCalled()
    expect(again[1].up).not.toHaveBeenCalled()
    expect(await query('SELECT label FROM things')).toEqual([{ label: 'primera' }])
    expect(await query('SELECT count(*) AS n FROM schema_migrations')).toEqual([{ n: 2 }])
  })

  it('applies only the migrations added since the last run', async () => {
    const [first, second] = testMigrations()
    await runMigrations(dbPath, [first], { now: fixedNow })

    const result = await runMigrations(dbPath, [first, second], { now: fixedNow })

    expect(result).toMatchObject({
      fromVersion: 1,
      toVersion: 2,
      applied: [{ id: 2, name: 'seed_things' }]
    })
    expect(first.up).toHaveBeenCalledTimes(1)
    expect(await query('PRAGMA user_version')).toEqual([{ user_version: 2 }])
  })

  it('leaves the database exactly as it was when a migration fails midway', async () => {
    const [first, second] = testMigrations()
    await runMigrations(dbPath, [first], { now: fixedNow })
    const before = await dump()
    const third: Migration = {
      id: 3,
      name: 'breaks_halfway',
      up: async (db) => {
        await db.exec('CREATE TABLE half_done (id INTEGER)')
        await db.run('INSERT INTO things (label) VALUES (?)', ['no debe quedar'])
        throw new Error('disco desconectado')
      }
    }
    const fourth = { ...testMigrations()[1], id: 4, name: 'never_runs' }

    const failure = await runMigrations(dbPath, [first, second, third, fourth], {
      now: fixedNow
    }).catch((error: unknown) => error)

    expect(failure).toBeInstanceOf(MigrationError)
    expect(failure).toMatchObject({ migrationId: 3, migrationName: 'breaks_halfway' })
    expect((failure as Error).message).toMatch(
      /breaks_halfway.*disco desconectado.*quedó como estaba/
    )
    expect(fourth.up).not.toHaveBeenCalled()
    expect(await dump()).toEqual(before)
  })

  it('does not even leave the registry behind when the very first run fails', async () => {
    const broken: Migration = {
      id: 1,
      name: 'broken',
      up: async (db) => {
        await db.exec('CREATE TABLE things (id INTEGER)')
        await db.exec('THIS IS NOT SQL')
      }
    }

    await expect(runMigrations(dbPath, [broken])).rejects.toBeInstanceOf(MigrationError)

    expect(await dump()).toEqual({ schema: [], rows: {}, userVersion: 0 })
  })

  it('rejects a migration list that is not strictly ascending by positive integer id', async () => {
    const [first, second] = testMigrations()

    await expect(runMigrations(dbPath, [second, first])).rejects.toThrow(/orden/)
    await expect(runMigrations(dbPath, [first, { ...second, id: 1 }])).rejects.toThrow(/orden/)
    await expect(runMigrations(dbPath, [{ ...first, id: 0 }])).rejects.toThrow(/orden/)
    await expect(runMigrations(dbPath, [{ ...first, id: 1.5 }])).rejects.toThrow(/orden/)
  })
})
