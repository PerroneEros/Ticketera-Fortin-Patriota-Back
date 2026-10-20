import sequelize from '../database/db'
import { Transaction } from 'sequelize'
import Sales from '../model/sales'
import Sale_items from '../model/sale_items'
import Product from '../model/product'
import Cash_register from '../model/cash_registers'
import Cash_movements from '../model/cash_movements'
import { CreateSaleInput } from '../schemas/salesSchema'
import { printerService } from './printerService'

type SaleItemToCreate = {
  id_product: number
  quantity: number
  unit_price: number
  total: number
  printed: boolean
  created_at: Date
}

async function buildSaleItems(items: CreateSaleInput['items'], transaction: Transaction) {
  const ids = [...new Set(items.map((item) => item.id_product))]
  const products = await Product.findAll({ where: { id_product: ids, isActive: true }, transaction })
  const productsById = new Map(products.map((product) => [product.id_product, product]))

  const saleItems: SaleItemToCreate[] = []
  const ticketNames: string[] = []
  for (const item of items) {
    const product = productsById.get(item.id_product)
    if (!product) {
      throw new Error(`Producto con ID ${item.id_product} no encontrado o deshabilitado.`)
    }
    // One row and one printed ticket per unit sold.
    for (let i = 0; i < item.quantity; i++) {
      saleItems.push({
        id_product: product.id_product,
        quantity: 1,
        unit_price: product.price,
        total: product.price,
        printed: false,
        created_at: new Date()
      })
      ticketNames.push(product.name)
    }
  }
  const total = saleItems.reduce((sum, item) => sum + item.total, 0)
  return { saleItems, ticketNames, total }
}

function resolvePayment(data: CreateSaleInput, total: number) {
  if (data.paymentMethod === 'efectivo') return { cashAmount: total, transferAmount: 0 }
  if (data.paymentMethod === 'transferencia') return { cashAmount: 0, transferAmount: total }
  if (data.cashAmount + data.transferAmount !== total) {
    throw new Error(
      'En pago combinado, el efectivo y la transferencia deben sumar el total de la venta.'
    )
  }
  return { cashAmount: data.cashAmount, transferAmount: data.transferAmount }
}

export const salesService = {
  async executeSale(data: CreateSaleInput) {
    const t = await sequelize.transaction()

    try {
      const activeRegister = await Cash_register.findOne({
        where: { status: 'open' },
        transaction: t
      })
      if (!activeRegister) {
        throw new Error('No hay ninguna caja abierta actualmente para registrar la venta.')
      }

      const { saleItems, ticketNames, total } = await buildSaleItems(data.items, t)
      if (total !== data.expectedTotal) {
        throw new Error(
          'Los precios cambiaron desde que se armó el carrito. Revisá el total antes de cobrar.'
        )
      }

      const newSale = await Sales.create(
        {
          cash_register_id: activeRegister.cash_register_id,
          date: new Date(),
          total,
          paymentMethod: data.paymentMethod,
          ...resolvePayment(data, total)
        },
        { transaction: t }
      )

      const finalItems = saleItems.map((item) => ({ ...item, sale_id: newSale.sales_id }))
      await Sale_items.bulkCreate(finalItems, { transaction: t })
      await t.commit()

      // The sale is already persisted: a printer failure must not undo it.
      printerService.printTickets(ticketNames).catch((err) => {
        console.error('Error de impresión:', err)
      })

      return { sale: newSale, items: finalItems }
    } catch (error) {
      await t.rollback()
      throw error
    }
  },

  async getSalesByRegister(cash_register_id: string) {
    const sales = await Sales.findAll({
      where: { cash_register_id },
      include: [{ model: Sale_items, include: [{ model: Product, attributes: ['name'] }] }]
    })

    const movements = await Cash_movements.findAll({
      where: { cash_register_id }
    })

    const registers = await Cash_register.findAll({
      where: { cash_register_id }
    })

    const formattedSales = sales.map((sale) => ({
      sales_id: sale.sales_id,
      total: Number(sale.total),
      paymentMethod: sale.paymentMethod,
      cashAmount: Number(sale.cashAmount),
      transferAmount: Number(sale.transferAmount),
      date: sale.date,
      Sale_items: (sale as any).Sale_items
    }))

    const formattedMovements = movements.map((mov) => ({
      sales_id: mov.movement_id + 100000,
      total: Number(mov.amount),
      paymentMethod: mov.type,
      cashAmount: mov.method === 'efectivo' ? Number(mov.amount) : 0,
      transferAmount: mov.method === 'transferencia' ? Number(mov.amount) : 0,
      date: mov.date,
      Sale_items: [],
      description: mov.description,
      movementMethod: mov.method
    }))

    const formattedRegisters = registers.map((reg) => ({
      sales_id: reg.cash_register_id + 500000,
      total: Number(reg.opening),
      paymentMethod: 'apertura',
      cashAmount: Number(reg.opening),
      transferAmount: 0,
      date: reg.opened_at,
      Sale_items: [],
      description: 'Monto inicial en caja',
      movementMethod: 'efectivo'
    }))

    return [...formattedSales, ...formattedMovements, ...formattedRegisters].sort((a, b) => {
      return new Date(b.date).getTime() - new Date(a.date).getTime()
    })
  }
}
