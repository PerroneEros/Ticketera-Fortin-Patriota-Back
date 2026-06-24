import { Request, Response } from 'express'
import sequelize from './../database/db'
import Sales from '../model/sales'
import Sale_items from '../model/sale_items'
import Product from '../model/product'
import Cash_register from '../model/cash_registers'

export const createSale = async (req: Request, res: Response): Promise<void> => {
  const t = await sequelize.transaction()

  try {
    const { cash_register_id, paymentMethod, cashAmount, transferAmount, items } = req.body

    // 1. Valido que la caja exista y esté abierta
    const cashRegister = await Cash_register.findByPk(cash_register_id)
    if (!cashRegister || cashRegister.status !== 'open') {
       res.status(400).json({ message: 'La caja especificada no existe o no se encuentra abierta.' })
       return
    }

    // 2. Valido que haya productos en la venta
    if (!items || items.length === 0) {
       res.status(400).json({ message: 'No se puede registrar una venta sin productos.' })
       return
    }

    let calculatedTotal = 0
    const itemsToCreate = []

    // 2. Calculo el total de la venta
    for (const item of items) {
      const product = await Product.findByPk(item.id_product)
      if (!product) {
        await t.rollback()
        res.status(404).json({ message: `Producto con ID ${item.id_product} no encontrado.` })
        return
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

    // 3. Creo la venta
    const newSale = await Sales.create({
      cash_register_id,
      date: new Date(),
      total: calculatedTotal,
      paymentMethod,
      cashAmount: paymentMethod === 'efectivo' ? calculatedTotal : (cashAmount || 0),
      transferAmount: paymentMethod === 'transferencia' ? calculatedTotal : (transferAmount || 0)
    }, { transaction: t })

    // 4. Creo los items de la venta
    const finalItems = itemsToCreate.map(item => ({
      ...item,
      sale_id: newSale.sales_id
    }))

    await Sale_items.bulkCreate(finalItems, { transaction: t })

    // Si todo salió bien(reza malena) guardo en la base de datos
    await t.commit()

    res.status(201).json({
      message: 'Venta registrada con éxito',
      sale: newSale,
      items: finalItems
    })

  } catch (error) {
    await t.rollback()
    console.error('Error al registrar la venta:', error)
    res.status(500).json({ message: 'Error interno del servidor al procesar la venta.' })
  }
}

// Obtengo el historial de ventas con sus items
export const getSales = async (_req: Request, res: Response): Promise<void> => {
  try {
    const sales = await Sales.findAll({
      include: [
        {
          model: Sale_items,
          include: [{ model: Product, attributes: ['name'] }]
        }
      ],
      order: [['date', 'DESC']]
    })
    res.status(200).json(sales)
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: 'Error al recuperar las ventas.' })
  }
}

// Obtener una sola venta específica por su ID 
export const getSaleById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params
    const sale = await Sales.findByPk(id, {
      include: [
        {
          model: Sale_items,
          include: [{ model: Product, attributes: ['name', 'price'] }]
        },
        {
          model: Cash_register,
          attributes: ['status']
        }
      ]
    })

    if (!sale) {
      res.status(404).json({ message: 'Venta no encontrada.' })
      return
    }

    res.status(200).json(sale)
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: 'Error al recuperar la venta.' })
  }
}

// Obtener todas las ventas asociadas a una caja específica 
  try {
    const { cash_register_id } = req.params
    const sales = await Sales.findAll({
      where: { cash_register_id },
      include: [
        {
          model: Sale_items,
          include: [{ model: Product, attributes: ['name'] }]
        }
      ],
      order: [['date', 'ASC']]
    })

    res.status(200).json(sales)
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: 'Error al recuperar las ventas de la caja.' })
  }
}

// Eliminar una venta
export const deleteSale = async (req: Request, res: Response): Promise<void> => {
  const t = await sequelize.transaction()
  try {
    const { id } = req.params

    const sale = await Sales.findByPk(id)
    if (!sale) {
      res.status(404).json({ message: 'La venta no existe.' })
      return
    }

    // Primero borramos los items asociados por la clave foránea
    await Sale_items.destroy({ where: { sale_id: id }, transaction: t })
    
    await sale.destroy({ transaction: t })

    await t.commit()
    res.status(200).json({ message: 'Venta eliminada correctamente.' })
  } catch (error) {
    await t.rollback()
    console.error(error)
    res.status(500).json({ message: 'Error al eliminar la venta.' })
  }
}