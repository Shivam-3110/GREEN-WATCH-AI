import express from 'express'
import axios from 'axios'
import { getCurrentAQI, getAQIForecast } from '../services/airQuality.service.js'

const AQI_PREDICTION_URL = process.env.AQI_PREDICTION_SERVICE_URL || 'http://localhost:8001'

const router = express.Router()

router.get('/current', async (req, res) => {
  try {
    let lat = req.query.lat || process.env.CITY_LAT
    let lon = req.query.lon || process.env.CITY_LON

    if (!lat || !lon) {
      return res.status(400).json({ success: false, message: 'Latitude and longitude required' })
    }

    const aqiData = await getCurrentAQI(lat, lon)
    res.json({ success: true, data: aqiData })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
})

router.get('/forecast', async (req, res) => {
  try {
    let lat = req.query.lat || process.env.CITY_LAT
    let lon = req.query.lon || process.env.CITY_LON

    if (!lat || !lon) {
      return res.status(400).json({ success: false, message: 'Latitude and longitude required' })
    }

    const forecast = await getAQIForecast(lat, lon)
    res.json({ success: true, data: forecast })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
})

// ML-powered 24-hour AQI prediction via Python microservice
router.get('/ml-prediction', async (req, res) => {
  try {
    let lat = req.query.lat || process.env.CITY_LAT
    let lon = req.query.lon || process.env.CITY_LON

    if (!lat || !lon) {
      return res.status(400).json({ success: false, message: 'Latitude and longitude required' })
    }

    const response = await axios.post(
      `${AQI_PREDICTION_URL}/api/v1/aqi-prediction/predict-by-location`,
      { lat: parseFloat(lat), lon: parseFloat(lon) },
      { timeout: 15000 }
    )
    res.json({ success: true, data: response.data })
  } catch (error) {
    // Graceful fallback — don't break the app if ML service is down
    res.status(503).json({
      success: false,
      message: 'AQI prediction service unavailable',
      detail: error.message,
    })
  }
})

export default router
