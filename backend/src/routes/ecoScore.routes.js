import { Router } from 'express';
import {
  calculateUserEcoScore,
  getScoreBreakdown,
  getBenchmarks,
} from '../controllers/ecoScore.controller.js';
import { validateEcoScoreInput } from '../validators/ecoScore.validator.js';

const router = Router();

router.post('/calculate', validateEcoScoreInput, calculateUserEcoScore);
router.get('/breakdown', getScoreBreakdown);
router.get('/benchmarks', getBenchmarks);

export default router;
