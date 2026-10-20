import { z } from 'zod'

// Esquema para abrir la caja
export const openRegisterSchema = z.object({
  opening: z
    .number({
      message: 'El monto de apertura es obligatorio y debe ser un número.'
    })
    .int('El monto de apertura debe ser un número entero.')
    .min(0, 'El monto de apertura no puede ser negativo.')
})

const countedAmount = (label: string): z.ZodNumber =>
  z
    .number({ message: `El ${label} contado es obligatorio y debe ser un número.` })
    .int(`El ${label} contado debe ser un número entero.`)
    .min(0, `El ${label} contado no puede ser negativo.`)

// What the screen showed as expected: only compared with the server's own calculation to detect
// that something changed meanwhile, never stored. It can be negative.
const shownExpected = (label: string): z.ZodNumber =>
  z
    .number({ message: `Falta el ${label} esperado que se mostró.` })
    .int(`El ${label} esperado debe ser un número entero.`)

// Esquema para cerrar la caja
export const closeRegisterSchema = z.object({
  countedCash: countedAmount('efectivo'),
  countedTransfer: countedAmount('monto de transferencias'),
  shownExpectedCash: shownExpected('efectivo'),
  shownExpectedTransfer: shownExpected('monto de transferencias')
})

export type CloseRegisterInput = z.infer<typeof closeRegisterSchema>
