const clamp = (value, min, max) => Math.min(Math.max(value, min), max)

export function getAQICategory(aqi) {
  if (aqi <= 50) return { label: 'Good', color: 'text-green-400' }
  if (aqi <= 100) return { label: 'Moderate', color: 'text-yellow-400' }
  if (aqi <= 150) return { label: 'Unhealthy (Sensitive)', color: 'text-orange-400' }
  if (aqi <= 200) return { label: 'Unhealthy', color: 'text-red-400' }
  return { label: 'Very Unhealthy', color: 'text-purple-400' }
}

export function getPressureInterpretation(score) {
  if (score < 30) return 'Low'
  if (score < 60) return 'Moderate'
  if (score < 80) return 'High'
  return 'Critical'
}

export function calculateEnvironmentalPressureScore({
  currentAQI,
  pollutionRatio,
  trafficRatio,
  treeCount,
  temperatureC,
  pollutants = {},
  weather = {},
}) {
  const pollutantPressure = (
    clamp((pollutants.pm25 ?? 0) / 75, 0, 1) * 0.35 +
    clamp((pollutants.pm10 ?? 0) / 150, 0, 1) * 0.2 +
    clamp((pollutants.no2 ?? 0) / 80, 0, 1) * 0.2 +
    clamp((pollutants.o3 ?? 0) / 180, 0, 1) * 0.15 +
    clamp((pollutants.co ?? 0) / 6000, 0, 1) * 0.1
  ) * 100

  const weatherPressure =
    (weather.windSpeedMs !== undefined && weather.windSpeedMs < 2 ? 12 : 0) +
    (weather.humidityPercent !== undefined && weather.humidityPercent > 85 ? 8 : 0) -
    (weather.rainfallMmPerHour ? 8 : 0)

  const score = (
    clamp((currentAQI ?? 75) / 250, 0, 1) * 24 +
    pollutionRatio * 24 +
    trafficRatio * 18 +
    clamp((50 - treeCount) / 50, 0, 1) * 14 +
    clamp((temperatureC - 20) / 30, 0, 1) * 8 +
    clamp(pollutantPressure / 100, 0, 1) * 10 +
    clamp(weatherPressure / 20, -0.4, 1) * 2
  )

  return clamp(Math.round(score), 0, 100)
}
