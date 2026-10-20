import { beforeAll, describe, expect, it, vi } from 'vitest'

vi.mock('../database/db', async () => {
  const { createMigratedSequelize } = await import('../database/testing/testDb')
  return { default: await createMigratedSequelize() }
})

import { Op, WhereOptions } from 'sequelize'
import sequelize from '../database/db'
import { resetData } from '../database/testing/testDb'
import { initAssociations } from '../model/associations'
import Category from '../model/category'
import Product from '../model/product'
import Cash_register from '../model/cash_registers'
import Sales from '../model/sales'
import Sale_items from '../model/sale_items'
import Cash_movements from '../model/cash_movements'
import { salesSummaryService, SalesSummary } from './salesSummaryService'

initAssociations()

// ---------------------------------------------------------------------------------------------
// Oracle: the dashboard numbers as the app computed them before this change. A frozen copy of
// `salesService.getAllSales` / `getSalesByRegister` (rows sent to the screen) and of the screen
// logic (`summarizeMovements`, `isRealSale`, DashboardProducts and DashboardPayments counts).
// RF-19 requires the server summary to give the same numbers.
// ---------------------------------------------------------------------------------------------
interface Row {
  paymentMethod: string
  cashAmount: number
  transferAmount: number
  Sale_items: { quantity: number; total: number; id_product: number; Product?: { name: string } }[]
}

async function legacyRows(
  where: { from?: string; to?: string } | { cashRegisterId: number }
): Promise<Row[]> {
  let salesWhere: WhereOptions = {}
  let movementsWhere: WhereOptions = {}
  let registersWhere: WhereOptions = {}
  if ('cashRegisterId' in where) {
    salesWhere = movementsWhere = registersWhere = { cash_register_id: where.cashRegisterId }
  } else if (where.from && where.to) {
    const startDate = new Date(where.from)
    startDate.setHours(0, 0, 0, 0)
    const endDate = new Date(where.to)
    endDate.setHours(23, 59, 59, 999)
    salesWhere = movementsWhere = { date: { [Op.between]: [startDate, endDate] } }
    registersWhere = { opened_at: { [Op.between]: [startDate, endDate] } }
  }
  const sales = await Sales.findAll({
    where: salesWhere,
    include: [{ model: Sale_items, include: [{ model: Product, attributes: ['name'] }] }]
  })
  const movements = await Cash_movements.findAll({ where: movementsWhere })
  const registers = await Cash_register.findAll({ where: registersWhere })
  return [
    ...sales.map((sale) => ({
      paymentMethod: sale.paymentMethod,
      cashAmount: Number(sale.cashAmount),
      transferAmount: Number(sale.transferAmount),
      Sale_items: (sale.get({ plain: true }) as unknown as { Sale_items: Row['Sale_items'] })
        .Sale_items
    })),
    ...movements.map((mov) => ({
      paymentMethod: mov.type,
      cashAmount: mov.method === 'efectivo' ? Number(mov.amount) : 0,
      transferAmount: mov.method === 'transferencia' ? Number(mov.amount) : 0,
      Sale_items: []
    })),
    ...registers.map((reg) => ({
      paymentMethod: 'apertura',
      cashAmount: Number(reg.opening),
      transferAmount: 0,
      Sale_items: []
    }))
  ]
}

function legacySummary(rows: Row[]): SalesSummary {
  const isRealSale = (row: Row): boolean =>
    ['efectivo', 'transferencia', 'combinado'].includes(row.paymentMethod)
  let cashIn = 0
  let cashOut = 0
  let transferIn = 0
  let transferOut = 0
  for (const row of rows) {
    if (row.paymentMethod === 'cierre') continue
    const cash = Number(row.cashAmount) || 0
    const transfer = Number(row.transferAmount) || 0
    if (row.paymentMethod === 'egreso') {
      cashOut += cash
      transferOut += transfer
    } else {
      cashIn += cash
      transferIn += transfer
    }
  }
  const products: Record<string, { quantity: number; total: number }> = {}
  for (const row of rows) {
    if (row.paymentMethod === 'ingreso' || row.paymentMethod === 'egreso') continue
    for (const item of row.Sale_items) {
      const name = item.Product?.name || `Producto #${item.id_product}`
      products[name] ??= { quantity: 0, total: 0 }
      products[name].quantity += item.quantity
      products[name].total += item.total
    }
  }
  const realSales = rows.filter(isRealSale)
  const movements = rows.filter((row) => row.paymentMethod !== 'cierre')
  return {
    salesCount: realSales.length,
    unitsCount: realSales.reduce(
      (acc, sale) => acc + sale.Sale_items.reduce((sum, item) => sum + item.quantity, 0),
      0
    ),
    money: {
      cashIn,
      cashOut,
      transferIn,
      transferOut,
      cashBalance: cashIn - cashOut,
      transferBalance: transferIn - transferOut,
      total: cashIn - cashOut + (transferIn - transferOut)
    },
    operations: {
      cash: movements.filter((row) => Number(row.cashAmount) > 0).length,
      transfer: movements.filter((row) => Number(row.transferAmount) > 0).length
    },
    // The screen sorted by quantity only; ties are ordered by name for a stable comparison.
    products: Object.entries(products)
      .map(([name, stats]) => ({ name, ...stats }))
      .sort((a, b) => b.quantity - a.quantity || a.name.localeCompare(b.name))
  }
}

// ---------------------------------------------------------------------------------------------
// Seed: two days, three registers, every payment method, movements of both kinds, a product
// without name lookup (deleted) and an opening of 0.
// ---------------------------------------------------------------------------------------------
const at = (day: number, hour: number, minute = 0): Date => new Date(2026, 9, day, hour, minute)

