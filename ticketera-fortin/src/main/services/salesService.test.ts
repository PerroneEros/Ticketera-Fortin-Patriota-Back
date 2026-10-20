import { beforeEach, describe, expect, it, vi } from 'vitest'

// Real SQLite with the migrated schema instead of the userData file, and no physical printer.
vi.mock('../database/db', async () => {
  const { createMigratedSequelize } = await import('../database/testing/testDb')
  return { default: await createMigratedSequelize() }
})
vi.mock('./printerService', () => ({
  printerService: { printTickets: vi.fn(() => Promise.resolve()) }
}))

import sequelize from '../database/db'
import { resetData } from '../database/testing/testDb'
import { initAssociations } from '../model/associations'
import Category from '../model/category'
import Product from '../model/product'
import Sales from '../model/sales'
import Sale_items from '../model/sale_items'
import Cash_register from '../model/cash_registers'
import { printerService } from './printerService'
import { salesService } from './salesService'
import { CreateSaleInput } from '../schemas/salesSchema'

initAssociations()

let coca: Product
let pancho: Product

beforeEach(async () => {
  await resetData(sequelize)
  vi.mocked(printerService.printTickets).mockClear()
  const category = await Category.create({ name: 'Bebidas' })
  coca = await Product.create({
    name: 'Coca Cola',
    price: 1500,
    category_id: category.category_id,
    isActive: true
  })
  pancho = await Product.create({
    name: 'Pancho',
    price: 2000,
    category_id: category.category_id,
    isActive: true
  })
  await Cash_register.create({
    opening: 10000,
    closing: 0,
    opened_at: new Date(),
    status: 'open'
  } as never)
})

const sale = (overrides: Partial<CreateSaleInput> = {}): CreateSaleInput => ({
  paymentMethod: 'efectivo',
  cashAmount: 0,
  transferAmount: 0,
  expectedTotal: 5000,
  items: [
    { id_product: coca.id_product, quantity: 2 },
    { id_product: pancho.id_product, quantity: 1 }
  ],
  ...overrides
})

describe('salesService.executeSale', () => {
  it('stores one row per unit with DB prices and prints one ticket per unit', async () => {
    await salesService.executeSale(sale())

    const [stored] = await Sales.findAll()
    expect(stored).toMatchObject({
      total: 5000,
      paymentMethod: 'efectivo',
      cashAmount: 5000,
      transferAmount: 0
    })
    expect(await Sale_items.count({ where: { sale_id: stored.sales_id } })).toBe(3)
    expect(printerService.printTickets).toHaveBeenCalledWith(['Coca Cola', 'Coca Cola', 'Pancho'])
  })

  it('rejects the sale when the price changed after the cart was built', async () => {
    await coca.update({ price: 1800 })

    await expect(salesService.executeSale(sale())).rejects.toThrow('Los precios cambiaron')
    expect(await Sales.count()).toBe(0)
    expect(printerService.printTickets).not.toHaveBeenCalled()
  })

  it('does not sell disabled products', async () => {
    await pancho.update({ isActive: false })

    await expect(salesService.executeSale(sale())).rejects.toThrow('no encontrado o deshabilitado')
    expect(await Sales.count()).toBe(0)
  })

  it('splits a combined payment as sent when it adds up to the total', async () => {
    await salesService.executeSale(
      sale({ paymentMethod: 'combinado', cashAmount: 3000, transferAmount: 2000 })
    )

    expect(await Sales.findOne()).toMatchObject({ cashAmount: 3000, transferAmount: 2000 })
  })

  it('rejects a combined payment that does not add up and leaves nothing stored', async () => {
    await expect(
      salesService.executeSale(
        sale({ paymentMethod: 'combinado', cashAmount: 1000, transferAmount: 1000 })
      )
    ).rejects.toThrow('deben sumar el total')
    expect(await Sales.count()).toBe(0)
    expect(await Sale_items.count()).toBe(0)
  })

  it('charges a transfer sale entirely as transfer, ignoring the amounts sent', async () => {
    await salesService.executeSale(sale({ paymentMethod: 'transferencia', cashAmount: 999 }))

    expect(await Sales.findOne()).toMatchObject({ cashAmount: 0, transferAmount: 5000 })
  })

  it('requires an open cash register', async () => {
    await Cash_register.update({ status: 'closed' }, { where: {} })

    await expect(salesService.executeSale(sale())).rejects.toThrow('No hay ninguna caja abierta')
  })

  it('no longer exposes a way to delete sales', () => {
    expect(salesService).not.toHaveProperty('cancelSale')
  })
})
