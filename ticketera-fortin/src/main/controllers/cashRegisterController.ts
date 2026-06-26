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

export const getCurrentRegister = async (_req: Request, res: Response): Promise<void> => {
  try {
    const current = await cashRegisterService.getCurrentRegister()
    if (!current) {
      res.status(200).json({ status: 'closed', message: 'No hay ninguna caja abierta actualmente.' })
      return
    }
    res.status(200).json(current)
  } catch (error) {
    console.error('Error al obtener la caja actual:', error)
    res.status(500).json({ message: 'Error interno al obtener la caja.' })
  }
}

export const getAllRegisters = async (_req: Request, res: Response): Promise<void> => {
  try {
    const registers = await cashRegisterService.getAllRegisters()
    res.status(200).json(registers)
  } catch (error) {
    console.error('Error al obtener el historial de cajas:', error)
    res.status(500).json({ message: 'Error interno al obtener el historial.' })
  }
}

export const getRegisterById = async (req: Request, res: Response): Promise<void> => {
  try {
    const register = await cashRegisterService.getRegisterById(req.params.id)
    res.status(200).json(register)
  } catch (error: any) {
    res.status(404).json({ message: error.message })
  }
}