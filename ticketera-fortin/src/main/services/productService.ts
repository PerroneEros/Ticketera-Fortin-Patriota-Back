import Product from '../model/product'
import Category from '../model/category'
import { CreateProductInput, UpdateProductInput } from '../model/interface/productInputs'

export const productService = {
  // Lista de todos los productos con su categoría
  async getAllProducts() {
    //ES necesario que diga la categoria?
    return await Product.findAll({
      include: [{ model: Category, attributes: ['name'] }],
      order: [['name', 'ASC']] // Los ordenamos alfabéticamente
    }) //Ordenarlos no se hace en el front y se le pone distintas formas? alfabeticamente, ultimo producto agregado, etc
  },

  // Trae un solo producto por ID
  async getProductById(id: string) {
    //Para que nos serviria?
    const product = await Product.findByPk(id, {
      include: [{ model: Category, attributes: ['name'] }]
    })
    if (!product) throw new Error('Producto no encontrado.')
    return product
  },

  // Crear un producto nuevo
  async createProduct(data: CreateProductInput) {
    // Acá podrías validar si la categoría existe antes de crearlo o que en caso qe no le pongan categoria sea alguna en especifico(que no puedan borrar asi no se rompe todo)
    const categoryExists = await Category.findByPk(data.category_id)
    if (!categoryExists) {
      throw new Error('La categoría especificada no existe.')
    }
    
    return await Product.create(data as any) 
  },

  // Actualizar un producto (precio, nombre o categoría)
  async updateProduct(id: string, data: UpdateProductInput) {
    //Validarr todos los campos.
    const product = await Product.findByPk(id)
    if (!product) throw new Error('Producto no encontrado.')

    if (data.category_id) {
      const categoryExists = await Category.findByPk(data.category_id)
      if (!categoryExists) throw new Error('La categoría especificada no existe.')
    }

    return await product.update(data)
  },

  // Eliminar un producto
  async deleteProduct(id: string) {
    const product = await Product.findByPk(id)
    if (!product) throw new Error('Producto no encontrado.')
    
    // Ojo: Si el producto ya se vendió alguna vez, borrarlo puede romper 
    // el historial de ventas. En un caso real se suele "desactivar" (borrado lógico).
    // Pero por ahora lo borramos físicamente.

    //Habria que ver si puede borrarse pero qe no se borre todo "El historial" que tiene el producto
    await product.destroy()
    return true
  }
}// FALTAN LAS VALIDACIONES