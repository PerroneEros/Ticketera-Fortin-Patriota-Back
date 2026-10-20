import { BackupError } from './backup'
import { MigrationError, MigrationResult } from './migrations/runner'

export interface DialogText {
  title: string
  message: string
}

const plural = (count: number, one: string, many: string): string => (count === 1 ? one : many)

// Shown after an update that rounded amounts or found inconsistent rows (RF-31); a clean
// update starts silently.
export function describeMigration(result: MigrationResult): DialogText | null {
  const { rounded, inconsistencies } = result.report
  if (result.applied.length === 0 || (rounded.length === 0 && inconsistencies.length === 0)) {
    return null
  }

  const lines: string[] = []
  if (rounded.length > 0) {
    lines.push(
      `Se ${plural(rounded.length, 'redondeó', 'redondearon')} ${rounded.length} ${plural(rounded.length, 'monto', 'montos')} de movimientos al peso.`
    )
  }
  if (inconsistencies.length > 0) {
    lines.push(
      `Se ${plural(inconsistencies.length, 'encontró', 'encontraron')} ${inconsistencies.length} ${plural(inconsistencies.length, 'registro inconsistente', 'registros inconsistentes')}; se ${plural(inconsistencies.length, 'conservó', 'conservaron')} sin cambios.`
    )
  }
  if (result.reportPath) lines.push('', `Detalle: ${result.reportPath}`)
  if (result.backupPath) lines.push(`Copia previa: ${result.backupPath}`)

  return { title: 'Base de datos actualizada', message: lines.join('\n') }
}

// Startup failures (RF-33, RF-35): the app closes without starting the API.
export function describeStartupError(error: unknown): DialogText {
  if (error instanceof MigrationError) {
    const lines = [error.message]
    if (error.backupPath) lines.push(`Copia previa: ${error.backupPath}`)
    lines.push('', 'La app se va a cerrar para no vender sobre una base a medio actualizar.')
    lines.push('Reinstalá la versión anterior y contactá a soporte.')
    return { title: 'No se pudo actualizar la base de datos', message: lines.join('\n') }
  }
  if (error instanceof BackupError) {
    return {
      title: 'No se pudo hacer la copia de seguridad',
      message: [
        error.message,
        '',
        'Liberá espacio en disco o revisá los permisos de la carpeta y volvé a abrir la app.'
      ].join('\n')
    }
  }
  return {
    title: 'Error al iniciar',
    message: 'No se pudo abrir la base de datos. Contactá a soporte antes de vender.'
  }
}
