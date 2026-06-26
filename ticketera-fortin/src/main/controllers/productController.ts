import { Request, Response } from 'express'
import { productService } from '../services/productService'

export const getProducts = async (_req: Request, res: Response): Promise<void> => {
  try {
    const products = await productService.getAllProducts()
    res.status(200).json(products)
  } catch (error) {
    console.error('Error al recuperar los productos:', error)
    res.status(500).json({ message: 'Error interno al recuperar los productos.' })
  }
}



export const createProduct = async (req: Request, res: Response): Promise<void> => {
  try {
    const newProduct = await productService.createProduct(req.body)
    res.status(201).json({ message: 'Producto creado con éxito.', product: newProduct })
  } catch (error: any) {
    res.status(400).json({ message: error.message || 'Error al crear el producto.' })
  }
}

export const updateProduct = async (req: Request, res: Response): Promise<void> => {
  try {
    const updatedProduct = await productService.updateProduct(req.params.id, req.body)
    res.status(200).json({ message: 'Producto actualizado.', product: updatedProduct })
  } catch (error: any) {
    res.status(400).json({ message: error.message })
  }
}

export const deleteProduct = async (req: Request, res: Response): Promise<void> => {
  try {
    await productService.deleteProduct(req.params.id)
    res.status(200).json({ message: 'Producto eliminado correctamente.' })
  } catch (error: any) {
    res.status(400).json({ message: error.message })
  }
}