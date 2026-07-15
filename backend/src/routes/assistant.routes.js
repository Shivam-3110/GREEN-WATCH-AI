import { Router } from 'express'
import {
  analyzeCarbonFootprint,
  chatWithAssistant,
  getAdviceByCategory,
  getPollutionInsights,
  getQuickTips,
  predictSimulatorAQI,
} from '../controllers/assistant.controller.js'
import { authGuard } from '../middlewares/auth.middleware.js'
import {
  validateActivitiesData,
  validateChatMessage,
  validatePollutionData,
} from '../validators/assistant.validator.js'

const router = Router()

router.post('/chat', authGuard, validateChatMessage, chatWithAssistant)

router.get('/advice/:category', authGuard, getAdviceByCategory)

router.post(
  '/carbon-analysis',
  authGuard,
  validateActivitiesData,
  analyzeCarbonFootprint,
)

router.post(
  '/pollution-insights',
  authGuard,
  validatePollutionData,
  getPollutionInsights,
)

router.get('/quick-tips', authGuard, getQuickTips)

router.post('/predict-aqi', predictSimulatorAQI)

export default router
