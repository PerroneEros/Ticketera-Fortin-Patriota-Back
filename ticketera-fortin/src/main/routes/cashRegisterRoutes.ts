import { Router } from 'express'
import { 
  openRegister, 
  closeRegister, 
  getCurrentRegister, 
  getAllRegisters, 
  getRegisterById 
} from '../controllers/cashRegisterController'

const router = Router()

// POST - Abrir una nueva caja
router.post('/open', openRegister) // Necesitaria importe inicial

// PUT - Cerrar una caja existente
router.put('/close/:id', closeRegister) // Requeriria un importe por metodo de pago?

export default router