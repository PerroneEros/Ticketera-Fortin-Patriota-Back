import Category from '../model/category'
import { CreateCategoryInput, UpdateCategoryInput } from '../model/interface/categoryInputs'

export const categoryService = {  //Esto no seria en el front? tema filtros u ordenamiento
  // Lista todas las categorías ordenadas alfabéticamente
  async getAllCategories() {
    return await Category.findAll({
      order: [['name', 'ASC']]
    })
  },

  // Trae una sola categoría por ID
  async getCategoryById(id: string) {
    // Esto seria para filtrar por categoria pero seria necesaario tenerlo en back?
    const category = await Category.findByPk(id)
    if (!category) throw new Error('Categoría no encontrada.')
    return category
  },

  // Crea una categoría nueva
  async createCategory(data: CreateCategoryInput) { //Habria que validar que no este vacia? y tenga mas de 3 caracteres por ejemplo
    return await Category.create(data as any)
  },

  // Actualizar el nombre de una categoría
  async updateCategory(id: string, data: UpdateCategoryInput) {
    //Validar que el nombre no sea vacio ni nulo y la misma validacion que al crearla
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

    //En este caso al eliminar podriamos hacer que la categoria pueda ser vacio o nulo por ejemplo, en caso de que no exista o no se le asigne
    await category.destroy()
    return true
  }
}// FALTAN LAS VALIDACIONES