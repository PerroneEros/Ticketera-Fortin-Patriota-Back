import { beforeEach, describe, expect, it, vi } from 'vitest'
import { Request, Response } from 'express'

vi.mock('../database/db', async () => {
  const { Sequelize } = await import('sequelize')
  return { default: new Sequelize({ dialect: 'sqlite', storage: ':memory:', logging: false }) }
})
vi.mock('../services/salesSummaryService', () => ({
  salesSummaryService: { getSummary: vi.fn() }
}))
vi.mock('../services/printerService', () => ({ printerService: { printTickets: vi.fn() } }))

import { salesSummaryService } from '../services/salesSummaryService'
import { getSalesSummary } from './salesController'

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

const call = async (query: Record<string, string>): Promise<ReturnType<typeof mockResponse>> => {
  const res = mockResponse()
  await getSalesSummary({ query } as unknown as Request, res)
  return res
}

beforeEach(() => {
  vi.mocked(salesSummaryService.getSummary).mockReset()
  vi.mocked(salesSummaryService.getSummary).mockResolvedValue({ salesCount: 1 } as never)
  vi.spyOn(console, 'error').mockImplementation(() => undefined)
})

describe('GET /sales/summary', () => {
  it('summarizes a date range', async () => {
    const res = await call({ from: '2026-10-20T00:00:00', to: '2026-10-20T23:59:59' })

    expect(res.statusCode).toBe(200)
    expect(salesSummaryService.getSummary).toHaveBeenCalledWith({
      from: '2026-10-20T00:00:00',
      to: '2026-10-20T23:59:59'
    })
  })

  it('summarizes one register', async () => {
    const res = await call({ cash_register_id: '7' })

    expect(res.statusCode).toBe(200)
    expect(salesSummaryService.getSummary).toHaveBeenCalledWith({ cashRegisterId: 7 })
  })

  it.each([[{}], [{ from: '', to: '' }]])('summarizes all time for %j', async (query) => {
    const res = await call(query)

    expect(res.statusCode).toBe(200)
    expect(salesSummaryService.getSummary).toHaveBeenCalledWith({})
  })

  it.each([
    ['an invalid date', { from: 'ayer', to: '2026-10-20' }],
    ['an impossible date', { from: '2026-13-45', to: '2026-10-20' }],
    ['only one bound', { from: '2026-10-20' }],
    ['both filters', { from: '2026-10-20', to: '2026-10-20', cash_register_id: '7' }],
    ['a non-numeric register', { cash_register_id: 'siete' }],
    ['a fractional register', { cash_register_id: '1.5' }]
  ])('answers 400 for %s', async (_label, query) => {
    const res = await call(query)

    expect(res.statusCode).toBe(400)
    expect(salesSummaryService.getSummary).not.toHaveBeenCalled()
  })

  it('hides unexpected errors behind a generic 500', async () => {
    vi.mocked(salesSummaryService.getSummary).mockRejectedValue(new Error('SQLITE_BUSY'))

    const res = await call({})

    expect(res.statusCode).toBe(500)
    expect(res.body).toEqual({ message: 'Error interno al calcular el resumen.' })
  })
})
