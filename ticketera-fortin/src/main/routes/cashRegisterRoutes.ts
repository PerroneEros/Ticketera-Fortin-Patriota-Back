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
router.get('/current', getCurrentRegister) // Para que serviria?

// GET - Historial de todas las cajas
router.get('/', getAllRegisters) // Seria para los resumenes por fechas? sino para que necesitariamos el historial de cajas?

// GET - Traer una caja por ID
router.get('/:id', getRegisterById) // Seria para filtrar por fechas?

// POST - Abrir una nueva caja
router.post('/open', openRegister) // Necesitaria importe inicial

// PUT - Cerrar una caja existente
router.put('/close/:id', closeRegister) // Requeriria un importe por metodo de pago?

export default router