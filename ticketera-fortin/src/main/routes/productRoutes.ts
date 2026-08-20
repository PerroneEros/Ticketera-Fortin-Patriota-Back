import { Router } from 'express'
import {
  getProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  getProductsDisable,
  reactivateProduct
} from '../controllers/productController'

const router = Router()

// GET - http://localhost:PORT/api/products/
router.get('/', getProducts)
router.get('/disable', getProductsDisable)
// POST - http://localhost:PORT/api/products/
router.post('/', createProduct)

// PUT - http://localhost:PORT/api/products/:id
router.put('/:id', updateProduct)
router.put('/activate/:id', reactivateProduct)
// DELETE - http://localhost:PORT/api/products/:id
router.delete('/:id', deleteProduct)

export default router
