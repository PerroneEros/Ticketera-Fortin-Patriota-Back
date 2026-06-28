import Category from '../model/category'
import Product from '../model/product' // Importamos Product para poder reasignar los productos
import { CreateCategoryInput, UpdateCategoryInput } from '../model/interface/categoryInputs'

export const categoryService = {
  
  async getAllCategories() {
    return await Category.findAll({
      order: [['name', 'ASC']]
    })
  },

  async getCategoryById(id: string) {
    const category = await Category.findByPk(id)
    if (!category) throw new Error('Categoría no encontrada.')
    return category
  },

  async createCategory(data: CreateCategoryInput) { 
    // Buscamos si ya existe una categoría con ese nombre
    // Usamos data.name porque Zod ya se encargó de enviarlo en el formato correcto
    const categoryExists = await Category.findOne({ where: { name: data.name } })
    
    if (categoryExists) {
      throw new Error('Ya existe una categoría registrada con este nombre.')
    }

    return await Category.create(data as any)
  },

  async updateCategory(id: string, data: UpdateCategoryInput) {
    const category = await Category.findByPk(id)
    if (!category) throw new Error('Categoría no encontrada.')

    // Validamos que el nuevo nombre no pertenezca a OTRA categoría ya existente
    if (data.name) {
      const categoryExists = await Category.findOne({ where: { name: data.name } })
      
      // Si existe y su ID es distinto al que estamos actualizando, hay un conflicto
      if (categoryExists && categoryExists.category_id.toString() !== id) {
        throw new Error('El nombre ingresado ya pertenece a otra categoría.')
      }
    }

    return await category.update(data)
  },

  async deleteCategory(id: string) {
    const category = await Category.findByPk(id)
    if (!category) throw new Error('Categoría no encontrada.')
    
    // BLOQUEO DE SEGURIDAD: Evitar que borren la categoría por defecto
    // Comparamos en minúsculas por si la guardaron como "general", "General" o "GENERAL"
    if (category.name.toLowerCase() === 'general') {
      throw new Error('La categoría "General" es fundamental para el sistema y no puede ser eliminada.')
    }

    // Buscar la categoría "General" en la base de datos para obtener su ID
    let defaultCategory = await Category.findOne({ where: { name: 'General' } })
    
    // Si por algún motivo no existe (ej. base de datos recién creada), la creamos automáticamente
    if (!defaultCategory) {
      defaultCategory = await Category.create({ name: 'General' } as any)
    }

    // REASIGNACIÓN MASIVA:
    // Actualizamos el category_id a la categoría General SOLO en los 
    // productos que pertenecían a la categoría que estamos a punto de borrar.
    await Product.update(
      { category_id: defaultCategory.category_id },
      { where: { category_id: id } }
    )

    // Una vez que los productos están a salvo en "General", borramos la categoría original
    await category.destroy()
    return true
  }
}