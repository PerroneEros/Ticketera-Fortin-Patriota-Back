import { Router } from 'express'
import { 
  createSale, 
  getSales, 
  getSaleById, 
  getSalesByCashRegister, 
  deleteSale 
} from '../controllers/salesController'

const router = Router()

// POST - Registrar una nueva venta
router.post('/', createSale)

// GET - Ver el historial completo de todas las ventas
router.get('/', getSales) // Para que serviria?

// GET - Ver el detalle de una sola venta por id
router.get('/:id', getSaleById) //podemos usarlo para ver los productos que se vendieron y usarlo para ver cantidad de cada producto que se vendio

// GET - Ver todas las ventas que se hicieron durante un turno
router.get('/cash-register/:cash_register_id', getSalesByCashRegister) 

// DELETE - Eliminar una venta mal cargada por su ID
router.delete('/:id', deleteSale) //ES necesario?

export default router