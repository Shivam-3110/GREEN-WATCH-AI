/**
 * WeatherEffects.js
 * Models how real-time weather data from OpenWeather affects AQI.
 * All deltas are signed AQI contributions.
 */

/**
 * Wind disperses pollutants horizontally.
 * Beaufort scale reference:
 *   < 2 m/s  → stagnant air, pollutants accumulate (+8)
 *   2–5 m/s  → light breeze, moderate dispersion (−5)
 *   5–10 m/s → fresh breeze, good dispersion (−12)
 *   > 10 m/s → strong wind, excellent dispersion (−20)
 */
export function windDispersionEffect(windSpeedMs) {
  if (windSpeedMs < 2)  return 8;
  if (windSpeedMs < 5)  return -5;
  if (windSpeedMs < 10) return -12;
  return -20;
}

/**
 * Rain washes PM2.5, PM10, and SO2 from the atmosphere (wet deposition).
 * Light rain (< 2.5 mm/h): −8 AQI
 * Moderate rain (2.5–7.5 mm/h): −15 AQI
 * Heavy rain (> 7.5 mm/h): −25 AQI
 * No rain: 0
 */
export function rainCleansingEffect(rainfallMmPerHour) {
  if (!rainfallMmPerHour || rainfallMmPerHour <= 0) return 0;
  if (rainfallMmPerHour < 2.5)  return -8;
  if (rainfallMmPerHour < 7.5)  return -15;
  return -25;
}

/**
 * High humidity increases hygroscopic growth of PM particles,
 * making them larger and more harmful. Also traps pollutants near ground.
 * < 40%: dry, slight benefit (−2)
 * 40–70%: neutral (0)
 * 70–85%: moderate increase (+5)
 * > 85%: significant increase (+10)
 */
export function humidityEffect(humidityPercent) {
  if (humidityPercent < 40) return -2;
  if (humidityPercent < 70) return 0;
  if (humidityPercent < 85) return 5;
  return 10;
}
