import { z } from 'zod'

// Esquema para abrir la caja
export const openRegisterSchema = z.object({
  opening: z.number({
    message: 'El monto de apertura es obligatorio y debe ser un número.',
  })
  .min(0, 'El monto de apertura no puede ser negativo.') // Permite 0 si arrancan sin efectivo
})

// Esquema para cerrar la caja
export const closeRegisterSchema = z.object({
  closing: z.number({
    message: 'El monto de cierre es obligatorio y debe ser un número.',
  })
  .min(0, 'El monto de cierre no puede ser negativo.')
})