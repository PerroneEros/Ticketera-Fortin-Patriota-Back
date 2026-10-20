// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react'

vi.mock('../service/salesService', async (importOriginal) => {
  const original = await importOriginal<typeof import('../service/salesService')>()
  return {
    ...original,
    salesServiceFront: { getSummary: vi.fn(), getSalesByRegister: vi.fn() }
  }
})
vi.mock('../service/cashRegisterService', () => ({
  getRegistersByDateRange: vi.fn(),
  getCurrentRegister: vi.fn()
}))
vi.mock('react-hot-toast', () => ({ default: { success: vi.fn(), error: vi.fn() } }))

import { DashboardProvider } from '../context/dashboardContext'
import { getCurrentRegister, getRegistersByDateRange } from '../service/cashRegisterService'
import { salesServiceFront, SalesSummary } from '../service/salesService'
import { DashboardCards } from './DashboardCards'
import { DashboardContent } from './DashboardView'
import { DashboardPayments } from './DashboardPayments'
import { DashboardProducts } from './DashboardProducts'

const summary = (overrides: Partial<SalesSummary> = {}): SalesSummary => ({
  salesCount: 12,
  unitsCount: 30,
  money: {
    cashIn: 25000,
    cashOut: 1500,
    transferIn: 9000,
    transferOut: 500,
    cashBalance: 23500,
    transferBalance: 8500,
    total: 32000
  },
  operations: { cash: 9, transfer: 4 },
  products: [
    { name: 'Coca', quantity: 20, total: 30000 },
    { name: 'Pancho', quantity: 10, total: 20000 }
  ],
  ...overrides
})

const emptySummary = summary({
  salesCount: 0,
  unitsCount: 0,
  money: {
    cashIn: 0,
    cashOut: 0,
    transferIn: 0,
    transferOut: 0,
    cashBalance: 0,
    transferBalance: 0,
    total: 0
  },
  operations: { cash: 0, transfer: 0 },
  products: []
})

const closedBox = {
  cash_register_id: 3,
  status: 'closed',
  opening: 1000,
  closing: 20000,
  opened_at: '2026-10-10T21:00:00.000Z',
  closed_at: '2026-10-11T02:00:00.000Z'
}
const otherClosedBox = { ...closedBox, cash_register_id: 4 }
const openBox = { ...closedBox, cash_register_id: 5, status: 'open', closed_at: null }

const renderDashboard = (): void => {
  render(
    <DashboardProvider>
      <DashboardContent onOpenModal={vi.fn()} />
    </DashboardProvider>
  )
}

// Moving a date switches the dashboard to "filtering" mode with that range.
const filterFrom = (date: string): void => {
  const [from] = document.querySelectorAll('input[type="date"]')
  fireEvent.change(from, { target: { value: date } })
}

beforeEach(() => {
  vi.mocked(salesServiceFront.getSummary).mockReset().mockResolvedValue(summary())
  vi.mocked(salesServiceFront.getSalesByRegister).mockReset().mockResolvedValue([])
  vi.mocked(getRegistersByDateRange).mockReset().mockResolvedValue([closedBox, otherClosedBox])
  vi.mocked(getCurrentRegister).mockReset().mockResolvedValue(null)
})

afterEach(cleanup)

