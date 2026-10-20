import { z } from 'zod'

const PAY_METHODS = ['efectivo', 'transferencia', 'combinado'] as const

// Validamos cada ítem que viene en el array de productos
const itemSchema = z.object({
  id_product: z
    .number({
      message: 'El ID del producto es obligatorio y debe ser un número.'
    })
    .int('El ID del producto debe ser un número entero.')
    .positive('El ID del producto debe ser positivo.'),

  // Each unit becomes one row and one printed ticket, so the cap also protects memory.
  quantity: z
    .number({
      message: 'La cantidad es obligatoria y debe ser un número.'
    })
    .int('La cantidad debe ser un número entero.')
    .min(1, 'La cantidad mínima por producto es 1.')
    .max(500, 'La cantidad máxima por producto es 500.')
})

export const createSaleSchema = z.object({
  paymentMethod: z.enum(PAY_METHODS, {
    message:
      "El método de pago es obligatorio y debe ser 'efectivo', 'transferencia' o 'combinado'."
  }),

  // Hacemos que los montos sean opcionales y por defecto 0 para facilitar el envío desde el front
  cashAmount: z
    .number()
    .int('El monto en efectivo debe ser un número entero.')
    .min(0, 'El monto en efectivo no puede ser negativo.')
    .optional()
    .default(0),
  transferAmount: z
    .number()
    .int('El monto en transferencia debe ser un número entero.')
    .min(0, 'El monto en transferencia no puede ser negativo.')
    .optional()
    .default(0),

  // Total the cashier saw; the sale is rejected if prices changed after the cart was built.
  expectedTotal: z
    .number({ message: 'El total de la venta es obligatorio.' })
    .int('El total debe ser un número entero.')
    .min(0, 'El total no puede ser negativo.'),

  items: z
    .array(itemSchema)
    .min(1, 'La venta debe incluir al menos un producto.')
    .max(100, 'Demasiados productos distintos en una venta.')
})

export type CreateSaleInput = z.infer<typeof createSaleSchema>

// Local date-time as the dashboard sends it, e.g. 2026-10-20T00:00:00.
const localDateTime = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}(:\d{2})?)?$/, 'Fecha inválida.')
  .refine((value) => !Number.isNaN(new Date(value).getTime()), 'Fecha inválida.')

// "All time" may arrive as empty strings.
const optionalDate = z.preprocess((v) => (v === '' ? undefined : v), localDateTime.optional())

// Summary of a date range (from + to), of one register, or of all time (no filter).
export const summaryQuerySchema = z
  .object({
    from: optionalDate,
    to: optionalDate,
    cash_register_id: z.coerce
      .number({ message: 'La caja debe ser un número.' })
      .int('La caja debe ser un número entero.')
      .positive('La caja debe ser un número positivo.')
      .optional()
  })
  .refine((query) => (query.from === undefined) === (query.to === undefined), {
    message: 'El rango necesita fecha desde y hasta.'
  })
  .refine((query) => query.cash_register_id === undefined || query.from === undefined, {
    message: 'Filtrá por fechas o por caja, no por ambas.'
  })
