import { z } from 'zod'

export const createProductSchema = z.object({
  name: z.string({
    message: 'El nombre es obligatorio y debe ser texto.',
  })
  .trim()
  .min(2, 'El nombre debe tener al menos 2 caracteres.'),
  
  price: z.number({
    message: 'El precio es obligatorio y debe ser un número.',
  })
  .min(0, 'El precio no puede ser negativo.'),
  
  category_id: z.number({
    message: 'La categoría es obligatoria y debe ser un número.',
  })
  .positive('El ID de la categoría no es válido.')
})

// Para el Update, usamos .partial() que hace que todos los campos del 
// esquema original sean opcionales (por si solo quieres actualizar el precio)
export const updateProductSchema = createProductSchema.partial()