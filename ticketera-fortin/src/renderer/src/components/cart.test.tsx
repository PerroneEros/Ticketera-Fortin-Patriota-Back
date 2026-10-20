// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'

const createSale = vi.hoisted(() => vi.fn())
vi.mock('./service/salesService', () => ({ salesServiceFront: { createSale } }))
const getCurrentRegister = vi.hoisted(() => vi.fn())
vi.mock('./service/cashRegisterService', () => ({ getCurrentRegister }))
vi.mock('react-hot-toast', () => ({ default: { success: vi.fn(), error: vi.fn() } }))

const setCartList = vi.fn()
vi.mock('./context/cartListContext', () => ({
  useCartList: () => ({
    cartList: [
      { id_product: 1, name: 'Coca Cola', price: 1500, quantity: 2 },
      { id_product: 2, name: 'Pancho', price: 2000, quantity: 1 }
    ],
    updateQuantity: vi.fn(),
    setCartList
  })
}))

import Cart from './cart'

beforeEach(() => {
  createSale.mockReset()
  setCartList.mockReset()
})
afterEach(cleanup)

const payInCash = (): void => {
  render(<Cart />)
  fireEvent.click(screen.getByRole('button', { name: 'Cobrar' }))
  fireEvent.click(screen.getByRole('button', { name: /Efectivo/ }))
  fireEvent.click(screen.getByRole('button', { name: 'Confirmar Pago' }))
}

describe('Cart checkout', () => {
  it('sends only what the API accepts, including the total the cashier saw', async () => {
    createSale.mockResolvedValue({})

    payInCash()

    await waitFor(() => expect(createSale).toHaveBeenCalledOnce())
    expect(createSale).toHaveBeenCalledWith({
      paymentMethod: 'efectivo',
      cashAmount: 5000,
      transferAmount: 0,
      expectedTotal: 5000,
      items: [
        { id_product: 1, quantity: 2 },
        { id_product: 2, quantity: 1 }
      ]
    })
    expect(getCurrentRegister).not.toHaveBeenCalled()
    await waitFor(() => expect(setCartList).toHaveBeenCalledWith([]))
  })

  it('shows the reason given by the API and keeps the cart when the sale is rejected', async () => {
    createSale.mockRejectedValue({
      response: { data: { message: 'Los precios cambiaron desde que se armó el carrito.' } }
    })

    payInCash()

    expect(
      await screen.findByText('Los precios cambiaron desde que se armó el carrito.')
    ).toBeTruthy()
    expect(setCartList).not.toHaveBeenCalled()
  })
})
