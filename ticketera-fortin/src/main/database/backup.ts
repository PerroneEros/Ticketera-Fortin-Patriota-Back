import { existsSync, mkdirSync, readdirSync, rmSync } from 'fs'
import path from 'path'
import { openSqlite, SqliteDb } from './sqlite'

// Thrown before any change: the update is skipped and the database stays as it was.
export class BackupError extends Error {
  constructor(backupDir: string, cause: unknown) {
    const reason = cause instanceof Error ? cause.message : String(cause)
    super(
      `No se pudo guardar la copia de seguridad previa en ${backupDir}: ${reason}. La base no se actualizó.`,
      { cause }
    )
    this.name = 'BackupError'
  }
}

const pad = (value: number): string => String(value).padStart(2, '0')

// Local time, so the name matches what the team sees on the till's clock.
export function stamp(date: Date): string {
  return (
    `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}-` +
    `${pad(date.getHours())}${pad(date.getMinutes())}${pad(date.getSeconds())}`
  )
}

function freePath(backupDir: string, baseName: string): string {
  let candidate = path.join(backupDir, `${baseName}.sqlite`)
  // A retry within the same second (e.g. after a failed update) must not clash.
  for (let n = 2; existsSync(candidate); n++) {
    candidate = path.join(backupDir, `${baseName}-${n}.sqlite`)
  }
  return candidate
}

// VACUUM INTO writes a consistent snapshot through SQLite itself, so it is safe with the
// connection open. Must run outside a transaction.
export async function createBackup(
  db: SqliteDb,
  backupDir: string,
  info: { fromVersion: number; toVersion: number; now: Date }
): Promise<string> {
  let target = ''
  try {
    mkdirSync(backupDir, { recursive: true })
    target = freePath(backupDir, `pre-v${info.fromVersion}-a-v${info.toVersion}-${stamp(info.now)}`)
    await db.run('VACUUM INTO ?', [target])
    await verify(target)
  } catch (error) {
    if (target) rmSync(target, { force: true })
    throw new BackupError(backupDir, error)
  }
  // Only once the new copy is verified, so a failed attempt never costs an older copy.
  pruneBackups(backupDir, target)
  return target
}

export const BACKUPS_TO_KEEP = 5

const BACKUP_NAME = /^pre-v\d+-a-v\d+-(\d{8}-\d{6})(?:-(\d+))?\.sqlite$/

// Keeps the copy just made plus the most recent others, by the date in their names (the
// versions in the name do not sort chronologically). Files not named like our copies are
// never touched.
function pruneBackups(backupDir: string, keep: string): void {
  const others = readdirSync(backupDir)
    .flatMap((name) => {
      const match = BACKUP_NAME.exec(name)
      if (!match || name === path.basename(keep)) return []
      return [{ name, key: `${match[1]}-${(match[2] ?? '1').padStart(4, '0')}` }]
    })
    .sort((a, b) => (a.key < b.key ? 1 : -1))

  for (const { name } of others.slice(BACKUPS_TO_KEEP - 1)) {
    try {
      rmSync(path.join(backupDir, name))
    } catch (error) {
      // An extra old copy is harmless; it must not block the update.
      console.warn(`No se pudo borrar la copia vieja ${name}:`, error)
    }
  }
}

async function verify(copyPath: string): Promise<void> {
  const copy = await openSqlite(copyPath, { readonly: true })
  try {
    const result = await copy.all<{ quick_check: string }>('PRAGMA quick_check')
    if (result.length !== 1 || result[0].quick_check !== 'ok') {
      throw new Error(`la copia está dañada (${result.map((r) => r.quick_check).join('; ')})`)
    }
  } finally {
    await copy.close()
  }
}
