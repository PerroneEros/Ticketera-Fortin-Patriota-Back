import { Request, Response } from 'express'
import { cashMovementService } from '../services/cashMovementService'
import { createMovementSchema } from '../schemas/cashMovementSchema'

export const createMovement = async (req: Request, res: Response): Promise<void> => {
  try {
    const validation = createMovementSchema.safeParse(req.body)

    if (!validation.success) {
      res.status(400).json({ message: validation.error.issues[0].message })
      return
    }

    const newMovement = await cashMovementService.createMovement(validation.data)

    res.status(201).json({
      message: 'Movimiento de caja registrado con éxito.',
      movement: newMovement
    })
  } catch (error: any) {
    console.error('Error al registrar el movimiento de caja:', error)
    res.status(400).json({ message: error.message || 'Error al procesar el movimiento.' })
  }
}
