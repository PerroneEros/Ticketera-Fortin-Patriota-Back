import { mkdtempSync } from 'fs'
import { tmpdir } from 'os'
import path from 'path'
import { MIGRATIONS } from '../migrations'
import { MigrationResult, runMigrations } from '../migrations/runner'
import { openSqlite, SqliteDb } from '../sqlite'

// Dry run of the update on a copy of a real (or team test) database. The original is only
// opened read-only; everything happens on a copy in a temp folder.

export interface Snapshot {
  counts: Record<string, number>
  registers: Record<
    number,
    {
      status: string
      opening: number
      closing: number
      sales: number
      salesCash: number
      salesTransfer: number
      items: number
      itemsTotal: number
      movements: Record<string, number>
    }
  >
}

export interface TryMigrationResult {
  workDir: string
  copyPath: string
  addedCases: string[]
  before: Snapshot
  after: Snapshot
  migration: MigrationResult
  durationMs: number
  differences: string[]
}

const TABLES = ['Category', 'Products', 'cash_register', 'Sales', 'Sale_items', 'Cash_movements']

export async function snapshot(db: SqliteDb): Promise<Snapshot> {
  const counts: Snapshot['counts'] = {}
  for (const table of TABLES) {
    const [{ n }] = await db.all<{ n: number }>(`SELECT count(*) AS n FROM \`${table}\``)
    counts[table] = n
  }
  const registers: Snapshot['registers'] = {}
  for (const r of await db.all<{
    id: number
    status: string
    opening: number
    closing: number
  }>('SELECT cash_register_id AS id, status, opening, closing FROM cash_register')) {
    const [sales] = await db.all<{ n: number; cash: number; transfer: number }>(
      `SELECT count(*) AS n, COALESCE(SUM(cash_amount), 0) AS cash,
         COALESCE(SUM(transfer_amount), 0) AS transfer FROM Sales WHERE cash_register_id = ?`,
      [r.id]
    )
    const [items] = await db.all<{ n: number; total: number }>(
      `SELECT count(*) AS n, COALESCE(SUM(i.total), 0) AS total FROM Sale_items i
       JOIN Sales s ON s.sales_id = i.sale_id WHERE s.cash_register_id = ?`,
      [r.id]
    )
    const movementRows = await db.all<{ kind: string; total: number }>(
      `SELECT type || '/' || method AS kind, SUM(amount) AS total FROM Cash_movements
       WHERE cash_register_id = ? GROUP BY 1`,
      [r.id]
    )
    registers[r.id] = {
      status: r.status,
      opening: r.opening,
      closing: r.closing,
      sales: sales.n,
      salesCash: sales.cash,
      salesTransfer: sales.transfer,
      items: items.n,
      itemsTotal: items.total,
      movements: Object.fromEntries(movementRows.map((m) => [m.kind, m.total]))
    }
  }
  return { counts, registers }
}

// Cases a test database usually lacks, so the dry run exercises rounding and orphan reporting.
async function addMissingCases(db: SqliteDb): Promise<string[]> {
  const [registry] = await db.all<{ n: number }>(
    "SELECT count(*) AS n FROM sqlite_master WHERE name = 'schema_migrations'"
  )
  if (registry.n > 0) return [] // already migrated: nothing to exercise
  const added: string[] = []
  const now = new Date().toISOString().replace('T', ' ').replace('Z', ' +00:00')
  const [register] = await db.all<{ id: number }>(
    'SELECT cash_register_id AS id FROM cash_register ORDER BY cash_register_id LIMIT 1'
  )
  if (register) {
    await db.run(
      `INSERT INTO Cash_movements (cash_register_id, type, amount, description, method, date, created_at, updated_at)
       VALUES (?, 'ingreso', 10.5, 'Prueba: monto con centavos', 'efectivo', ?, ?, ?)`,
      [register.id, now, now, now]
    )
    added.push(`movimiento de $10,50 en la caja ${register.id}`)
  }
  await db.run(
    `INSERT INTO Cash_movements (cash_register_id, type, amount, description, method, date, created_at, updated_at)
     VALUES (999999, 'egreso', 100, 'Prueba: movimiento huérfano', 'efectivo', ?, ?, ?)`,
    [now, now, now]
  )
  await db.run(
    `INSERT INTO Sales (cash_register_id, date, total, payment_method, cash_amount, transfer_amount, created_at, updated_at)
     VALUES (999999, ?, 100, 'efectivo', 100, 0, ?, ?)`,
    [now, now, now]
  )
  added.push('un movimiento y una venta de una caja inexistente (999999)')
  return added
}

