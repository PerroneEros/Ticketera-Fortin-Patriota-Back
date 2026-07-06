import sequelize from '../database/db'
import { Op } from 'sequelize'
import Sales from '../model/sales'
import Sale_items from '../model/sale_items'
import Product from '../model/product'
import Cash_register from '../model/cash_registers'
import Cash_movements from '../model/cash_movements'
import { CreateSaleInput } from '../schemas/salesSchema'
import { printerService } from './printerService'

export const salesService = {
  //Registrar venta y generar tickets individuales
  async executeSale(data: CreateSaleInput) {
    const t = await sequelize.transaction()

    try {
      const { paymentMethod, cashAmount, transferAmount, items } = data

      const activeRegister = await Cash_register.findOne({ where: { status: 'open' } })

      if (!activeRegister) {
        throw new Error('No hay ninguna caja abierta actualmente para registrar la venta.')
      }

      // REQUIRE: Verificamos que haya productos antes de avanzar
      if (!items || items.length === 0) {
        throw new Error('No se puede registrar una venta sin productos.')
      }

      let calculatedTotal = 0
      const itemsToCreate: {
        id_product: number
        quantity: number
        unit_price: number
        total: number
        printed: boolean
        created_at: Date
      }[] = []

      //Buscamos precios, calcular totales y GENERAR 1 TICKET POR UNIDAD
      for (const item of items) {
        const product = await Product.findByPk(item.id_product)
        if (!product) {
          throw new Error(`Producto con ID ${item.id_product} no encontrado.`)
        }

        const unitPrice = product.price

        for (let i = 0; i < item.quantity; i++) {
          calculatedTotal += unitPrice

          itemsToCreate.push({
            id_product: product.id_product,
            quantity: 1, 
            unit_price: unitPrice,
            total: unitPrice,
            printed: false,
            created_at: new Date()
          })
        }
      }

      //Lógica para el Pago Combinado
      let finalCash = 0
      let finalTransfer = 0

      if (paymentMethod === 'efectivo') {
        finalCash = calculatedTotal
      } else if (paymentMethod === 'transferencia') {
        finalTransfer = calculatedTotal
      } else if (paymentMethod === 'combinado') {
        if ((cashAmount || 0) + (transferAmount || 0) !== calculatedTotal) {
          throw new Error(
            'En pago combinado, el efectivo y la transferencia deben sumar el total de la venta.'
          )
        }
        finalCash = cashAmount || 0
        finalTransfer = transferAmount || 0
      }

      //Crear la venta usando la caja activa
      const newSale = await Sales.create(
        {
          cash_register_id: activeRegister.cash_register_id,
          date: new Date(),
          total: calculatedTotal,
          paymentMethod,
          cashAmount: finalCash,
          transferAmount: finalTransfer
        },
        { transaction: t }
      )

      const finalItems = itemsToCreate.map((item) => ({
        ...item,
        sale_id: newSale.sales_id
      }))

      await Sale_items.bulkCreate(finalItems, { transaction: t })

      await t.commit()
      const savedSaleWithProducts = await salesService.getSaleById(newSale.sales_id.toString())
      
      // ---> ACÁ ESTÁ EL FIX APLICADO <---
      printerService.printTickets((savedSaleWithProducts as any).Sale_items).catch((err) => {
        console.error('Error silencioso de impresión:', err)
      })
      
      return { sale: newSale, items: finalItems }
    } catch (error) {
      await t.rollback()
      throw error
    }
  },

  //Trae el historial completo unificado y filtrado por tiempo
  async getAllSales(filter?: string) {
    let whereClause = {}
    let registerWhereClause = {}

    if (filter && filter !== 'todo') {
      const now = new Date()
      let startDate = new Date()

      if (filter === 'día' || filter === 'dia') {
        startDate.setHours(0, 0, 0, 0)
      } else if (filter === 'semana') {
        startDate.setDate(now.getDate() - 7)
      } else if (filter === 'mes') {
        startDate.setMonth(now.getMonth() - 1)
      }

      whereClause = { date: { [Op.gte]: startDate } }
      registerWhereClause = { opened_at: { [Op.gte]: startDate } } // Filtro para la caja
    }

    const sales = await Sales.findAll({
      where: whereClause,
      include: [{ model: Sale_items, include: [{ model: Product, attributes: ['name'] }] }]
    })

    const movements = await Cash_movements.findAll({
      where: whereClause
    })

    const registers = await Cash_register.findAll({
      where: registerWhereClause
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
  },

  async getSaleById(id: string) {
    const sale = await Sales.findByPk(id, {
      include: [
        { model: Sale_items, include: [{ model: Product, attributes: ['name', 'price'] }] },
        { model: Cash_register, attributes: ['status'] }
      ]
    })
    if (!sale) throw new Error('Venta no encontrada.')
    return sale
  },

  //Trae todas las ventas y movimientos de una caja particular
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
      return new Date(a.date).getTime() - new Date(a.date).getTime()
    })
  },

  async cancelSale(id: string) {
    const t = await sequelize.transaction()
    try {
      const sale = await Sales.findByPk(id)
      if (!sale) throw new Error('La venta no existe.')

      await Sale_items.destroy({ where: { sale_id: id }, transaction: t })
      await sale.destroy({ transaction: t })

      await t.commit()
      return true
    } catch (error) {
      await t.rollback()
      throw error
    }
  }
}