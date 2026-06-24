import sequelize from '../database/db'
import Sales from '../model/sales'
import Sale_items from '../model/sale_items'
import Product from '../model/product'
import Cash_register from '../model/cash_registers'
import { CreateSaleInput } from '../model/interface/salesInputs' // Importamos el DTO del input

export const salesService = {
  // Crear una venta con transacciones (Todo o nada)
  async executeSale(data: CreateSaleInput) {
    const t = await sequelize.transaction()

    try {
      const { cash_register_id, paymentMethod, cashAmount, transferAmount, items } = data

      // 1. Validar que la caja exista y esté abierta
      const cashRegister = await Cash_register.findByPk(cash_register_id)
      if (!cashRegister || cashRegister.status !== 'open') {
        throw new Error('La caja especificada no existe o no se encuentra abierta.')
      }

      // 2. Validar que vengan productos en la petición
      if (!items || items.length === 0) {
        throw new Error('No se puede registrar una venta sin productos.')
      }

      let calculatedTotal = 0
      const itemsToCreate = []

      // 3. Buscar precios y calcula totales 
      for (const item of items) {
        const product = await Product.findByPk(item.id_product)
        if (!product) {
          throw new Error(`Producto con ID ${item.id_product} no encontrado.`)
        }

        const unitPrice = product.price
        const itemTotal = unitPrice * item.quantity
        calculatedTotal += itemTotal

        itemsToCreate.push({
          id_product: product.id_product,
          quantity: item.quantity,
          unit_price: unitPrice,
          total: itemTotal,
          printed: false,
          created_at: new Date()
        })
      }

      // 4. Crear la venta
      const newSale = await Sales.create({
        cash_register_id,
        date: new Date(),
        total: calculatedTotal,
        paymentMethod,
        cashAmount: paymentMethod === 'efectivo' ? calculatedTotal : (cashAmount || 0),
        transferAmount: paymentMethod === 'transferencia' ? calculatedTotal : (transferAmount || 0)
      }, { transaction: t })

      // 5. Crear los items
      const finalItems = itemsToCreate.map(item => ({
        ...item,
        sale_id: newSale.sales_id
      }))

      await Sale_items.bulkCreate(finalItems, { transaction: t })
      
      // Si todo salió bien (reza malena)
      await t.commit()

      return { sale: newSale, items: finalItems }

    } catch (error) {
      await t.rollback()
      throw error // Pasamos el error al controlador
    }
  },

  // Trae el historial completo de ventas
  async getAllSales() {
    return await Sales.findAll({
      include: [{ model: Sale_items, include: [{ model: Product, attributes: ['name'] }] }],
      order: [['date', 'DESC']]
    })
  },

  // Trae una sola venta por ID
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

  // Trae todas las ventas de una caja
  async getSalesByRegister(cash_register_id: string) {
    return await Sales.findAll({
      where: { cash_register_id },
      include: [{ model: Sale_items, include: [{ model: Product, attributes: ['name'] }] }],
      order: [['date', 'ASC']]
    })
  },

  // Borrar una venta mal cargada
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