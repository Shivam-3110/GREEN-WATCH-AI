export function generateRecommendations({
  currentAQI,
  predictedAQI,
  pollutionRatio,
  trafficRatio,
  treeCount,
  temperatureC,
  weather = {},
  pressureScore,
}) {
  const recommendations = []

  if (predictedAQI > currentAQI + 20) {
    recommendations.push('AQI is trending upward; prioritize emission controls before the next season.')
  }

  if (pollutionRatio >= 0.65) {
    recommendations.push('Reduce industrial emissions through stricter stack controls and cleaner fuel use.')
  }

  if (treeCount < 30) {
    recommendations.push(`Increase urban tree cover; add about ${(30 - treeCount) * 10} trees to reach the recommended buffer.`)
  }

  if (trafficRatio >= 0.7) {
    recommendations.push('Promote public transport, staggered office hours, and low-emission traffic corridors.')
  }

  if (temperatureC >= 38) {
    recommendations.push('Use cooling strategies such as shaded streets, cool roofs, and reduced afternoon traffic.')
  }

  if (weather.windSpeedMs !== undefined && weather.windSpeedMs < 2) {
    recommendations.push('Wind dispersion is poor; avoid open burning and schedule industrial activity carefully.')
  }

  if (weather.humidityPercent !== undefined && weather.humidityPercent > 85) {
    recommendations.push('High humidity can intensify particulate exposure; sensitive groups should limit outdoor exertion.')
  }

  if (pressureScore >= 80) {
    recommendations.push('Environmental pressure is critical; combine traffic restrictions, industrial controls, and public health alerts.')
  }

  if (recommendations.length === 0) {
    recommendations.push('Conditions are stable; maintain tree coverage and monitor traffic and industrial load.')
  }

  return recommendations.slice(0, 5)
}
