import { Router } from 'express'
import { login, me, register } from '../controllers/auth.controller.js'
import { authGuard } from '../middlewares/auth.middleware.js'

const router = Router()

router.post('/register', register)
router.post('/login', login)
router.get('/me', authGuard, me)

export default router