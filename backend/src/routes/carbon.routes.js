import { Router } from 'express'
import {
  calculateCarbon,
  deleteCarbonHistory,
  getCarbonHistory,
  getCarbonReport,
} from '../controllers/carbon.controller.js'
import { authGuard } from '../middlewares/auth.middleware.js'

const router = Router()

router.use(authGuard)

router.post('/calculate', calculateCarbon)
router.get('/history', getCarbonHistory)
router.get('/report/:id', getCarbonReport)
router.delete('/history/:id', deleteCarbonHistory)

export default router
