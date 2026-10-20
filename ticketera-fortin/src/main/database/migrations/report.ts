import { existsSync, mkdirSync, writeFileSync } from 'fs'
import path from 'path'
import { stamp } from '../backup'
import { SqliteDb } from '../sqlite'
import { MigrationReport } from './runner'

// Rows pointing to a parent that does not exist. They are kept as they are (RF-30): deleting
// or fixing them would change sales or cash history.
export async function findOrphans(db: SqliteDb): Promise<string[]> {
  const rows = await db.all<{ table: string; rowid: number; parent: string }>(
    'PRAGMA foreign_key_check'
  )
  const lines = rows.map(
    (row) =>
      `${row.table}, fila ${row.rowid}: apunta a ${row.parent} que no existe; se conservó sin cambios.`
  )
  return [...new Set(lines)]
}

export interface ReportInfo {
  now: Date
  fromVersion: number
  toVersion: number
  applied: { id: number; name: string }[]
  backupPath?: string
  report: MigrationReport
}

export function formatReport(info: ReportInfo): string {
  const { report } = info
  const lines = [
    'Reporte de actualización de la base — Ticketera Fortín',
    `Fecha: ${info.now.toLocaleString('es-AR', { hour12: false })}`,
    `Versión de la base: ${info.fromVersion} → ${info.toVersion}`,
    `Copia previa: ${info.backupPath ?? 'no hizo falta (base nueva)'}`,
    '',
    'Pasos aplicados:',
    ...info.applied.map((step) => `  Paso ${step.id}: ${step.name}`),
    '',
    `Montos redondeados (${report.rounded.length}):`,
    ...report.rounded.map(
      (item) => `  Movimiento ${item.movementId}: ${item.original} → ${item.rounded}`
    ),
    '',
    `Inconsistencias (${report.inconsistencies.length}):`,
    ...report.inconsistencies.map((line) => `  ${line}`)
  ]
  if (report.rounded.length === 0 && report.inconsistencies.length === 0) {
    lines.push('', 'Sin redondeos ni inconsistencias.')
  }
  return lines.join('\r\n') + '\r\n'
}

export function writeReport(dir: string, info: ReportInfo): string {
  mkdirSync(dir, { recursive: true })
  const base = `reporte-${stamp(info.now)}`
  let target = path.join(dir, `${base}.txt`)
  for (let n = 2; existsSync(target); n++) target = path.join(dir, `${base}-${n}.txt`)
  writeFileSync(target, formatReport(info), 'utf8')
  return target
}
