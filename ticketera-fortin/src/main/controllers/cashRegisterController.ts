import { Request, Response } from 'express'
import { cashRegisterService } from '../services/cashRegisterService'
import { openRegisterSchema, closeRegisterSchema } from '../schemas/cashRegisterSchema'

// Obtiene la caja que está actualmente abierta (si hay alguna)
export const getCurrentRegister = async (_req: Request, res: Response): Promise<void> => {
  try {
    const current = await cashRegisterService.getCurrentRegister()
    // Si no hay caja abierta, mandará 'null', lo cual el frontend procesa perfectamente
    res.status(200).json(current)
  } catch (error: any) {
    res.status(500).json({ message: 'Error al obtener la caja actual.' })
  }
}

// Obtiene el historial completo de todas las cajas registradas
export const getAllRegisters = async (_req: Request, res: Response): Promise<void> => {
  try {
    const registers = await cashRegisterService.getAllRegisters()
    res.status(200).json(registers)
  } catch (error: any) {
    res.status(500).json({ message: 'Error al obtener el historial de cajas.' })
  }
}

// Abre un nuevo turno de caja
export const openRegister = async (req: Request, res: Response): Promise<void> => { 
  try {
    // Zod verifica que el body traiga un número válido >= 0
    const validation = openRegisterSchema.safeParse(req.body)
    
    if (!validation.success) {
      res.status(400).json({ message: validation.error.issues[0].message })
      return
    }

    // Enviamos los datos limpios al servicio
    const newRegister = await cashRegisterService.openRegister(validation.data)
    res.status(201).json({ message: 'Caja abierta con éxito.', cashRegister: newRegister })
  } catch (error: any) {
    // Atrapamos errores lógicos, como intentar abrir dos cajas al mismo tiempo
    res.status(400).json({ message: error.message || 'Error al abrir la caja.' })
  }
}

// Cierra el turno de caja actual
export const closeRegister = async (req: Request, res: Response): Promise<void> => {
  try {
    // Zod verifica que el monto de cierre sea válido
    const validation = closeRegisterSchema.safeParse(req.body)

    if (!validation.success) {
      res.status(400).json({ message: validation.error.issues[0].message })
      return
    }

    //  Cerramos la caja enviando el ID por parámetro de ruta y los datos limpios
    const closedRegister = await cashRegisterService.closeRegister(req.params.id, validation.data)
    res.status(200).json({ message: 'Caja cerrada con éxito.', cashRegister: closedRegister })
  } catch (error: any) {
    res.status(400).json({ message: error.message })
  }
}