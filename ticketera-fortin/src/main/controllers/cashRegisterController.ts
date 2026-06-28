import { Request, Response } from 'express'
import { cashRegisterService } from '../services/cashRegisterService'
import { openRegisterSchema, closeRegisterSchema } from '../schemas/cashRegisterSchema'

export const openRegister = async (req: Request, res: Response): Promise<void> => { 
  try {
    // 1. Validar que la apertura sea un número >= 0
    const validation = openRegisterSchema.safeParse(req.body)
    
    if (!validation.success) {
      res.status(400).json({ message: validation.error.issues[0].message })
      return
    }

    // 2. Ejecutar servicio
    const newRegister = await cashRegisterService.openRegister(validation.data)
    res.status(201).json({ message: 'Caja abierta con éxito.', cashRegister: newRegister })
  } catch (error: any) {
    res.status(400).json({ message: error.message || 'Error al abrir la caja.' })
  }
}

export const closeRegister = async (req: Request, res: Response): Promise<void> => {
  try {
    // 1. Validar que el cierre sea un número >= 0
    const validation = closeRegisterSchema.safeParse(req.body)

    if (!validation.success) {
      res.status(400).json({ message: validation.error.issues[0].message })
      return
    }

    // 2. Ejecutar servicio
    const closedRegister = await cashRegisterService.closeRegister(req.params.id, validation.data)
    res.status(200).json({ message: 'Caja cerrada con éxito.', cashRegister: closedRegister })
  } catch (error: any) {
    res.status(400).json({ message: error.message })
  }
}