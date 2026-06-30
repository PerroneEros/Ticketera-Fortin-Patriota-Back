import { Request, Response } from 'express'
import { salesService } from '../services/salesService'
import { createSaleSchema } from '../schemas/salesSchema'

export const createSale = async (req: Request, res: Response): Promise<void> => {
  try {
    // 1. Pasamos el body por el escáner de Zod usando el esquema que armamos
    const validation = createSaleSchema.safeParse(req.body)

    // 2. Si falla la validación, cortamos acá y le avisamos al front
    if (!validation.success) {
      res.status(400).json({ message: validation.error.issues[0].message })
      return
    }

    // 3. Si está todo joya, le pasamos la data validada al servicio
    const result = await salesService.executeSale(validation.data)
    
    res.status(201).json({ 
      message: 'Venta registrada con éxito y tickets generados.', 
      sale: result.sale,
      items: result.items
    })
  } catch (error: any) {
    console.error('Error al registrar la venta:', error)
    res.status(400).json({ message: error.message || 'Error al procesar la venta.' })
  }
}

export const getSales = async (_req: Request, res: Response): Promise<void> => {
  try {
    const sales = await salesService.getAllSales()
    res.status(200).json(sales)
  } catch (error) {
    console.error('Error al recuperar las ventas:', error)
    res.status(500).json({ message: 'Error interno al recuperar las ventas.' })
  }
}

export const getSaleById = async (req: Request, res: Response): Promise<void> => {
  try {
    const sale = await salesService.getSaleById(req.params.id)
    res.status(200).json(sale)
  } catch (error: any) {
    console.error('Error al recuperar la venta por ID:', error)
    res.status(404).json({ message: error.message })
  }
}

export const getSalesByCashRegister = async (req: Request, res: Response): Promise<void> => {
  try {
    const sales = await salesService.getSalesByRegister(req.params.cash_register_id)
    res.status(200).json(sales)
  } catch (error) {
    console.error('Error al recuperar las ventas de la caja:', error)
    res.status(500).json({ message: 'Error interno al recuperar las ventas de la caja.' })
  }
}

export const deleteSale = async (req: Request, res: Response): Promise<void> => {
  try {
    await salesService.cancelSale(req.params.id)
    res.status(200).json({ message: 'Venta y tickets eliminados correctamente.' })
  } catch (error: any) {
    console.error('Error al anular la venta:', error)
    res.status(400).json({ message: error.message })
  }
}