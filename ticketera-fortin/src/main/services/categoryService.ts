import { Op } from 'sequelize' 
import Category from '../model/category'
import Product from '../model/product' 
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
    // 1. Limpiamos el nombre
    const cleanedName = data.name.trim();

    // 2. Traemos todas las categorías (LOG PARA DEPURAR)
    const all = await Category.findAll();
    console.log("Categorías en BD:", all.map(c => c.name));
    console.log("Buscando nombre:", cleanedName);

    // 3. Comparamos manualmente para estar seguros
    const exists = all.some(c => c.name.trim().toLowerCase() === cleanedName.toLowerCase());
    
    if (exists) {
      console.log("¡DUPLICADO DETECTADO!");
      throw new Error('Ya existe una categoría registrada con este nombre.');
    }

    return await Category.create(data as any);
  },

  async updateCategory(id: string, data: UpdateCategoryInput) {
    const category = await Category.findByPk(id)
    if (!category) throw new Error('Categoría no encontrada.')

    // Validamos que el nuevo nombre no pertenezca a OTRA categoría ya existente
    if (data.name) {
      const categoryExists = await Category.findOne({ 
        where: { 
          name: { [Op.iLike]: data.name },
          category_id: { [Op.ne]: id } // Excluimos la categoría actual para permitir guardar el mismo nombre si no cambió
        } 
      })
      
      if (categoryExists) {
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