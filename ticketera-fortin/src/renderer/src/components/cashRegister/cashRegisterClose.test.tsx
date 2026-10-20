// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'

vi.mock('../service/cashRegisterService', () => ({
  getCloseSummary: vi.fn(),
  closeRegister: vi.fn()
}))
vi.mock('react-router-dom', () => ({ useNavigate: () => vi.fn() }))
vi.mock('react-hot-toast', () => ({ default: { success: vi.fn(), error: vi.fn() } }))

import toast from 'react-hot-toast'
import { CashRegisterContext, CashRegister } from '../context/cashRegisterContext'
import { closeRegister, CloseSummary, getCloseSummary } from '../service/cashRegisterService'
import { CashRegisterClose } from './cashRegsiterClose'

const register: CashRegister = {
  cash_register_id: 7,
  opening: 10000,
  closing: 0,
  status: 'open',
  opened_at: '2026-10-20T20:00:00.000Z'
}

const summary = (cash: number, transfer: number): CloseSummary => ({
  opening: 10000,
  sales: { cash: 5000, transfer: 5500 },
  movements: { cashIn: 500, cashOut: 1200, transferIn: 700, transferOut: 200 },
  expected: { cash, transfer }
})

const loadActiveRegister = vi.fn(() => Promise.resolve())

async function openModal(): Promise<void> {
  render(
    <CashRegisterContext.Provider value={{ activeRegister: register, loadActiveRegister }}>
      <CashRegisterClose />
    </CashRegisterContext.Provider>
  )
  fireEvent.click(screen.getByRole('button', { name: 'Cerrar Caja' }))
  await waitFor(() => expect(screen.getAllByRole('button', { name: 'Confirmar' })).toHaveLength(2))
}

const cashInput = (): HTMLElement => screen.getByLabelText('💵 Efectivo en caja contado')
const transferInput = (): HTMLElement =>
  screen.getByLabelText('📱 Transferencias recibidas contado')
const closeButton = (): HTMLElement =>
  screen.getByRole('button', { name: '🔒 Cerrar Caja y Nuevo Turno' })

function count(input: HTMLElement, value: string): void {
  fireEvent.change(input, { target: { value } })
  const row = input.parentElement as HTMLElement
  fireEvent.click(row.querySelector('button') as HTMLElement)
}

beforeEach(() => {
  vi.mocked(getCloseSummary).mockReset()
  vi.mocked(closeRegister).mockReset()
  vi.mocked(toast.error).mockReset()
  loadActiveRegister.mockClear()
})

afterEach(cleanup)

describe('CashRegisterClose', () => {
  it('shows the expected amounts computed by the server, including negatives', async () => {
    vi.mocked(getCloseSummary).mockResolvedValue(summary(-2000, 6000))

    await openModal()

    expect(getCloseSummary).toHaveBeenCalledWith(7)
    const expected = screen.getAllByText('Esperado:', { exact: false }).map((e) => e.textContent)
    expect(expected[0]).toContain('$-2.000,00')
    expect(expected[1]).toContain('$6.000,00')
  })

  it('confirms at once when the count matches the expected amount', async () => {
    vi.mocked(getCloseSummary).mockResolvedValue(summary(14300, 6000))
    await openModal()

    count(cashInput(), '14300')
    count(transferInput(), '6000')

    expect(screen.queryByRole('alert')).toBeNull()
    expect(closeButton()).toHaveProperty('disabled', false)
  })

  it('asks to confirm again when the count does not match, then warns and allows closing', async () => {
    vi.mocked(getCloseSummary).mockResolvedValue(summary(14300, 6000))
    await openModal()

    count(cashInput(), '14000')
    expect(screen.getByRole('alert').textContent).toContain('No coincide con el esperado')
    expect(screen.getByRole('button', { name: 'Confirmar de nuevo' })).toBeTruthy()
    count(transferInput(), '6000')
    expect(closeButton()).toHaveProperty('disabled', true)

    fireEvent.click(screen.getByRole('button', { name: 'Confirmar de nuevo' }))

    const warning = screen.getByRole('alert').textContent ?? ''
    expect(warning).toContain('se va a cerrar con diferencia')
    expect(warning).toContain('-$300,00')
    expect(screen.getByText('Diferencia total del turno')).toBeTruthy()
    expect(closeButton()).toHaveProperty('disabled', false)
  })

  it('asks again if the cashier changes a mismatching count before reconfirming', async () => {
    vi.mocked(getCloseSummary).mockResolvedValue(summary(14300, 6000))
    await openModal()

    count(cashInput(), '14000')
    count(cashInput(), '14100')

    expect(screen.getByRole('alert').textContent).toContain('No coincide')
    expect(screen.queryByText('Diferencia total del turno')).toBeNull()
  })

  it('sends the counts and the expected amounts it showed', async () => {
    vi.mocked(getCloseSummary).mockResolvedValue(summary(14300, 6000))
    vi.mocked(closeRegister).mockResolvedValue({})
    await openModal()
    count(cashInput(), '14300')
    count(transferInput(), '6000')

    fireEvent.click(closeButton())

    await waitFor(() =>
      expect(closeRegister).toHaveBeenCalledWith(7, {
        countedCash: 14300,
        countedTransfer: 6000,
        shownExpectedCash: 14300,
        shownExpectedTransfer: 6000
      })
    )
    expect(loadActiveRegister).toHaveBeenCalled()
  })

  it('reloads the expected amounts and asks to confirm again on EXPECTED_CHANGED', async () => {
    vi.mocked(getCloseSummary)
      .mockResolvedValueOnce(summary(14300, 6000))
      .mockResolvedValueOnce(summary(14400, 6000))
    vi.mocked(closeRegister).mockRejectedValue({
      response: {
        status: 409,
        data: { code: 'EXPECTED_CHANGED', message: 'Hubo movimientos nuevos en la caja' }
      }
    })
    await openModal()
    count(cashInput(), '14300')
    count(transferInput(), '6000')

    fireEvent.click(closeButton())

    await waitFor(() => expect(screen.getByText(/Hubo movimientos nuevos/)).toBeTruthy())
    expect(document.body.textContent).toContain('$14.400,00')
    expect(screen.getAllByRole('button', { name: /Confirmar/ })).toHaveLength(2)
    expect(closeButton()).toHaveProperty('disabled', true)
  })

  it('tells the cashier and reloads the active register on ALREADY_CLOSED', async () => {
    vi.mocked(getCloseSummary).mockResolvedValue(summary(14300, 6000))
    vi.mocked(closeRegister).mockRejectedValue({
      response: {
        status: 409,
        data: { code: 'ALREADY_CLOSED', message: 'Esta caja ya está cerrada.' }
      }
    })
    await openModal()
    count(cashInput(), '14300')
    count(transferInput(), '6000')

    fireEvent.click(closeButton())

    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('Esta caja ya está cerrada.'))
    expect(loadActiveRegister).toHaveBeenCalled()
  })

  it('does not let the cashier count when the expected amounts could not be loaded', async () => {
    vi.mocked(getCloseSummary).mockRejectedValue(new Error('network'))
    render(
      <CashRegisterContext.Provider value={{ activeRegister: register, loadActiveRegister }}>
        <CashRegisterClose />
      </CashRegisterContext.Provider>
    )
    fireEvent.click(screen.getByRole('button', { name: 'Cerrar Caja' }))

    await waitFor(() => expect(screen.getByText(/No se pudieron cargar/)).toBeTruthy())
    expect(cashInput()).toHaveProperty('disabled', true)
    expect(closeButton()).toHaveProperty('disabled', true)
  })
})
