import { Router } from 'express'
import { 
  openRegister, 
  closeRegister,
  getCurrentRegister,
  getAllRegisters,
  getTurnTotals
} from '../controllers/cashRegisterController'

const router = Router()

// GET - Obtener la caja abierta actual (Ideal para saber si habilitar ventas)
router.get('/current', getCurrentRegister) 

// GET - Obtener el historial de todas las cajas pasadas
router.get('/', getAllRegisters) 

// POST - Abrir una nueva caja
router.post('/open', openRegister) 

// PUT - Cerrar una caja existente usando su ID
router.put('/close/:id', closeRegister) 

router.get('/totals/:id', getTurnTotals)
export default router