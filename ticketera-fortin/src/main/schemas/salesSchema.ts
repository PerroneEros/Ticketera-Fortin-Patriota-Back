import { z } from 'zod'

// Validamos cada ítem que viene en el array de productos
const itemSchema = z.object({
  id_product: z.number({
    message: 'El ID del producto es obligatorio y debe ser un número.',
  }).positive('El ID del producto debe ser positivo.'),
  
  quantity: z.number({
    message: 'La cantidad es obligatoria y debe ser un número.',
  }).min(1, 'La cantidad mínima por producto es 1.')
})

export const createSaleSchema = z.object({ 
  paymentMethod: z.enum(['efectivo', 'transferencia', 'combinado'], {
    errorMap: () => ({ message: "El método de pago debe ser 'efectivo', 'transferencia' o 'combinado'." })
  }),
  
  // Hacemos que los montos sean opcionales y por defecto 0 para facilitar el envío desde el front
  cashAmount: z.number().min(0, 'El monto en efectivo no puede ser negativo.').optional().default(0),
  transferAmount: z.number().min(0, 'El monto en transferencia no puede ser negativo.').optional().default(0),
  
  items: z.array(itemSchema).min(1, 'La venta debe incluir al menos un producto.')
})