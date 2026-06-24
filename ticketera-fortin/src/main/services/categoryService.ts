import Category from '../model/category'
import { CreateCategoryInput, UpdateCategoryInput } from '../model/interface/categoryInputs'

export const categoryService = {
  // Lista todas las categorías ordenadas alfabéticamente
  async getAllCategories() {
    return await Category.findAll({
      order: [['name', 'ASC']]
    })
  },

  // Trae una sola categoría por ID
  async getCategoryById(id: string) {
    const category = await Category.findByPk(id)
    if (!category) throw new Error('Categoría no encontrada.')
    return category
  },

  // Crea una categoría nueva
  async createCategory(data: CreateCategoryInput) {
    return await Category.create(data as any)
  },

  // Actualizar el nombre de una categoría
  async updateCategory(id: string, data: UpdateCategoryInput) {
    const category = await Category.findByPk(id)
    if (!category) throw new Error('Categoría no encontrada.')

    return await category.update(data)
  },

  // Eliminar una categoría
  async deleteCategory(id: string) {
    const category = await Category.findByPk(id)
    if (!category) throw new Error('Categoría no encontrada.')
    
    // Ojo: En la vida real, si borrás una categoría que ya tiene productos asignados, 
    // la base de datos va a tirar error por la restricción de la clave foránea. 
    await category.destroy()
    return true
  }
}