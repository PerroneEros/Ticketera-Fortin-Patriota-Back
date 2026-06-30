import { Router } from 'express'
import { 
  createSale, 
  getSales, 
  getSaleById, 
  getSalesByCashRegister, 
  deleteSale 
} from '../controllers/salesController'

const router = Router()

// POST - Registrar una nueva venta (El backend busca la caja abierta automáticamente)
router.post('/', createSale)//ver

// GET - Ver el historial completo de todas las ventas
router.get('/', getSales) 

// GET - Ver el detalle de una sola venta por ID ( ver/imprimir el detalle)
router.get('/:id', getSaleById) //podemos usarlo para ver los productos que se vendieron y usarlo para ver cantidad de cada producto que se vendio?

// GET - Ver todas las ventas que se hicieron durante un turno
router.get('/cash-register/:cash_register_id', getSalesByCashRegister) 

// DELETE - Eliminar una venta mal cargada por su ID (Borra venta y tickets)
router.delete('/:id', deleteSale) //para despues 

export default router