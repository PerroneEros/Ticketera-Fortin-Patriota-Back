import { Router } from 'express'
import { 
  getCategories, 
  getCategoryById, 
  createCategory, 
  updateCategory, 
  deleteCategory 
} from '../controllers/categoryController'

const router = Router()

// GET - http://localhost:PORT/api/categories/
router.get('/', getCategories) //Es necesario obtener todas las categorias? no se tendrian que obtener todos los productos solamente

// GET - http://localhost:PORT/api/categories/:id
router.get('/:id', getCategoryById) // Seria para filtrar por categoria?

// POST - http://localhost:PORT/api/categories/
router.post('/', createCategory) //Como lo vamos a hacer?
/* Al crearse un producto se pone una categroia y si no existe se crea (En este caso se deberia verificar que no exista y hacer varias validaciones) o
   Se crea primero la categoria y despues se le asigna al producto */

// PUT - http://localhost:PORT/api/categories/:id
router.put('/:id', updateCategory)

// DELETE - http://localhost:PORT/api/categories/:id
router.delete('/:id', deleteCategory)

export default router