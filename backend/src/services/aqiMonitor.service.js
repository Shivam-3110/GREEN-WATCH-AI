import { getCurrentAQI } from './airQuality.service.js'
import { createAQIAlert, emitAlert } from './environmentalAlert.service.js'

const getSeverityBand = (aqi) => {
  if (aqi >= 301) return 'emergency'
  if (aqi >= 201) return 'critical'
  if (aqi >= 151) return 'warning-high'
  if (aqi >= 101) return 'warning-low'
  return 'safe'
}

// Called once when user connects — checks their location and fires alert if needed
export const checkAQIForUser = async (socketId, lat, lon, city) => {
  try {
    const data = await getCurrentAQI(lat, lon)
    const aqi  = data.aqi
    const band = getSeverityBand(aqi)

    if (aqi <= 50) {
      console.log(`✅ AQI safe for ${city} (${aqi}) — no alert`)
      return
    }

    const alert = createAQIAlert(city || 'Your Location', aqi, 'PM2.5')
    emitAlert(alert) // broadcast to all connected clients
    console.log(`🚨 AQI alert fired for ${city}: AQI=${aqi} (${band})`)
  } catch (err) {
    console.warn(`⚠️  AQI check failed for socket ${socketId}:`, err.message)
  }
}
