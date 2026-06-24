import { Request, Response } from 'express'
import { salesService } from '../services/salesService'

export const createSale = async (req: Request, res: Response): Promise<void> => {
  try {
    const result = await salesService.executeSale(req.body)
    res.status(201).json({ message: 'Venta registrada con éxito', ...result })
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
    res.status(200).json({ message: 'Venta eliminada correctamente.' })
  } catch (error: any) {
    console.error('Error al anular la venta:', error)
    res.status(400).json({ message: error.message })
  }
}