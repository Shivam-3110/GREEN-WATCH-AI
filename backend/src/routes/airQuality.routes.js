import express from 'express'
import { getCurrentAQI, getAQIForecast } from '../services/airQuality.service.js'

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

export default router
