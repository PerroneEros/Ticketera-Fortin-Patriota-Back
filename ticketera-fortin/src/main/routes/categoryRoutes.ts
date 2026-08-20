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
router.get('/', getCategories) 

// GET - http://localhost:PORT/api/categories/:id
router.get('/:id', getCategoryById) 

// POST - http://localhost:PORT/api/categories/
router.post('/', createCategory) 

// PUT - http://localhost:PORT/api/categories/:id
router.put('/:id', updateCategory)

// DELETE - http://localhost:PORT/api/categories/:id
router.delete('/:id', deleteCategory)

export default router