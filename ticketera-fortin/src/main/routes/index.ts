import { Router } from 'express'
import salesRoutes from './salesRoutes'
import productRoutes from './productRoutes'
import categoryRoutes from './categoryRoutes'
import cashMovementRoutes from './cashMovementRoutes'
import cashRegisterRoutes from './cashRegisterRoutes'

const apiRouter = Router()

apiRouter.use('/sales', salesRoutes)
apiRouter.use('/products', productRoutes)
apiRouter.use('/categories', categoryRoutes)
apiRouter.use('/movements', cashMovementRoutes)
apiRouter.use('/cash-registers', cashRegisterRoutes)

export default apiRouter