describe('dashboard data loading', () => {
  it('asks the API for the range summary instead of every sale (RF-18)', async () => {
    renderDashboard()
    filterFrom('2026-10-01')

    await waitFor(() =>
      expect(salesServiceFront.getSummary).toHaveBeenCalledWith({
        from: '2026-10-01T00:00:00',
        to: expect.stringMatching(/T23:59:59$/)
      })
    )
    await screen.findByText('12')
    expect(document.body.textContent).toContain('$32.000,00')
  })

  it('does not load the detail of collapsed registers (RF-21)', async () => {
    renderDashboard()
    filterFrom('2026-10-01')

    await waitFor(() => expect(screen.getAllByText(/CAJA DEL/)).toHaveLength(2))
    expect(salesServiceFront.getSalesByRegister).not.toHaveBeenCalled()
    expect(salesServiceFront.getSummary).not.toHaveBeenCalledWith({ cash_register_id: 3 })
  })

  it('loads the detail once when a register is expanded (RF-20)', async () => {
    renderDashboard()
    filterFrom('2026-10-01')
    await waitFor(() => expect(screen.getAllByText(/CAJA DEL/)).toHaveLength(2))
    const header = screen.getAllByText(/CAJA DEL/)[0].closest('div[style*="cursor"]') as HTMLElement

    fireEvent.click(header)
    await waitFor(() => expect(salesServiceFront.getSalesByRegister).toHaveBeenCalledWith(3))
    fireEvent.click(header)
    fireEvent.click(header)

    await screen.findByText('HISTORIAL')
    expect(salesServiceFront.getSalesByRegister).toHaveBeenCalledTimes(1)
    expect(salesServiceFront.getSummary).toHaveBeenCalledWith({ cash_register_id: 3 })
  })

  it('loads the open register right away, as it starts expanded', async () => {
    vi.mocked(getCurrentRegister).mockResolvedValue(openBox)
    renderDashboard()

    await waitFor(() => expect(salesServiceFront.getSalesByRegister).toHaveBeenCalledWith(5))
  })

  it('shows an error on the register that failed and retries only that one (RF-23)', async () => {
    vi.mocked(salesServiceFront.getSalesByRegister).mockRejectedValueOnce(new Error('network'))
    vi.spyOn(console, 'error').mockImplementation(() => undefined)
    renderDashboard()
    filterFrom('2026-10-01')
    await waitFor(() => expect(screen.getAllByText(/CAJA DEL/)).toHaveLength(2))
    fireEvent.click(
      screen.getAllByText(/CAJA DEL/)[0].closest('div[style*="cursor"]') as HTMLElement
    )

    const alert = await screen.findByRole('alert')
    expect(alert.textContent).toContain('No se pudo cargar el detalle de esta caja')
    fireEvent.click(within(alert).getByRole('button', { name: 'Reintentar' }))

    await screen.findByText('HISTORIAL')
    expect(salesServiceFront.getSalesByRegister).toHaveBeenCalledTimes(2)
    expect(vi.mocked(salesServiceFront.getSalesByRegister).mock.calls).toEqual([[3], [3]])
    expect(getRegistersByDateRange).toHaveBeenCalledTimes(2) // initial load + the filter only
  })

  it('says there was nothing in an empty period (RF-22)', async () => {
    vi.mocked(salesServiceFront.getSummary).mockResolvedValue(emptySummary)
    vi.mocked(getRegistersByDateRange).mockResolvedValue([])
    renderDashboard()
    filterFrom('2026-09-01')

    expect(await screen.findByText('Sin movimientos en el período')).toBeTruthy()
    expect(document.body.textContent).toContain('$0,00')
  })

  it('prints the PDF of a collapsed register from its summary only', async () => {
    renderDashboard()
    filterFrom('2026-10-01')
    await waitFor(() => expect(screen.getAllByText(/CAJA DEL/)).toHaveLength(2))

    fireEvent.click(screen.getAllByRole('button', { name: 'Imprimir PDF' })[1])

    await waitFor(() =>
      expect(salesServiceFront.getSummary).toHaveBeenCalledWith({ cash_register_id: 4 })
    )
    expect(salesServiceFront.getSalesByRegister).not.toHaveBeenCalled()
    const iframe = document.querySelector('iframe') as HTMLIFrameElement
    const pdf = iframe.contentDocument?.body.textContent ?? ''
    expect(pdf).toContain('Coca')
    expect(pdf).toContain('Productos Vendidos')
  })
})

describe('summary cards (RF-19)', () => {
  it('show the numbers of the summary', () => {
    render(
      <>
        <DashboardCards summary={summary()} />
        <DashboardPayments summary={summary()} />
        <DashboardProducts summary={summary()} />
      </>
    )

    const text = document.body.textContent ?? ''
    expect(text).toContain('Ventas12')
    expect(text).toContain('Productos30')
    expect(text).toContain('$32.000,00')
    expect(text).toContain('$23.500,00')
    expect(text).toContain('$8.500,00')
    expect(text).toContain('9 movimientos')
    expect(text).toContain('4 movimientos')
    expect(screen.getByText('Coca')).toBeTruthy()
    expect(screen.getByText('Pancho')).toBeTruthy()
  })
})
