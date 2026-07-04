import { Router } from 'express'
import { createMovement } from '../controllers/cashMovementController'

const router = Router()

router.post('/', createMovement)

export default router