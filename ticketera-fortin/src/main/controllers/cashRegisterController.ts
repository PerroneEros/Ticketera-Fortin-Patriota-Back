import { Request, Response } from 'express'
import {
  AlreadyClosedError,
  cashRegisterService,
  ExpectedChangedError,
  RegisterNotFoundError
} from '../services/cashRegisterService'
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
    const { from, to } = req.query

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

// Errors the cashier can act on keep their message; anything else is a generic 500.
function sendCloseError(res: Response, error: unknown, fallback: string): void {
  if (error instanceof RegisterNotFoundError) {
    res.status(404).json({ message: error.message })
  } else if (error instanceof ExpectedChangedError) {
    res.status(409).json({ code: error.code, message: error.message, expected: error.expected })
  } else if (error instanceof AlreadyClosedError) {
    res.status(409).json({ code: error.code, message: error.message })
  } else {
    console.error(fallback, error)
    res.status(500).json({ message: fallback })
  }
}

export const closeRegister = async (req: Request, res: Response): Promise<void> => {
  const validation = closeRegisterSchema.safeParse(req.body)
  if (!validation.success) {
    const issue = validation.error.issues[0]
    res.status(400).json({ message: issue.message, field: String(issue.path[0] ?? '') })
    return
  }
  try {
    const closedRegister = await cashRegisterService.closeRegister(req.params.id, validation.data)
    res.status(200).json({ message: 'Caja cerrada con éxito.', cashRegister: closedRegister })
  } catch (error) {
    sendCloseError(res, error, 'Error al cerrar la caja.')
  }
}

export const getTurnTotals = async (req: Request, res: Response): Promise<void> => {
  try {
    res.status(200).json(await cashRegisterService.getCloseSummary(req.params.id))
  } catch (error) {
    sendCloseError(res, error, 'Error al calcular totales.')
  }
}
