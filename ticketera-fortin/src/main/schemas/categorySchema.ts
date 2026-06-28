import { z } from 'zod'

// Definimos el esquema para crear o actualizar una categoría
export const categorySchema = z.object({
  name: z.string({
    message: 'El nombre es obligatorio y debe ser texto.',
  })
  .trim()
  .min(3, 'El nombre debe tener al menos 3 caracteres.')
  .regex(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/, 'El nombre solo debe contener letras y espacios.')
})