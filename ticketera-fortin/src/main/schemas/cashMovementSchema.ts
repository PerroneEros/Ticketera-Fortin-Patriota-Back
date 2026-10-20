import { z } from 'zod'

export const createMovementSchema = z.object({
  type: z.enum(['ingreso', 'egreso'], { message: "El tipo debe ser 'ingreso' o 'egreso'." }),
  method: z.enum(['efectivo', 'transferencia'], {
    message: "El método debe ser 'efectivo' o 'transferencia'."
  }),
  amount: z
    .number({ message: 'El monto es obligatorio y debe ser un número.' })
    .int('El monto debe ser un número entero.')
    .positive('El monto debe ser mayor a 0.'),
  description: z
    .string({ message: 'La descripción es obligatoria.' })
    .trim()
    .min(3, 'La descripción debe tener al menos 3 caracteres.')
    .max(200, 'La descripción no puede superar los 200 caracteres.')
})

export type CreateMovementInput = z.infer<typeof createMovementSchema>
