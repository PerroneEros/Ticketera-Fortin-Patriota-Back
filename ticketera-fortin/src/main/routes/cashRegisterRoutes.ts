import { Router } from 'express'
import { 
  openRegister, 
  closeRegister, 
} from '../controllers/cashRegisterController'

const router = Router()

// POST - Abrir una nueva caja
router.post('/open', openRegister) 

// PUT - Cerrar una caja existente
router.put('/close/:id', closeRegister) 

export default router