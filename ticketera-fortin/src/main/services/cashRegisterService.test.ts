import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('../database/db', async () => {
  const { createMigratedSequelize } = await import('../database/testing/testDb')
  return { default: await createMigratedSequelize() }
})

import sequelize from '../database/db'
import { resetData } from '../database/testing/testDb'
import { initAssociations } from '../model/associations'
import Cash_register from '../model/cash_registers'
import Cash_movements from '../model/cash_movements'
import Sales from '../model/sales'
import { CloseRegisterInput } from '../schemas/cashRegisterSchema'
import {
  AlreadyClosedError,
  cashRegisterService,
  ExpectedChangedError,
  RegisterNotFoundError
} from './cashRegisterService'

initAssociations()

beforeEach(async () => {
  await resetData(sequelize)
})

const openRegister = async (opening: number): Promise<number> => {
  const register = await Cash_register.create({
    opening,
    closing: 0,
    opened_at: new Date(),
    status: 'open'
  } as never)
  return register.cash_register_id
}

const sale = (
  cash_register_id: number,
  paymentMethod: 'efectivo' | 'transferencia' | 'combinado',
  cashAmount: number,
  transferAmount: number
): Promise<Sales> =>
  Sales.create({
    cash_register_id,
    date: new Date(),
    total: cashAmount + transferAmount,
    paymentMethod,
    cashAmount,
    transferAmount
  })

const movement = (
  cash_register_id: number,
  type: 'ingreso' | 'egreso',
  method: 'efectivo' | 'transferencia',
  amount: number
): Promise<Cash_movements> =>
  Cash_movements.create({
    cash_register_id,
    type,
    method,
    amount,
    description: 'Movimiento de prueba',
    date: new Date()
  })

// A register with every kind of operation; expected cash 10000 + 3000 + 2000 + 500 - 1200 = 14300,
// expected transfers 4000 + 1500 + 700 - 200 = 6000.
async function busyRegister(): Promise<number> {
  const id = await openRegister(10000)
  await sale(id, 'efectivo', 3000, 0)
  await sale(id, 'transferencia', 0, 4000)
  await sale(id, 'combinado', 2000, 1500)
  await movement(id, 'ingreso', 'efectivo', 500)
  await movement(id, 'egreso', 'efectivo', 1200)
  await movement(id, 'ingreso', 'transferencia', 700)
  await movement(id, 'egreso', 'transferencia', 200)
  return id
}

const closeInput = (overrides: Partial<CloseRegisterInput> = {}): CloseRegisterInput => ({
  countedCash: 14300,
  countedTransfer: 6000,
  shownExpectedCash: 14300,
  shownExpectedTransfer: 6000,
  ...overrides
})

describe('cashRegisterService.getCloseSummary', () => {
  it('splits sales and movements per method and computes the expected amounts', async () => {
    const id = await busyRegister()
    // Another register's operations must not leak in.
    const other = await openRegister(99999)
    await sale(other, 'efectivo', 777, 0)

    expect(await cashRegisterService.getCloseSummary(id)).toEqual({
      opening: 10000,
      sales: { cash: 5000, transfer: 5500 },
      movements: { cashIn: 500, cashOut: 1200, transferIn: 700, transferOut: 200 },
      expected: { cash: 14300, transfer: 6000 }
    })
  })

  it('expects the opening amount and no transfers for an empty register', async () => {
    const id = await openRegister(8000)

    expect(await cashRegisterService.getCloseSummary(id)).toEqual({
      opening: 8000,
      sales: { cash: 0, transfer: 0 },
      movements: { cashIn: 0, cashOut: 0, transferIn: 0, transferOut: 0 },
      expected: { cash: 8000, transfer: 0 }
    })
  })

  it('returns negative expectations when withdrawals exceed what came in', async () => {
    const id = await openRegister(1000)
    await movement(id, 'egreso', 'efectivo', 3000)
    await movement(id, 'egreso', 'transferencia', 500)

    const summary = await cashRegisterService.getCloseSummary(id)

    expect(summary.expected).toEqual({ cash: -2000, transfer: -500 })
  })

  it('fails for a register that does not exist', async () => {
    await expect(cashRegisterService.getCloseSummary(404)).rejects.toBeInstanceOf(
      RegisterNotFoundError
    )
  })
})

describe('cashRegisterService.closeRegister', () => {
  it('stores counted and server-computed expected amounts, and the counted total', async () => {
    const id = await busyRegister()

    await cashRegisterService.closeRegister(id, closeInput({ countedCash: 14000 }))

    const closed = await Cash_register.findByPk(id)
    expect(closed?.get({ plain: true })).toMatchObject({
      status: 'closed',
      counted_cash: 14000,
      counted_transfer: 6000,
      expected_cash: 14300,
      expected_transfer: 6000,
      closing: 20000
    })
    expect(closed?.closed_at).toBeInstanceOf(Date)
  })

  it('stores a negative expectation as is', async () => {
    const id = await openRegister(1000)
    await movement(id, 'egreso', 'efectivo', 3000)

    await cashRegisterService.closeRegister(
      id,
      closeInput({
        countedCash: 0,
        countedTransfer: 0,
        shownExpectedCash: -2000,
        shownExpectedTransfer: 0
      })
    )

    const closed = await Cash_register.findByPk(id)
    expect(closed?.expected_cash).toBe(-2000)
  })

  it('never stores the expected amounts sent by the screen', async () => {
    const id = await busyRegister()
    await movement(id, 'ingreso', 'efectivo', 100)

    // The screen still shows the old expectation: the close is refused, nothing is stored.
    const failure = await cashRegisterService
      .closeRegister(id, closeInput())
      .catch((error: unknown) => error)

    expect(failure).toBeInstanceOf(ExpectedChangedError)
    expect((failure as ExpectedChangedError).expected).toEqual({ cash: 14400, transfer: 6000 })
    const register = await Cash_register.findByPk(id)
    expect(register?.status).toBe('open')
    expect(register?.expected_cash).toBeNull()
  })

  it('refuses to close a register that is already closed, leaving it untouched', async () => {
    const id = await busyRegister()
    await cashRegisterService.closeRegister(id, closeInput())
    const before = (await Cash_register.findByPk(id))?.get({ plain: true })

    await expect(
      cashRegisterService.closeRegister(id, closeInput({ countedCash: 1 }))
    ).rejects.toBeInstanceOf(AlreadyClosedError)

    expect((await Cash_register.findByPk(id))?.get({ plain: true })).toEqual(before)
  })

  it('applies only one of two simultaneous closes', async () => {
    const id = await busyRegister()

    const results = await Promise.allSettled([
      cashRegisterService.closeRegister(id, closeInput({ countedCash: 14300 })),
      cashRegisterService.closeRegister(id, closeInput({ countedCash: 1 }))
    ])

    expect(results.map((r) => r.status).sort()).toEqual(['fulfilled', 'rejected'])
    const rejected = results.find((r) => r.status === 'rejected') as PromiseRejectedResult
    expect(rejected.reason).toBeInstanceOf(AlreadyClosedError)
    expect((await Cash_register.findByPk(id))?.counted_cash).toBe(14300)
  })

  it('fails for a register that does not exist', async () => {
    await expect(cashRegisterService.closeRegister(404, closeInput())).rejects.toBeInstanceOf(
      RegisterNotFoundError
    )
  })
})
