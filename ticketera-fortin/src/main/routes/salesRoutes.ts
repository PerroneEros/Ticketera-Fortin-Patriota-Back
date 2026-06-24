import { Router } from 'express'
import { 
  createSale, 
  getSales, 
  getSaleById, 
  getSalesByCashRegister, 
  deleteSale 
} from '../controllers/salesController'

const router = Router()

// POST-http://localhost:PORT/api/sales/
router.post('/', createSale)

//GET-http://localhost:PORT/api/sales/ (Historial completo)
router.get('/', getSales)

//GET-http://localhost:PORT/api/sales/:id (Detalle de una venta)
router.get('/:id', getSaleById)

//GET-http://localhost:PORT/api/sales/cash-register/:cash_register_id (Ventas de una caja)
router.get('/cash-register/:cash_register_id', getSalesByCashRegister)

//DELETE-http://localhost:PORT/api/sales/:id (Eliminar venta)
router.delete('/:id', deleteSale)

export default router