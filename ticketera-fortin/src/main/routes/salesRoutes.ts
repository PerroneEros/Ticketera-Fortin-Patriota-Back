import { Router } from 'express'
import {
  createSale,
  getSalesByCashRegister,
  getSalesSummary
} from '../controllers/salesController'

const router = Router()

// POST - Registrar una nueva venta (El backend busca la caja abierta automáticamente)
router.post('/', createSale)

// GET - Totales del dashboard calculados en el servidor (por rango, por caja o de siempre)
router.get('/summary', getSalesSummary)

// GET - Ver todas las ventas que se hicieron durante un turno
router.get('/cash-register/:cash_register_id', getSalesByCashRegister)

// Las ventas nunca se borran: no hay DELETE (constitución, principio 4)

export default router
