import { Router } from 'express'
import authRoutes from './auth.routes.js'
import assistantRoutes from './assistant.routes.js'
import carbonFootprintRoutes from './carbonFootprint.routes.js'
import { authGuard } from '../middlewares/auth.middleware.js'

const router = Router()

router.get('/status', (_req, res) => {
  res.status(200).json({ success: true, message: 'API v1 online' })
})

router.get('/protected/ping', authGuard, (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Protected route reachable',
    user: req.user,
  })
})

router.use('/auth', authRoutes)
router.use('/assistant', assistantRoutes)
router.use('/carbon-footprint', carbonFootprintRoutes)

export default router