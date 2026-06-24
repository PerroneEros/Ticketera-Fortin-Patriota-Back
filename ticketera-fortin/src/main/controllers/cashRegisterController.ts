import { Request, Response } from 'express'
import Cash_register from '../model/cash_registers'

// Abrir una nueva caja
export const openRegister = async (req: Request, res: Response): Promise<void> => {
  try {
    const { opening } = req.body

    // Validar si ya hay una caja abierta para no duplicar
    const activeRegister = await Cash_register.findOne({ where: { status: 'open' } })
    if (activeRegister) {
      res.status(400).json({ message: 'Ya existe una caja abierta actualmente.' })
      return
    }

    const newRegister = await Cash_register.create({
      opening,
      closing: 0,
      opened_at: new Date(),
      status: 'open'
    })

    res.status(201).json({ message: 'Caja abierta con éxito.', cashRegister: newRegister })
  } catch (error) {
    res.status(500).json({ message: 'Error al abrir la caja.' })
  }
}

// Cerrar la caja activa
export const closeRegister = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params
    const { closing } = req.body

    const register = await Cash_register.findByPk(id)
    if (!register || register.status === 'closed') {
      res.status(404).json({ message: 'Caja no encontrada o ya cerrada.' })
      return
    }

    register.closing = closing
    register.closed_at = new Date()
    register.status = 'closed'
    await register.save()

    res.status(200).json({ message: 'Caja cerrada con éxito.', cashRegister: register })
  } catch (error) {
    res.status(500).json({ message: 'Error al cerrar la caja.' })
  }
}

// Obtengo el estado de la caja actual
export const getCurrentRegister = async (_req: Request, res: Response): Promise<void> => {
  try {
    const current = await Cash_register.findOne({ where: { status: 'open' } })
    res.status(200).json(current || { status: 'closed', message: 'No hay ninguna caja abierta.' })
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener la caja.' })
  }
}