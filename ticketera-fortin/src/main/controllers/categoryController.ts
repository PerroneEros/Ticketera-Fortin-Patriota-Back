import { Request, Response } from 'express'
import Category from '../model/category'

export const getCategories = async (_req: Request, res: Response): Promise<void> => {
  try {
    const categories = await Category.findAll()
    res.status(200).json(categories)
  } catch (error) {
    res.status(500).json({ message: 'Error al traer las categorías.' })
  }
}

export const createCategory = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name } = req.body
    const newCategory = await Category.create({ name })
    res.status(201).json(newCategory)
  } catch (error) {
    res.status(500).json({ message: 'Error al crear la categoría.' })
  }
}