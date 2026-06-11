import { Router } from 'express';
import { calculateCarbonFootprint, getEmissionFactors } from '../controllers/carbonFootprint.controller.js';
import { validateCarbonFootprintInput } from '../validators/carbonFootprint.validator.js';

const router = Router();

router.post('/calculate', validateCarbonFootprintInput, calculateCarbonFootprint);
router.get('/emission-factors', getEmissionFactors);

export default router;
