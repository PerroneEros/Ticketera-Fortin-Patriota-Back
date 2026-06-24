import { Router } from 'express'
import salesRoutes from './salesRoutes'
import productRoutes from './productRoutes'
import categoryRoutes from './categoryRoutes'
import cashRegisterRoutes from './cashRegisterRoutes'

const apiRouter = Router()

// Unificamos los módulos
apiRouter.use('/sales', salesRoutes)
apiRouter.use('/products', productRoutes)
apiRouter.use('/categories', categoryRoutes)
apiRouter.use('/cash-registers', cashRegisterRoutes)

export default apiRouter