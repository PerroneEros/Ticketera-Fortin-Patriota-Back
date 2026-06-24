import { Router } from 'express'
import { 
  openRegister, 
  closeRegister, 
  getCurrentRegister, 
  getAllRegisters, 
  getRegisterById 
} from '../controllers/cashRegisterController'

const router = Router()

// GET - Obtener la caja activa 
router.get('/current', getCurrentRegister)

// GET - Historial de todas las cajas
router.get('/', getAllRegisters)

// GET - Traer una caja por ID
router.get('/:id', getRegisterById)

// POST - Abrir una nueva caja
router.post('/open', openRegister)

// PUT - Cerrar una caja existente
router.put('/close/:id', closeRegister)

export default router