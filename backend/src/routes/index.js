import { Router } from 'express'
import authRoutes from './auth.routes.js'
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

export default router