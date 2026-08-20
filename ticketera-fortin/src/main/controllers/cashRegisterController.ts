import { Request, Response } from 'express'
import { cashRegisterService } from '../services/cashRegisterService'
import { openRegisterSchema, closeRegisterSchema } from '../schemas/cashRegisterSchema'

export const getCurrentRegister = async (_req: Request, res: Response): Promise<void> => {
  try {
    const current = await cashRegisterService.getCurrentRegister()
    res.status(200).json(current)
  } catch (error: any) {
    res.status(500).json({ message: 'Error al obtener la caja actual.' })
  }
}

export const getAllRegisters = async (req: Request, res: Response): Promise<void> => {
  try {
    const { from, to } = req.query;

    const registers = await cashRegisterService.getAllRegisters(from as string, to as string)
    res.status(200).json(registers)
  } catch (error: any) {
    res.status(500).json({ message: 'Error al obtener el historial de cajas.' })
  }
}

export const openRegister = async (req: Request, res: Response): Promise<void> => { 
  try {
    const validation = openRegisterSchema.safeParse(req.body)
    
    if (!validation.success) {
      res.status(400).json({ message: validation.error.issues[0].message })
      return
    }

    const newRegister = await cashRegisterService.openRegister(validation.data)
    res.status(201).json({ message: 'Caja abierta con éxito.', cashRegister: newRegister })
  } catch (error: any) {
    res.status(400).json({ message: error.message || 'Error al abrir la caja.' })
  }
}

export const closeRegister = async (req: Request, res: Response): Promise<void> => {
  try {
    const validation = closeRegisterSchema.safeParse(req.body)

    if (!validation.success) {
      res.status(400).json({ message: validation.error.issues[0].message })
      return
    }

    const closedRegister = await cashRegisterService.closeRegister(req.params.id, validation.data)
    res.status(200).json({ message: 'Caja cerrada con éxito.', cashRegister: closedRegister })
  } catch (error: any) {
    res.status(400).json({ message: error.message })
  }
}

export const getTurnTotals = async (req: Request, res: Response): Promise<void> => {
  try {
    const totals = await cashRegisterService.getTurnTotals(req.params.id)
    res.status(200).json(totals)
  } catch (error: any) {
    res.status(500).json({ message: 'Error al calcular totales.' })
  }
}