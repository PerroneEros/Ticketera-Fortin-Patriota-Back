import { Request, Response } from 'express'
import { categoryService } from '../services/categoryService'
import { categorySchema } from '../schemas/categorySchema' // Importamos el esquema

export const getCategories = async (_req: Request, res: Response): Promise<void> => {
  try {
    const categories = await categoryService.getAllCategories()
    res.status(200).json(categories)
  } catch (error) {
    console.error('Error al recuperar las categorías:', error)
    res.status(500).json({ message: 'Error interno al recuperar las categorías.' })
  }
}

export const getCategoryById = async (req: Request, res: Response): Promise<void> => {
  try {
    const category = await categoryService.getCategoryById(req.params.id)
    res.status(200).json(category)
  } catch (error: any) {
    res.status(404).json({ message: error.message })
  }
}

export const createCategory = async (req: Request, res: Response): Promise<void> => {
  try {
    // 1. Validamos req.body con Zod antes de llamar al servicio
    const validation = categorySchema.safeParse(req.body)
    
    if (!validation.success) {
      // Usamos .issues para que TypeScript no arroje error
      res.status(400).json({ message: validation.error.issues[0].message })
      return // Cortamos la ejecución aquí
    }

    // 2. Si pasa la validación, enviamos los datos limpios (validation.data) al servicio
    const newCategory = await categoryService.createCategory(validation.data)
    res.status(201).json({ message: 'Categoría creada con éxito.', category: newCategory })
  } catch (error: any) {
    // Capturamos el error lanzado por el servicio (ej. duplicados)
    res.status(400).json({ message: error.message || 'Error al crear la categoría.' })
  }
}

export const updateCategory = async (req: Request, res: Response): Promise<void> => {
  try {
    // Reutilizamos el mismo esquema para validar los datos de actualización
    const validation = categorySchema.safeParse(req.body)
    
    if (!validation.success) {
      res.status(400).json({ message: validation.error.issues[0].message })
      return
    }

    // 2. Enviamos los datos validados al servicio
    const updatedCategory = await categoryService.updateCategory(req.params.id, validation.data)
    res.status(200).json({ message: 'Categoría actualizada.', category: updatedCategory })
  } catch (error: any) {
    res.status(400).json({ message: error.message })
  }
}

export const deleteCategory = async (req: Request, res: Response): Promise<void> => {
  try {
    await categoryService.deleteCategory(req.params.id)
    res.status(200).json({ message: 'Categoría eliminada correctamente.' })
  } catch (error: any) {
    res.status(400).json({ message: error.message })
  }
}