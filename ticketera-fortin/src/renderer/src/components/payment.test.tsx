// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
  type RenderResult
} from '@testing-library/react'
import Payment from './payment'

afterEach(cleanup)

const renderPayment = (method: string, onConfirm: () => Promise<void>): RenderResult =>
  render(
    <Payment
      method={method}
      total={1000}
      onClose={vi.fn()}
      onConfirm={onConfirm}
      onBack={vi.fn()}
    />
  )

describe('Payment', () => {
  it('submits the sale only once when "Confirmar Pago" is clicked twice', () => {
    const onConfirm = vi.fn(() => new Promise<void>(() => {}))
    renderPayment('efectivo', onConfirm)

    const button = screen.getByRole('button', { name: 'Confirmar Pago' })
    fireEvent.click(button)
    fireEvent.click(button)

    expect(onConfirm).toHaveBeenCalledTimes(1)
  })

  it('locks the buttons while the sale is being processed', () => {
    renderPayment('efectivo', () => new Promise<void>(() => {}))

    fireEvent.click(screen.getByRole('button', { name: 'Confirmar Pago' }))

    expect(screen.getByRole('button', { name: 'Procesando…' })).toHaveProperty('disabled', true)
    expect(screen.getByRole('button', { name: '← Volver' })).toHaveProperty('disabled', true)
    expect(screen.getByRole('button', { name: 'Cancelar' })).toHaveProperty('disabled', true)
  })

  it('allows a new attempt once the previous one has finished', async () => {
    const onConfirm = vi.fn(() => Promise.resolve())
    renderPayment('efectivo', onConfirm)

    const button = screen.getByRole('button', { name: 'Confirmar Pago' })
    fireEvent.click(button)
    await waitFor(() => expect(button).toHaveProperty('disabled', false))
    fireEvent.click(button)

    expect(onConfirm).toHaveBeenCalledTimes(2)
  })

  it('does not submit nor lock when the amounts are invalid', () => {
    const onConfirm = vi.fn(() => Promise.resolve())
    renderPayment('combinado', onConfirm)

    const button = screen.getByRole('button', { name: 'Confirmar Pago' })
    fireEvent.click(button)

    expect(onConfirm).not.toHaveBeenCalled()
    expect(screen.getByText('La suma debe ser exactamente $1000.')).toBeTruthy()
    expect(button).toHaveProperty('disabled', false)
  })
})
