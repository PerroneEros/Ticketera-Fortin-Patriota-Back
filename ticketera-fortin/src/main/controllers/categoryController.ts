import { Request, Response } from 'express'
import { categoryService } from '../services/categoryService'

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
    const newCategory = await categoryService.createCategory(req.body)
    res.status(201).json({ message: 'Categoría creada con éxito.', category: newCategory })
  } catch (error: any) {
    res.status(400).json({ message: error.message || 'Error al crear la categoría.' })
  }
}

export const updateCategory = async (req: Request, res: Response): Promise<void> => {
  try {
    const updatedCategory = await categoryService.updateCategory(req.params.id, req.body)
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