async function seed(): Promise<void> {
  await resetData(sequelize)
  const category = await Category.create({ name: 'Bebidas' })
  const coca = await Product.create({
    name: 'Coca',
    price: 1500,
    category_id: category.category_id,
    isActive: true
  })
  const pancho = await Product.create({
    name: 'Pancho',
    price: 2000,
    category_id: category.category_id,
    isActive: true
  })
  const agua = await Product.create({
    name: 'Agua',
    price: 1000,
    category_id: category.category_id,
    isActive: true
  })

  const registers = [
    { opening: 10000, opened_at: at(10, 18), closed_at: at(10, 23), status: 'closed' },
    { opening: 0, opened_at: at(11, 17), closed_at: at(11, 22), status: 'closed' },
    // Opened late on the 11th (local time), so in UTC it is already the 12th.
    { opening: 5000, opened_at: at(11, 22, 30), status: 'open' }
  ]
  for (const [i, data] of registers.entries()) {
    const register = await Cash_register.create({ ...data, closing: 0 } as never)
    const day = data.opened_at.getDate()
    const hour = data.opened_at.getHours()
    const sell = async (
      paymentMethod: 'efectivo' | 'transferencia' | 'combinado',
      items: [Product, number][],
      cashShare: number,
      minute: number
    ): Promise<void> => {
      const total = items.reduce((sum, [product, qty]) => sum + product.price * qty, 0)
      const cashAmount =
        paymentMethod === 'efectivo' ? total : paymentMethod === 'transferencia' ? 0 : cashShare
      const sale = await Sales.create({
        cash_register_id: register.cash_register_id,
        date: at(day, hour, minute),
        total,
        paymentMethod,
        cashAmount,
        transferAmount: total - cashAmount
      })
      for (const [product, qty] of items) {
        for (let unit = 0; unit < qty; unit++) {
          await Sale_items.create({
            sale_id: sale.sales_id,
            id_product: product.id_product,
            quantity: 1,
            unit_price: product.price,
            total: product.price,
            printed: true,
            created_at: at(day, hour, minute)
          } as never)
        }
      }
    }
    await sell('efectivo', [[coca, 2]], 0, 5 + i)
    await sell(
      'transferencia',
      [
        [pancho, 1],
        [agua, 3]
      ],
      0,
      10 + i
    )
    await sell(
      'combinado',
      [
        [coca, 1],
        [pancho, 2]
      ],
      2000 + i * 100,
      15 + i
    )
    const move = (
      type: 'ingreso' | 'egreso',
      method: 'efectivo' | 'transferencia',
      amount: number,
      minute: number
    ): Promise<Cash_movements> =>
      Cash_movements.create({
        cash_register_id: register.cash_register_id,
        type,
        method,
        amount,
        description: 'Movimiento',
        date: at(day, hour, minute)
      })
    await move('ingreso', 'efectivo', 700 + i, 20)
    await move('egreso', 'efectivo', 300, 21)
    await move('egreso', 'transferencia', 450 + i, 22)
    if (i === 1) await move('ingreso', 'transferencia', 900, 23)
  }
  // A sale of a product that was later removed from the catalog.
  const ghost = await Product.create({
    name: 'Fantasma',
    price: 500,
    category_id: category.category_id,
    isActive: true
  })
  const lastRegister = await Cash_register.findOne({ where: { status: 'open' } })
  const sale = await Sales.create({
    cash_register_id: lastRegister!.cash_register_id,
    date: at(11, 23, 45),
    total: 500,
    paymentMethod: 'efectivo',
    cashAmount: 500,
    transferAmount: 0
  })
  await Sale_items.create({
    sale_id: sale.sales_id,
    id_product: ghost.id_product,
    quantity: 1,
    unit_price: 500,
    total: 500,
    printed: true,
    created_at: at(11, 23, 45)
  } as never)
  await sequelize.query('PRAGMA foreign_keys = OFF')
  await Product.destroy({ where: { id_product: ghost.id_product } })
  await sequelize.query('PRAGMA foreign_keys = ON')
}

beforeAll(seed)

describe('salesSummaryService.getSummary matches what the dashboard showed (RF-19)', () => {
  it.each([
    ['all time', {}],
    ['a single day', { from: '2026-10-10T00:00:00', to: '2026-10-10T23:59:59' }],
    [
      'the late-night day (UTC already next day)',
      { from: '2026-10-11T00:00:00', to: '2026-10-11T23:59:59' }
    ],
    ['a range of days', { from: '2026-10-10T00:00:00', to: '2026-10-12T23:59:59' }],
    ['an empty range', { from: '2026-09-01T00:00:00', to: '2026-09-02T23:59:59' }]
  ])('for %s', async (_label, range) => {
    const expected = legacySummary(await legacyRows(range))
    // Guard against a vacuous comparison: only the empty range may have no sales.
    expect(expected.salesCount > 0).toBe(_label !== 'an empty range')

    expect(await salesSummaryService.getSummary(range)).toEqual(expected)
  })

  it('for each register', async () => {
    const registers = await Cash_register.findAll()
    expect(registers.length).toBe(3)
    for (const register of registers) {
      const filter = { cashRegisterId: register.cash_register_id }
      const expected = legacySummary(await legacyRows(filter))

      expect(await salesSummaryService.getSummary(filter)).toEqual(expected)
    }
  })

  it('returns zeros and no products for an empty range (RF-22)', async () => {
    const summary = await salesSummaryService.getSummary({
      from: '2026-09-01T00:00:00',
      to: '2026-09-02T23:59:59'
    })

    expect(summary).toEqual({
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
  })
})
