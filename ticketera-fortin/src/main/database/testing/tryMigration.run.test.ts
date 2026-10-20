import { describe, expect, it } from 'vitest'
import { tryMigration } from './tryMigration'

// Manual tool, skipped by `npm test`. Dry run of the update on a copy of a database:
//   $env:TICKETERA_DB = "$env:APPDATA\ticketera-fortin\baseTicketera.sqlite"
//   npm run db:try-migration
// The original is opened read-only. The copy, the pre-update backup and the report stay in the
// temp folder printed at the end.
const source = process.env.TICKETERA_DB

describe.skipIf(!source)('dry run of the update on a copy', () => {
  it('migrates without differences', async () => {
    const result = await tryMigration(source as string, { addCases: true })

    const lines = [
      `Base original (solo lectura): ${source}`,
      `Copia migrada: ${result.copyPath}`,
      `Casos agregados a la copia: ${result.addedCases.join('; ') || 'ninguno'}`,
      `Versión: ${result.migration.fromVersion} → ${result.migration.toVersion}`,
      `Duración de la actualización: ${result.durationMs} ms`,
      `Filas antes: ${JSON.stringify(result.before.counts)}`,
      `Filas después: ${JSON.stringify(result.after.counts)}`,
      `Copia previa: ${result.migration.backupPath ?? '-'}`,
      `Reporte: ${result.migration.reportPath ?? '-'}`,
      result.differences.length === 0
        ? 'Resultado: sin diferencias'
        : `Resultado: ${result.differences.length} diferencias\n  ${result.differences.join('\n  ')}`
    ]
    console.log(lines.join('\n'))

    expect(result.differences).toEqual([])
  }, 120_000)
})
