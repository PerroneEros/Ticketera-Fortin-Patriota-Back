import { describe, expect, it } from 'vitest'
import { BackupError } from './backup'
import { MigrationError, MigrationResult } from './migrations/runner'
import { describeMigration, describeStartupError } from './startupMessages'

const result = (overrides: Partial<MigrationResult> = {}): MigrationResult => ({
  fromVersion: 0,
  toVersion: 4,
  applied: [{ id: 1, name: 'baseline' }],
  report: { rounded: [], inconsistencies: [] },
  backupPath: 'C:\\datos\\copias-actualizacion\\pre-v0-a-v4.sqlite',
  reportPath: 'C:\\datos\\copias-actualizacion\\reporte.txt',
  ...overrides
})

describe('describeMigration', () => {
  it('says nothing when the update had nothing to report', () => {
    expect(describeMigration(result())).toBeNull()
    expect(describeMigration(result({ applied: [] }))).toBeNull()
  })

  it('counts rounded amounts and inconsistencies and points to the report', () => {
    const notice = describeMigration(
      result({
        report: {
          rounded: [
            { movementId: 1, original: 10.5, rounded: 11 },
            { movementId: 2, original: 3.2, rounded: 3 }
          ],
          inconsistencies: ['Sales, fila 7: apunta a cash_register que no existe']
        }
      })
    )

    expect(notice?.title).toBe('Base de datos actualizada')
    expect(notice?.message).toContain('Se redondearon 2 montos de movimientos al peso.')
    expect(notice?.message).toContain('Se encontró 1 registro inconsistente')
    expect(notice?.message).toContain('C:\\datos\\copias-actualizacion\\reporte.txt')
    expect(notice?.message).toContain('C:\\datos\\copias-actualizacion\\pre-v0-a-v4.sqlite')
  })

  it('uses singular and plural correctly', () => {
    const notice = describeMigration(
      result({
        report: {
          rounded: [{ movementId: 1, original: 10.5, rounded: 11 }],
          inconsistencies: ['a', 'b']
        }
      })
    )
    expect(notice?.message).toContain('Se redondeó 1 monto de movimientos al peso.')
    expect(notice?.message).toContain('Se encontraron 2 registros inconsistentes')
  })
})

describe('describeStartupError', () => {
  it('explains a failed update, where the copy is, and that sales stay closed', () => {
    const error = new MigrationError(
      new Error('disco lleno'),
      { id: 3, name: 'x', up: async () => undefined },
      'C:\\copia.sqlite'
    )

    const text = describeStartupError(error)

    expect(text.title).toBe('No se pudo actualizar la base de datos')
    expect(text.message).toContain(error.message)
    expect(text.message).toContain('Copia previa: C:\\copia.sqlite')
    expect(text.message).toContain('La app se va a cerrar')
  })

  it('explains a failed backup', () => {
    const error = new BackupError('C:\\copias', new Error('sin espacio'))

    const text = describeStartupError(error)

    expect(text.title).toBe('No se pudo hacer la copia de seguridad')
    expect(text.message).toContain(error.message)
    expect(text.message).toContain('espacio en disco')
  })

  it('keeps the generic message for any other error', () => {
    expect(describeStartupError(new Error('boom'))).toEqual({
      title: 'Error al iniciar',
      message: 'No se pudo abrir la base de datos. Contactá a soporte antes de vender.'
    })
  })
})
