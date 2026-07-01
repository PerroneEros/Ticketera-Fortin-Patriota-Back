import sequelize from '../database/db'
import Sales from '../model/sales'
import Sale_items from '../model/sale_items'
import Product from '../model/product'
import Cash_register from '../model/cash_registers'
import { CreateSaleInput } from '../schemas/salesSchema' 

export const salesService = {
  
  //Registrar venta y generar tickets individuales
  async executeSale(data: CreateSaleInput) {
    const t = await sequelize.transaction()

    try {
      const { paymentMethod, cashAmount, transferAmount, items } = data

      // 1.Buscamos automáticamente la única caja que está abierta
      const activeRegister = await Cash_register.findOne({ where: { status: 'open' } })
      
      if (!activeRegister) {
        throw new Error('No hay ninguna caja abierta actualmente para registrar la venta.')
      }

      if (!items || items.length === 0) {
        throw new Error('No se puede registrar una venta sin productos.')
      }

      let calculatedTotal = 0
      const itemsToCreate: {
        id_product: number,
        quantity: number,
        unit_price: number,
        total: number,
        printed: boolean,
        created_at: Date
      }[] = []

      //2.Buscamos precios, calcular totales y GENERAR 1 TICKET POR UNIDAD
      for (const item of items) {
        const product = await Product.findByPk(item.id_product)
        if (!product) {
          throw new Error(`Producto con ID ${item.id_product} no encontrado.`)
        }

        const unitPrice = product.price

        //Bucle que gira según la cantidad para crear tickets separados
        //Ej: si compran 3 hamburguesas, entra 3 veces acá y crea 3 items distintos
        for (let i = 0; i < item.quantity; i++) {
          calculatedTotal += unitPrice

          itemsToCreate.push({
            id_product: product.id_product,
            quantity: 1, // Obligamos a que la cantidad sea 1 por cada ticket
            unit_price: unitPrice,
            total: unitPrice,
            printed: false,
            created_at: new Date()
          })
        }
      }

      //3.Lógica para el Pago Combinado
      let finalCash = 0;
      let finalTransfer = 0;

      if (paymentMethod === 'efectivo') {
        finalCash = calculatedTotal;
      } else if (paymentMethod === 'transferencia') {
        finalTransfer = calculatedTotal;
      } else if (paymentMethod === 'combinado') {
        if (((cashAmount || 0) + (transferAmount || 0)) !== calculatedTotal) {
          throw new Error('En pago combinado, el efectivo y la transferencia deben sumar el total de la venta.')
        }
        finalCash = cashAmount || 0;
        finalTransfer = transferAmount || 0;
      }

      //4.Crear la venta (Cabecera) usando la caja activa
      const newSale = await Sales.create({
        cash_register_id: activeRegister.cash_register_id,
        date: new Date(),
        total: calculatedTotal,
        paymentMethod,
        cashAmount: finalCash,
        transferAmount: finalTransfer
      }, { transaction: t })

      //5.Vincular los tickets a la venta y crearlos todos juntos en la BD
      const finalItems = itemsToCreate.map(item => ({
        ...item,
        sale_id: newSale.sales_id
      }))

      await Sale_items.bulkCreate(finalItems, { transaction: t })
      
      //Si todo salió bien, guardamos definitivamente (Todo o nada)
      await t.commit() 

      return { sale: newSale, items: finalItems }

    } catch (error) {
      //Si falló algo, cancelamos todo el proceso
      await t.rollback()
      throw error 
    }
  },

  //Trae el historial completo de ventas
  async getAllSales() {
    return await Sales.findAll({
      include: [{ model: Sale_items, include: [{ model: Product, attributes: ['name'] }] }],
      order: [['date', 'DESC']]
    })
  },

  //Trae una sola venta por ID 
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

  //Trae todas las ventas de una caja particular (cierre de caja)
  async getSalesByRegister(cash_register_id: string) {
    return await Sales.findAll({
      where: { cash_register_id },
      include: [{ model: Sale_items, include: [{ model: Product, attributes: ['name'] }] }],
      order: [['date', 'ASC']]
    })
  },

  //Borrar una venta mal cargada
  async cancelSale(id: string) {
    const t = await sequelize.transaction()
    try {
      const sale = await Sales.findByPk(id)
      if (!sale) throw new Error('La venta no existe.')

      // Primero borramos los tickets (hijos)
      await Sale_items.destroy({ where: { sale_id: id }, transaction: t })
      
      // Después la venta (padre)
      await sale.destroy({ transaction: t })
      
      await t.commit()
      return true
    } catch (error) {
      await t.rollback()
      throw error
    }
  }
}