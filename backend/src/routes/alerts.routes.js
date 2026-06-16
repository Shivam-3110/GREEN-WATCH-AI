import { Router } from 'express';
import {
  triggerAQIAlert,
  triggerHeatwaveAlert,
  triggerFloodAlert,
  getAlertTypes,
  triggerTestAlert,
} from '../controllers/alerts.controller.js';

const router = Router();

router.post('/aqi', triggerAQIAlert);
router.post('/heatwave', triggerHeatwaveAlert);
router.post('/flood', triggerFloodAlert);
router.post('/test', triggerTestAlert);
router.get('/types', getAlertTypes);

export default router;
