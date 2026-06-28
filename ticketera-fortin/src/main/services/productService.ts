import Product from '../model/product'
import Category from '../model/category'
import { CreateProductInput, UpdateProductInput } from '../model/interface/productInputs'

export const productService = {
  
  // Lista todos los productos
  async getAllProducts() {
    return await Product.findAll({
      // FILTRO: Solo traemos los que tengan isActive en true. Los "borrados" se ignoran.
      where: { isActive: true }, 
      
      // Le decimos a Sequelize que cruce los datos con la tabla Category y nos traiga solamente la columna 'name' de la categoría para no cargar datos inútiles.
      include: [{ model: Category, attributes: ['name'] }],
      
      // ORDEN: Ordenamos los productos por la columna 'name' de manera ascendente (A-Z)
      order: [['name', 'ASC']]
    }) 
  },

  // Busca un producto 
  async getProductById(id: string) {
    // findOne nos permite buscar por ID, pero agregando más condiciones (como isActive)
    const product = await Product.findOne({
      where: { id_product: id, isActive: true }, 
      include: [{ model: Category, attributes: ['name'] }]
    })
    
    // Si no existe, o si existe pero su isActive es false, tiramos error.
    // Este error será atrapado por el bloque 'catch' del controlador.
    if (!product) throw new Error('Producto no encontrado.')
    
    return product
  },

  // Crea un producto en la base de datos (con auto-reactivación)
  async createProduct(data: CreateProductInput) {
    // 1. REGLA DE NEGOCIO: Validar que la categoría exista
    const categoryExists = await Category.findByPk(data.category_id)
    if (!categoryExists) {
      throw new Error('La categoría especificada no existe.')
    }

    // 2. BUSCAMOS SI EL NOMBRE YA EXISTE (Activo o Inactivo)
    const productExists = await Product.findOne({ where: { name: data.name } })
    
    if (productExists) {
      // Si el producto ya existe y está activo, frenamos la creación.
      if (productExists.isActive) {
        throw new Error('Ya existe un producto activo con este nombre.')
      } 
      
      // Si existe pero está inactivo, lo reactivamos y le pisamos el precio y la categoría con los datos nuevos.
      return await productExists.update({
        price: data.price,
        category_id: data.category_id,
        isActive: true // Lo volvemos a activar
      })
    }
    
    // 3. Si la categoría existe y el nombre no se repite en absoluto, creamos el producto nuevo
    return await Product.create(data as any) 
  },

  // Actualiza datos de un producto
  async updateProduct(id: string, data: UpdateProductInput) {
    // 1. Verificamos que el producto que queremos editar realmente exista
    const product = await Product.findByPk(id)
    if (!product) throw new Error('Producto no encontrado.')

    // 2. EVITAR MODIFICAR FANTASMAS: No permitimos editar productos inactivos
    if (!product.isActive) {
      throw new Error('No puedes modificar un producto que está deshabilitado. Reactívalo primero.')
    }

    // 3. Si dentro de los datos a actualizar viene un cambio de categoría, 
    // debemos verificar nuevamente que esa NUEVA categoría exista en la base de datos.
    if (data.category_id) {
      const categoryExists = await Category.findByPk(data.category_id)
      if (!categoryExists) throw new Error('La categoría especificada no existe.')
    }

    // 4. VALIDACIÓN DE DUPLICADO AL ACTUALIZAR:
    // Si envían un nombre nuevo, verificamos que no choque con otro producto distinto
    if (data.name && data.name !== product.name) {
      const nameInUse = await Product.findOne({ where: { name: data.name } })
      
      if (nameInUse) {
        // Le damos un mensaje detallado dependiendo de si el otro producto está activo o inactivo
        throw new Error(
          nameInUse.isActive 
            ? 'El nombre ingresado ya pertenece a otro producto activo.' 
            : 'El nombre ingresado pertenece a un producto deshabilitado. No puedes usar este nombre.'
        )
      }
    }

    // 5. Aplicamos los cambios al producto
    return await product.update(data)
  },

  // Hace el borrado lógico del producto
  async deleteProduct(id: string) {
    // 1. Buscamos el producto
    const product = await Product.findByPk(id)
    if (!product) throw new Error('Producto no encontrado.')
    
    // 2. BORRADO LÓGICO: 
    // En lugar de destruirlo con product.destroy(), simplemente actualizamos su estado a false.
    await product.update({ isActive: false })
    
    return true
  },

  // Reactivar un producto deshabilitado manualmente
  async reactivateProduct(id: string) {
    // Buscamos el producto sin importar si está activo o inactivo
    const product = await Product.findByPk(id)
    
    if (!product) throw new Error('Producto no encontrado.')
    if (product.isActive) throw new Error('Este producto ya se encuentra activo.')
    
    // Le devolvemos el estado activo
    await product.update({ isActive: true })
    
    return true
  }
}