import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('../database/db', async () => {
  const { createMigratedSequelize } = await import('../database/testing/testDb')
  return { default: await createMigratedSequelize() }
})

import sequelize from '../database/db'
import { resetData } from '../database/testing/testDb'
import Cash_register from '../model/cash_registers'
import Cash_movements from '../model/cash_movements'
import { cashMovementService } from './cashMovementService'

beforeEach(async () => {
  await resetData(sequelize)
})

const openRegister = (): Promise<Cash_register> =>
  Cash_register.create({ opening: 0, closing: 0, opened_at: new Date(), status: 'open' } as never)

describe('cashMovementService.createMovement', () => {
  it('attaches the movement to the open register with the server date', async () => {
    const register = await openRegister()

    const movement = await cashMovementService.createMovement({
      type: 'egreso',
      method: 'efectivo',
      amount: 5000,
      description: 'Compra de hielo'
    })

    expect(movement.cash_register_id).toBe(register.cash_register_id)
    expect(movement.date).toBeInstanceOf(Date)
    expect(await Cash_movements.count()).toBe(1)
  })

  it('rejects the movement when no register is open', async () => {
    await expect(
      cashMovementService.createMovement({
        type: 'ingreso',
        method: 'transferencia',
        amount: 100,
        description: 'Corrección'
      })
    ).rejects.toThrow('No hay ninguna caja abierta')
    expect(await Cash_movements.count()).toBe(0)
  })
})
