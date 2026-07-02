import { Router } from 'express'
import authRoutes from './auth.routes.js'
import assistantRoutes from './assistant.routes.js'
import carbonFootprintRoutes from './carbonFootprint.routes.js'
import ecoScoreRoutes from './ecoScore.routes.js'
import alertsRoutes from './alerts.routes.js'
import ecoChallengeRoutes from './ecoChallenge.routes.js'
import airQualityRoutes from './airQuality.routes.js'
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
router.use('/eco-score', ecoScoreRoutes)
router.use('/alerts', alertsRoutes)
router.use('/eco-challenge', ecoChallengeRoutes)
router.use('/air-quality', airQualityRoutes)

export default router