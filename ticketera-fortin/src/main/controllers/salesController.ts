import { Request, Response } from 'express'
import { salesService } from '../services/salesService'
import { createSaleSchema, summaryQuerySchema } from '../schemas/salesSchema'
import { salesSummaryService } from '../services/salesSummaryService'

export const createSale = async (req: Request, res: Response): Promise<void> => {
  try {
    const validation = createSaleSchema.safeParse(req.body)

    if (!validation.success) {
      res.status(400).json({ message: validation.error.issues[0].message })
      return
    }

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

export const getSalesByCashRegister = async (req: Request, res: Response): Promise<void> => {
  try {
    const sales = await salesService.getSalesByRegister(req.params.cash_register_id)
    res.status(200).json(sales)
  } catch (error) {
    console.error('Error al recuperar las ventas de la caja:', error)
    res.status(500).json({ message: 'Error interno al recuperar las ventas de la caja.' })
  }
}

export const getSalesSummary = async (req: Request, res: Response): Promise<void> => {
  const validation = summaryQuerySchema.safeParse(req.query)
  if (!validation.success) {
    res.status(400).json({ message: validation.error.issues[0].message })
    return
  }
  const { from, to, cash_register_id } = validation.data
  try {
    const summary = await salesSummaryService.getSummary(
      cash_register_id !== undefined ? { cashRegisterId: cash_register_id } : { from, to }
    )
    res.status(200).json(summary)
  } catch (error) {
    console.error('Error al calcular el resumen de ventas:', error)
    res.status(500).json({ message: 'Error interno al calcular el resumen.' })
  }
}
