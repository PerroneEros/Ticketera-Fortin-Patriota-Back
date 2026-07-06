import sequelize from '../database/db'
import { Op } from 'sequelize'
import Sales from '../model/sales'
import Sale_items from '../model/sale_items'
import Product from '../model/product'
import Cash_register from '../model/cash_registers'
import Cash_movements from '../model/cash_movements'
import { CreateSaleInput } from '../schemas/salesSchema' 

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
        id_product: number,
        quantity: number,
        unit_price: number,
        total: number,
        printed: boolean,
        created_at: Date
      }[] = []

      //Buscamos precios, calcular totales y GENERAR 1 TICKET POR UNIDAD
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

      //Lógica para el Pago Combinado
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

      //Crear la venta  usando la caja activa
      const newSale = await Sales.create({
        cash_register_id: activeRegister.cash_register_id,
        date: new Date(),
        total: calculatedTotal,
        paymentMethod,
        cashAmount: finalCash,
        transferAmount: finalTransfer
      }, { transaction: t })

      //Vincular los tickets a la venta y crearlos todos juntos en la BD
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

  //Trae el historial completo unificado y filtrado por tiempo
  async getAllSales(filter?: string) {
    let whereClause = {}
    
    if (filter && filter !== 'todo') {
      const now = new Date()
      let startDate = new Date()

      if (filter === 'día' || filter === 'dia') {
        // Desde las 00:00 del día de hoy
        startDate.setHours(0, 0, 0, 0)
      } else if (filter === 'semana') {
        // Desde hace 7 días exactos
        startDate.setDate(now.getDate() - 7)
      } else if (filter === 'mes') {
        // Desde hace 30 días
        startDate.setMonth(now.getMonth() - 1)
      }

      //Le decimos a Sequelize que la fecha debe ser Mayor o Igual a la fecha de inicio
      whereClause = { date: { [Op.gte]: startDate } }
    }

    //Buscamos todas las ventas aplicando el filtro
    const sales = await Sales.findAll({
      where: whereClause,
      include: [{ model: Sale_items, include: [{ model: Product, attributes: ['name'] }] }]
    })

    //Buscamos todos los movimientos manuales aplicando el mismo filtro
    const movements = await Cash_movements.findAll({
      where: whereClause
    })

    // Formateamos las ventas para el frontend
    const formattedSales = sales.map(sale => ({
      sales_id: sale.sales_id,
      total: Number(sale.total),
      paymentMethod: sale.paymentMethod,
      cashAmount: Number(sale.cashAmount),
      transferAmount: Number(sale.transferAmount),
      date: sale.date,
      Sale_items: (sale as any).Sale_items 
    }))

    //Formateamos los movimientos para que tengan la misma estructura visual
    const formattedMovements = movements.map(mov => ({
      sales_id: mov.movement_id,
      total: Number(mov.amount),
      paymentMethod: mov.type,
      cashAmount: mov.method === 'efectivo' ? Number(mov.amount) : 0,
      transferAmount: mov.method === 'transferencia' ? Number(mov.amount) : 0,
      date: mov.date,
      Sale_items: [],
      description: mov.description, 
      movementMethod: mov.method
    }))

    //Unificamos todo y lo ordenamos de más nuevo a más viejo
    return [...formattedSales, ...formattedMovements].sort((a, b) => {
      return new Date(b.date).getTime() - new Date(a.date).getTime()
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

  //Trae todas las ventas y movimientos de una caja particular 
  async getSalesByRegister(cash_register_id: string) {
    //Buscamos ventas de esta caja específica
    const sales = await Sales.findAll({
      where: { cash_register_id },
      include: [{ model: Sale_items, include: [{ model: Product, attributes: ['name'] }] }]
    })

    //Buscamos movimientos de esta caja específica
    const movements = await Cash_movements.findAll({
      where: { cash_register_id }
    })

    const formattedSales = sales.map(sale => ({
      sales_id: sale.sales_id,
      total: Number(sale.total),
      paymentMethod: sale.paymentMethod,
      cashAmount: Number(sale.cashAmount),
      transferAmount: Number(sale.transferAmount),
      date: sale.date,
      Sale_items: (sale as any).Sale_items
    }))

    const formattedMovements = movements.map(mov => ({
      sales_id: mov.movement_id,
      total: Number(mov.amount),
      paymentMethod: mov.type,
      cashAmount: mov.method === 'efectivo' ? Number(mov.amount) : 0,
      transferAmount: mov.method === 'transferencia' ? Number(mov.amount) : 0,
      date: mov.date,
      Sale_items: [],
      description: mov.description, 
      movementMethod: mov.method
    }))

    //Unificamos y ordenamos de más viejo a más nuevo 
    return [...formattedSales, ...formattedMovements].sort((a, b) => {
      return new Date(a.date).getTime() - new Date(b.date).getTime()
    })
  },

  //Borrar una venta mal cargada
  async cancelSale(id: string) {
    const t = await sequelize.transaction()
    try {
      const sale = await Sales.findByPk(id)
      if (!sale) throw new Error('La venta no existe.')

      // Primero borramos los tickets 
      await Sale_items.destroy({ where: { sale_id: id }, transaction: t })
      
      // Después la venta
      await sale.destroy({ transaction: t })
      
      await t.commit()
      return true
    } catch (error) {
      await t.rollback()
      throw error
    }
  }
}