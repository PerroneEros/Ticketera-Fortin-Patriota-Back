import { Request, Response } from 'express'
import { productService } from '../services/productService'
import { createProductSchema, updateProductSchema } from '../schemas/productSchema'

export const getProducts = async (_req: Request, res: Response): Promise<void> => {
  try {
    // Llamamos al servicio para obtener la lista.
    const products = await productService.getAllProducts()
    
    res.status(200).json(products)
  } catch (error) {
    // Si la base de datos falla, atrapamos el error para que el servidor no se caiga
    console.error('Error al recuperar los productos:', error)
    res.status(500).json({ message: 'Error interno al recuperar los productos.' })
  }
}

export const createProduct = async (req: Request, res: Response): Promise<void> => {
  try {
    // Zod intercepta el body de la petición para verificar que los datos sean correctos
    const validation = createProductSchema.safeParse(req.body)
    
    // Si la validación falla, cortamos el proceso inmediatamente
    if (!validation.success) {
      res.status(400).json({ message: validation.error.issues[0].message })
      return // El 'return' evita que el código siga bajando
    }

    // Si todo está bien, le pasamos los datos ya validados al servicio
    const newProduct = await productService.createProduct(validation.data)
    
    res.status(201).json({ message: 'Producto creado.', product: newProduct })
  } catch (error: any) {
    // Atrapamos errores de negocio del servicio
    res.status(400).json({ message: error.message || 'Error al crear el producto.' })
  }
}

export const updateProduct = async (req: Request, res: Response): Promise<void> => {
  try {
    // Validamos los datos de entrada usando el esquema parcial de actualización
    const validation = updateProductSchema.safeParse(req.body)
    
    if (!validation.success) {
      res.status(400).json({ message: validation.error.issues[0].message })
      return
    }

    const updatedProduct = await productService.updateProduct(req.params.id, validation.data)
    
    res.status(200).json({ message: 'Producto actualizado.', product: updatedProduct })
  } catch (error: any) {
    res.status(400).json({ message: error.message })
  }
}

export const deleteProduct = async (req: Request, res: Response): Promise<void> => {
  try {
    // Solo necesitamos pasarle el ID al servicio para que haga el borrado lógico
    await productService.deleteProduct(req.params.id)
    
    res.status(200).json({ message: 'Producto deshabilitado correctamente.' })
  } catch (error: any) {
    res.status(400).json({ message: error.message })
  }
}

export const reactivateProduct = async (req: Request, res: Response): Promise<void> => {
  try {
    // Llamamos al servicio pasando el ID que viene en la URL
    await productService.reactivateProduct(req.params.id)
    
    res.status(200).json({ message: 'Producto reactivado correctamente.' })
  } catch (error: any) {
    // Si el producto no existe o ya estaba activo, devolvemos un 400
    res.status(400).json({ message: error.message })
  }
}