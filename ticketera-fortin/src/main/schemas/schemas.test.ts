import { describe, expect, it } from 'vitest'
import { createSaleSchema } from './salesSchema'
import { createMovementSchema } from './cashMovementSchema'
import { createProductSchema, updateProductSchema } from './productSchema'
import { closeRegisterSchema, openRegisterSchema } from './cashRegisterSchema'

const validSale = {
  paymentMethod: 'efectivo',
  expectedTotal: 3000,
  items: [{ id_product: 1, quantity: 2 }]
}

describe('createSaleSchema', () => {
  it('accepts a regular sale and defaults the amounts to 0', () => {
    const result = createSaleSchema.safeParse(validSale)
    expect(result.success).toBe(true)
    expect(result.data).toMatchObject({ cashAmount: 0, transferAmount: 0 })
  })

  it.each([
    ['a huge quantity that would exhaust memory', { items: [{ id_product: 1, quantity: 1e8 }] }],
    ['a fractional quantity', { items: [{ id_product: 1, quantity: 1.5 }] }],
    ['a fractional product id', { items: [{ id_product: 1.2, quantity: 1 }] }],
    [
      'too many different products',
      { items: Array.from({ length: 101 }, (_, i) => ({ id_product: i + 1, quantity: 1 })) }
    ],
    ['a fractional cash amount', { cashAmount: 10.5 }],
    ['a fractional transfer amount', { transferAmount: 0.99 }],
    ['a missing expected total', { expectedTotal: undefined }],
    ['a fractional expected total', { expectedTotal: 100.5 }]
  ])('rejects %s', (_label, override) => {
    expect(createSaleSchema.safeParse({ ...validSale, ...override }).success).toBe(false)
  })

  it('drops fields the API does not accept', () => {
    const result = createSaleSchema.parse({ ...validSale, cash_register_id: 99, total: 1 })
    expect(result).not.toHaveProperty('cash_register_id')
    expect(result).not.toHaveProperty('total')
  })
})

describe('createMovementSchema', () => {
  const validMovement = { type: 'egreso', method: 'efectivo', amount: 5000, description: 'Hielo' }

  it('accepts a valid movement and trims the description', () => {
    const result = createMovementSchema.parse({ ...validMovement, description: '  Hielo  ' })
    expect(result.description).toBe('Hielo')
  })

  it.each([
    ['a negative amount', { amount: -50000 }],
    ['a zero amount', { amount: 0 }],
    ['a fractional amount', { amount: 10.5 }],
    ['an amount sent as text', { amount: '5000' }],
    ['an unknown type', { type: 'retiro' }],
    ['an unknown method', { method: 'tarjeta' }],
    ['an empty description', { description: '   ' }],
    ['a description that is too long', { description: 'x'.repeat(201) }]
  ])('rejects %s', (_label, override) => {
    expect(createMovementSchema.safeParse({ ...validMovement, ...override }).success).toBe(false)
  })
})

describe('product and cash register amounts', () => {
  it('rejects fractional prices on create and update', () => {
    expect(
      createProductSchema.safeParse({ name: 'Coca', price: 1500.5, category_id: 1 }).success
    ).toBe(false)
    expect(updateProductSchema.safeParse({ price: 0.5 }).success).toBe(false)
  })

  it('accepts whole prices', () => {
    expect(
      createProductSchema.safeParse({ name: 'Coca', price: 1500, category_id: 1 }).success
    ).toBe(true)
  })

  it('rejects fractional opening amounts', () => {
    expect(openRegisterSchema.safeParse({ opening: 100.5 }).success).toBe(false)
    expect(openRegisterSchema.safeParse({ opening: 10000 }).success).toBe(true)
  })
})

describe('closeRegisterSchema', () => {
  const validClose = {
    countedCash: 25000,
    countedTransfer: 8000,
    shownExpectedCash: 25000,
    shownExpectedTransfer: 8000
  }

  it('accepts whole counted amounts and negative shown expectations', () => {
    expect(closeRegisterSchema.safeParse(validClose).success).toBe(true)
    expect(closeRegisterSchema.safeParse({ ...validClose, shownExpectedCash: -500 }).success).toBe(
      true
    )
  })

  it.each([
    ['countedCash', { countedCash: -1 }],
    ['countedCash', { countedCash: 100.5 }],
    ['countedCash', { countedCash: undefined }],
    ['countedTransfer', { countedTransfer: -20 }],
    ['countedTransfer', { countedTransfer: 0.1 }],
    ['countedTransfer', { countedTransfer: '800' }],
    ['shownExpectedCash', { shownExpectedCash: 10.5 }],
    ['shownExpectedTransfer', { shownExpectedTransfer: undefined }]
  ])('rejects an invalid %s and names the field', (field, change) => {
    const result = closeRegisterSchema.safeParse({ ...validClose, ...change })
    expect(result.success).toBe(false)
    expect(result.error?.issues[0].path).toEqual([field])
    expect(result.error?.issues[0].message).toMatch(/[a-záéíóú]/)
  })
})
