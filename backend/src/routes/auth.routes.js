import { Router } from 'express'
import { login, me, register } from '../controllers/auth.controller.js'
import { authGuard } from '../middlewares/auth.middleware.js'
import { validate } from '../middlewares/validate.middleware.js'
import { validateLoginInput, validateRegisterInput } from '../validators/auth.validator.js'

const router = Router()

router.post('/register', validate(validateRegisterInput), register)
router.post('/login', validate(validateLoginInput), login)
router.get('/me', authGuard, me)
router.get('/profile', authGuard, me)

export default router