export function compare(
  before: Snapshot,
  after: Snapshot,
  rounding: Map<number, number>
): string[] {
  const differences: string[] = []
  for (const table of TABLES) {
    if (before.counts[table] !== after.counts[table]) {
      differences.push(
        `${table}: ${before.counts[table]} filas antes, ${after.counts[table]} después`
      )
    }
  }
  for (const [id, b] of Object.entries(before.registers)) {
    const a = after.registers[Number(id)]
    if (!a) {
      differences.push(`Caja ${id}: desapareció`)
      continue
    }
    for (const key of [
      'status',
      'opening',
      'closing',
      'sales',
      'salesCash',
      'salesTransfer',
      'items',
      'itemsTotal'
    ] as const) {
      if (a[key] !== b[key]) differences.push(`Caja ${id}, ${key}: ${b[key]} → ${a[key]}`)
    }
    const kinds = new Set([...Object.keys(b.movements), ...Object.keys(a.movements)])
    const delta = rounding.get(Number(id)) ?? 0
    const beforeTotal = Object.values(b.movements).reduce((sum, v) => sum + v, 0)
    const afterTotal = Object.values(a.movements).reduce((sum, v) => sum + v, 0)
    // Rounding (RF-25) is the only allowed change, and it is in the report.
    if (Math.abs(beforeTotal + delta - afterTotal) > 1e-9) {
      differences.push(
        `Caja ${id}, movimientos: ${beforeTotal} → ${afterTotal} (redondeo reportado ${delta})`
      )
    } else if (delta === 0) {
      for (const kind of kinds) {
        if ((b.movements[kind] ?? 0) !== (a.movements[kind] ?? 0)) {
          differences.push(`Caja ${id}, ${kind}: ${b.movements[kind]} → ${a.movements[kind]}`)
        }
      }
    }
  }
  return differences
}

export async function tryMigration(
  sourcePath: string,
  options: { addCases?: boolean } = {}
): Promise<TryMigrationResult> {
  const workDir = mkdtempSync(path.join(tmpdir(), 'ticketera-try-migration-'))
  const copyPath = path.join(workDir, 'baseTicketera.sqlite')

  const source = await openSqlite(sourcePath, { readonly: true })
  try {
    await source.run('VACUUM INTO ?', [copyPath])
  } finally {
    await source.close()
  }

  let addedCases: string[] = []
  let before: Snapshot
  const copy = await openSqlite(copyPath)
  try {
    if (options.addCases) addedCases = await addMissingCases(copy)
    before = await snapshot(copy)
  } finally {
    await copy.close()
  }

  const started = Date.now()
  const migration = await runMigrations(copyPath, MIGRATIONS, {
    backupDir: path.join(workDir, 'copias-actualizacion')
  })
  const durationMs = Date.now() - started

  const migrated = await openSqlite(copyPath, { readonly: true })
  try {
    const after = await snapshot(migrated)
    const rounding = new Map<number, number>()
    for (const item of migration.report.rounded) {
      const [row] = await migrated.all<{ id: number }>(
        'SELECT cash_register_id AS id FROM Cash_movements WHERE movement_id = ?',
        [item.movementId]
      )
      rounding.set(row.id, (rounding.get(row.id) ?? 0) + item.rounded - item.original)
    }
    return {
      workDir,
      copyPath,
      addedCases,
      before,
      after,
      migration,
      durationMs,
      differences: compare(before, after, rounding)
    }
  } finally {
    await migrated.close()
  }
}
