import { Request, Response } from 'express'
import Product from '../model/product'
import Category from '../model/category'

export const getProducts = async (_req: Request, res: Response): Promise<void> => {
  try {
    const products = await Product.findAll({ include: [Category] })
    res.status(200).json(products)
  } catch (error) {
    res.status(500).json({ message: 'Error al traer los productos.' })
  }
}

export const createProduct = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, price, category_id } = req.body
    const newProduct = await Product.create({ name, price, category_id })
    res.status(201).json(newProduct)
  } catch (error) {
    res.status(500).json({ message: 'Error al crear el producto.' })
  }
}

export const updateProduct = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params
    const { name, price, category_id } = req.body
    
    const product = await Product.findByPk(id)
    if (!product) { res.status(404).json({ message: 'Producto no encontrado.' }); return }

    await product.update({ name, price, category_id })
    res.status(200).json({ message: 'Producto actualizado.', product })
  } catch (error) {
    res.status(500).json({ message: 'Error al actualizar el producto.' })
  }
}