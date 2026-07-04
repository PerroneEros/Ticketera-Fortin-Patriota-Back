import { Request, Response } from 'express'
import Cash_movements from '../model/cash_movements'
import Cash_register from '../model/cash_registers'

export const createMovement = async (req: Request, res: Response): Promise<void> => {
  try {
    const { type, amount, description, method } = req.body
    const activeRegister = await Cash_register.findOne({ where: { status: 'open' } })
    
    if (!activeRegister) {
      res.status(400).json({ message: 'No hay ninguna caja abierta para registrar este movimiento.' })
      return
    }
    
    const newMovement = await Cash_movements.create({
      cash_register_id: activeRegister.cash_register_id,
      type,
      amount,
      description,
      method,
      date: new Date()
    })

    res.status(201).json({
      message: 'Movimiento de caja registrado con éxito.',
      movement: newMovement
    })

  } catch (error: any) {
    console.error('Error al registrar el movimiento de caja:', error)
    res.status(500).json({ message: 'Error interno del servidor al procesar el movimiento.' })
  }
}