import { Request, Response } from 'express'
import { cashRegisterService } from '../services/cashRegisterService'

export const openRegister = async (req: Request, res: Response): Promise<void> => { // Falataria validacion de que sea un numero y sea mayor a 0
  try {
    const newRegister = await cashRegisterService.openRegister(req.body)
    res.status(201).json({ message: 'Caja abierta con éxito.', cashRegister: newRegister })
  } catch (error: any) {
    res.status(400).json({ message: error.message || 'Error al abrir la caja.' })
  }
}

export const closeRegister = async (req: Request, res: Response): Promise<void> => {
  try {
    const closedRegister = await cashRegisterService.closeRegister(req.params.id, req.body)
    res.status(200).json({ message: 'Caja cerrada con éxito.', cashRegister: closedRegister })
  } catch (error: any) {
    res.status(400).json({ message: error.message })
  }
}



