import axios from 'axios'
import { getCurrentAQI } from './airQuality.service.js'
import { createAQIAlert, createHeatwaveAlert } from './environmentalAlert.service.js'

const OPENWEATHER_TEMP_API = 'https://api.openweathermap.org/data/2.5/weather'

const getCurrentTemp = async (lat, lon) => {
  try {
    const res = await axios.get(OPENWEATHER_TEMP_API, {
      params: { lat, lon, appid: process.env.OPENWEATHER_API_KEY, units: 'metric' },
    })
    return res.data.main.temp
  } catch {
    return null
  }
}

// Called once when user connects — emits alerts only to that specific socket
export const checkAQIForUser = async (socketId, lat, lon, city, socket) => {
  const location = city || 'Your Location'
  const emit = (alert) => socket.emit('environmental:alert', alert) // only to this user

  try {
    const [aqiData, temp] = await Promise.all([
      getCurrentAQI(lat, lon),
      getCurrentTemp(lat, lon),
    ])

    const aqi = aqiData.aqi

    if (aqi > 50) {
      emit(createAQIAlert(location, aqi, 'PM2.5'))
      console.log(`🚨 AQI alert → ${socketId} for ${location}: AQI=${aqi}`)
    } else {
      console.log(`✅ AQI safe for ${location} (${aqi})`)
    }

    if (temp !== null && temp >= 35) {
      emit(createHeatwaveAlert(location, Math.round(temp)))
      console.log(`🌡️ Heatwave alert → ${socketId} for ${location}: ${temp}°C`)
    }
  } catch (err) {
    console.warn(`⚠️  Check failed for socket ${socketId}:`, err.message)
  }
}
