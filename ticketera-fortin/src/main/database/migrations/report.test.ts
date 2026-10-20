import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { existsSync, mkdtempSync, readFileSync, readdirSync, rmSync } from 'fs'
import { tmpdir } from 'os'
import path from 'path'
import { createLegacyDb, dumpDb } from '../testing/legacyDb'
import { baseline } from './0001_baseline'
import { cashMovementsIntegerAmount } from './0002_cash_movements_integer_amount'
import { runMigrations } from './runner'

let dir: string
let dbPath: string
let backupDir: string

beforeEach(() => {
  dir = mkdtempSync(path.join(tmpdir(), 'ticketera-report-'))
  dbPath = path.join(dir, 'baseTicketera.sqlite')
  backupDir = path.join(dir, 'copias-actualizacion')
})

afterEach(() => {
  rmSync(dir, { recursive: true, force: true })
})

const fixedNow = (): Date => new Date(2026, 9, 20, 17, 30, 5)
const migrations = [baseline, cashMovementsIntegerAmount]

const register = {
  cash_register_id: 1,
  opening: 0,
  closing: 0,
  opened_at: '2026-10-03 17:00:00.000 +00:00',
  status: 'open'
}

const movement = (
  movement_id: number,
  cash_register_id: number,
  amount: number
): Record<string, unknown> => ({
  movement_id,
  cash_register_id,
  type: 'ingreso',
  amount,
  description: 'Movimiento',
  method: 'efectivo',
  date: '2026-10-03 18:00:00.000 +00:00'
})

describe('update report', () => {
  it('keeps orphan rows untouched and lists them', async () => {
    await createLegacyDb(dbPath, {
      cash_register: [register],
      Sales: [
        {
          sales_id: 7,
          cash_register_id: 99,
          date: '2026-10-03 18:00:00.000 +00:00',
          total: 1500,
          payment_method: 'efectivo',
          cash_amount: 1500,
          transfer_amount: 0
        }
      ],
      Cash_movements: [movement(3, 42, 500)]
    })
    const before = await dumpDb(dbPath)

    const result = await runMigrations(dbPath, migrations, { backupDir, now: fixedNow })

    const after = await dumpDb(dbPath)
    expect(after.rows.Sales).toEqual(before.rows.Sales)
    expect(after.rows.Cash_movements).toEqual(before.rows.Cash_movements)
    expect(result.report.inconsistencies).toEqual([
      'Sales, fila 7: apunta a cash_register que no existe; se conservó sin cambios.',
      'Cash_movements, fila 3: apunta a cash_register que no existe; se conservó sin cambios.'
    ])
    const text = readFileSync(result.reportPath as string, 'utf8')
    expect(text).toContain('Sales, fila 7: apunta a cash_register que no existe')
    expect(text).toContain('Cash_movements, fila 3: apunta a cash_register que no existe')
  })

  it('writes the applied steps, the copy and the rounded amounts', async () => {
    await createLegacyDb(dbPath, {
      cash_register: [register],
      Cash_movements: [movement(1, 1, 10.5)]
    })

    const result = await runMigrations(dbPath, migrations, { backupDir, now: fixedNow })

    expect(result.reportPath).toBe(path.join(backupDir, 'reporte-20261020-173005.txt'))
    const text = readFileSync(result.reportPath as string, 'utf8')
    expect(text).toContain('Versión de la base: 0 → 2')
    expect(text).toContain('17:30:05')
    expect(text).toContain(`Copia previa: ${result.backupPath}`)
    expect(text).toContain('Paso 1: baseline')
    expect(text).toContain('Paso 2: cash_movements_integer_amount')
    expect(text).toContain('Movimiento 1: 10.5 → 11')
    expect(text).toContain('Inconsistencias (0)')
  })

  it('says so when there was nothing to round or report', async () => {
    await createLegacyDb(dbPath, { cash_register: [register] })

    const result = await runMigrations(dbPath, migrations, { backupDir, now: fixedNow })

    const text = readFileSync(result.reportPath as string, 'utf8')
    expect(text).toContain('Montos redondeados (0)')
    expect(text).toContain('Inconsistencias (0)')
    expect(text).toContain('Sin redondeos ni inconsistencias.')
  })

  it('writes no report when nothing was pending', async () => {
    await createLegacyDb(dbPath, { cash_register: [register] })
    await runMigrations(dbPath, migrations, { backupDir, now: fixedNow })

    const result = await runMigrations(dbPath, migrations, {
      backupDir,
      now: () => new Date(2026, 9, 21, 9, 0, 0)
    })

    expect(result.reportPath).toBeUndefined()
    expect(readdirSync(backupDir).filter((f) => f.startsWith('reporte-'))).toHaveLength(1)
  })

  it('does not fail the update when the report cannot be written', async () => {
    await createLegacyDb(dbPath, { cash_register: [register] })

    // No backupDir: there is no folder to write to, the update still lands.
    const result = await runMigrations(dbPath, migrations, { now: fixedNow })

    expect(result.reportPath).toBeUndefined()
    expect(result.applied).toHaveLength(2)
    expect(existsSync(backupDir)).toBe(false)
  })
})
