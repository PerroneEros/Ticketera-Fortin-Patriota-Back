import { beforeEach, describe, expect, it, vi } from 'vitest'
import { Request, Response } from 'express'

vi.mock('../database/db', async () => {
  const { Sequelize } = await import('sequelize')
  return { default: new Sequelize({ dialect: 'sqlite', storage: ':memory:', logging: false }) }
})
vi.mock('../services/cashRegisterService', async (importOriginal) => {
  const original = await importOriginal<typeof import('../services/cashRegisterService')>()
  return {
    ...original,
    cashRegisterService: { getCloseSummary: vi.fn(), closeRegister: vi.fn() }
  }
})

import {
  AlreadyClosedError,
  cashRegisterService,
  ExpectedChangedError,
  RegisterNotFoundError
} from '../services/cashRegisterService'
import { closeRegister, getTurnTotals } from './cashRegisterController'

function mockResponse(): Response & { statusCode: number; body: unknown } {
  const res = { statusCode: 0, body: undefined } as Response & { statusCode: number; body: unknown }
  res.status = vi.fn((code: number) => {
    res.statusCode = code
    return res
  }) as never
  res.json = vi.fn((body: unknown) => {
    res.body = body
    return res
  }) as never
  return res
}

const request = (params: Record<string, string>, body?: unknown): Request =>
  ({ params, body }) as unknown as Request

const summary = {
  opening: 10000,
  sales: { cash: 5000, transfer: 5500 },
  movements: { cashIn: 500, cashOut: 1200, transferIn: 700, transferOut: 200 },
  expected: { cash: 14300, transfer: 6000 }
}

const validBody = {
  countedCash: 14300,
  countedTransfer: 6000,
  shownExpectedCash: 14300,
  shownExpectedTransfer: 6000
}

beforeEach(() => {
  vi.mocked(cashRegisterService.getCloseSummary).mockReset()
  vi.mocked(cashRegisterService.closeRegister).mockReset()
  vi.spyOn(console, 'error').mockImplementation(() => undefined)
})

describe('GET /cash-registers/totals/:id', () => {
  it('returns the closing summary', async () => {
    vi.mocked(cashRegisterService.getCloseSummary).mockResolvedValue(summary)
    const res = mockResponse()

    await getTurnTotals(request({ id: '1' }), res)

    expect(cashRegisterService.getCloseSummary).toHaveBeenCalledWith('1')
    expect(res.statusCode).toBe(200)
    expect(res.body).toEqual(summary)
  })

  it('answers 404 for an unknown register', async () => {
    vi.mocked(cashRegisterService.getCloseSummary).mockRejectedValue(new RegisterNotFoundError())
    const res = mockResponse()

    await getTurnTotals(request({ id: '404' }), res)

    expect(res.statusCode).toBe(404)
    expect(res.body).toEqual({ message: 'Caja no encontrada.' })
  })

  it('hides unexpected errors behind a generic 500', async () => {
    vi.mocked(cashRegisterService.getCloseSummary).mockRejectedValue(new Error('SQLITE_BUSY'))
    const res = mockResponse()

    await getTurnTotals(request({ id: '1' }), res)

    expect(res.statusCode).toBe(500)
    expect(res.body).toEqual({ message: 'Error al calcular totales.' })
  })
})

describe('PUT /cash-registers/close/:id', () => {
  it('closes with valid amounts', async () => {
    vi.mocked(cashRegisterService.closeRegister).mockResolvedValue({ status: 'closed' } as never)
    const res = mockResponse()

    await closeRegister(request({ id: '1' }, validBody), res)

    expect(cashRegisterService.closeRegister).toHaveBeenCalledWith('1', validBody)
    expect(res.statusCode).toBe(200)
  })

  it('answers 400 naming the invalid field, without calling the service', async () => {
    const res = mockResponse()

    await closeRegister(request({ id: '1' }, { ...validBody, countedCash: 10.5 }), res)

    expect(res.statusCode).toBe(400)
    expect(res.body).toMatchObject({ field: 'countedCash' })
    expect(cashRegisterService.closeRegister).not.toHaveBeenCalled()
  })

  it('answers 409 ALREADY_CLOSED', async () => {
    vi.mocked(cashRegisterService.closeRegister).mockRejectedValue(new AlreadyClosedError())
    const res = mockResponse()

    await closeRegister(request({ id: '1' }, validBody), res)

    expect(res.statusCode).toBe(409)
    expect(res.body).toMatchObject({ code: 'ALREADY_CLOSED' })
  })

  it('answers 409 EXPECTED_CHANGED with the new expected amounts', async () => {
    vi.mocked(cashRegisterService.closeRegister).mockRejectedValue(
      new ExpectedChangedError({ cash: 14400, transfer: 6000 })
    )
    const res = mockResponse()

    await closeRegister(request({ id: '1' }, validBody), res)

    expect(res.statusCode).toBe(409)
    expect(res.body).toMatchObject({
      code: 'EXPECTED_CHANGED',
      expected: { cash: 14400, transfer: 6000 }
    })
  })

  it('answers 404 for an unknown register', async () => {
    vi.mocked(cashRegisterService.closeRegister).mockRejectedValue(new RegisterNotFoundError())
    const res = mockResponse()

    await closeRegister(request({ id: '404' }, validBody), res)

    expect(res.statusCode).toBe(404)
  })
})
