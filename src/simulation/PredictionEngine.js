import {
  industrialImpact,
  trafficImpact,
  treeAbsorptionImpact,
  temperatureImpact,
  pollutantComponentImpact,
} from './ImpactCalculators'
import {
  windDispersionEffect,
  rainCleansingEffect,
  humidityEffect,
} from './WeatherEffects'
import { getFutureMonthSeasonalAdjustments } from './SeasonalAdjustments'
import {
  calculateEnvironmentalPressureScore,
  getAQICategory,
  getPressureInterpretation,
} from './EnvironmentalScore'
import { generateRecommendations } from './RecommendationEngine'

const clamp = (value, min, max) => Math.min(Math.max(value, min), max)

const roundContribution = (value) => Math.round(value)

const getAvailableDataCount = ({ pollutants, weather }) => {
  const pollutantKeys = ['pm25', 'pm10', 'no2', 'o3', 'co']
  const weatherKeys = ['humidityPercent', 'windSpeedMs', 'rainfallMmPerHour', 'temperatureC']

  return [...pollutantKeys, ...weatherKeys].filter((key) => {
    const source = pollutantKeys.includes(key) ? pollutants : weather
    return source[key] !== undefined && source[key] !== null
  }).length
}

function calculateConfidence({ pollutants, weather, pressureScore }) {
  const dataAvailability = getAvailableDataCount({ pollutants, weather })
  const availabilityScore = Math.round((dataAvailability / 9) * 45)
  const stabilityScore = pressureScore < 60 ? 25 : pressureScore < 80 ? 18 : 12
  const weatherScore = weather.timestamp ? 20 : 10
  const modelScore = 10
  const score = clamp(availabilityScore + stabilityScore + weatherScore + modelScore, 45, 96)

  const reason = dataAvailability >= 8
    ? 'Prediction uses complete weather and pollution data.'
    : dataAvailability >= 5
      ? 'Prediction uses live pollution data with partial weather data.'
      : 'Prediction uses available AQI data and simulator controls; weather data is limited.'

  return { score, reason }
}

export function predictSixMonthAQI({
  currentAQI = 75,
  pollutionRatio,
  treeCount,
  trafficRatio,
  temperatureC,
  pollutants = {},
  weather = {},
  startDate = new Date(),
}) {
  const normalizedWeather = {
    humidityPercent: weather.humidityPercent,
    windSpeedMs: weather.windSpeedMs,
    rainfallMmPerHour: weather.rainfallMmPerHour,
    temperatureC: weather.temperatureC ?? temperatureC,
    timestamp: weather.timestamp,
  }

  const breakdown = {
    industrial: roundContribution(industrialImpact(pollutionRatio)),
    traffic: roundContribution(trafficImpact(trafficRatio, pollutants.pm25)),
    trees: roundContribution(treeAbsorptionImpact(treeCount, currentAQI)),
    temperature: roundContribution(temperatureImpact(temperatureC)),
    pollutants: roundContribution(pollutantComponentImpact(pollutants)),
    wind: normalizedWeather.windSpeedMs === undefined ? 0 : roundContribution(windDispersionEffect(normalizedWeather.windSpeedMs)),
    rain: roundContribution(rainCleansingEffect(normalizedWeather.rainfallMmPerHour)),
    humidity: normalizedWeather.humidityPercent === undefined ? 0 : roundContribution(humidityEffect(normalizedWeather.humidityPercent)),
  }

  const pressureScore = calculateEnvironmentalPressureScore({
    currentAQI,
    pollutionRatio,
    trafficRatio,
    treeCount,
    temperatureC,
    pollutants,
    weather: normalizedWeather,
  })

  const monthlySeasonal = getFutureMonthSeasonalAdjustments(6, startDate)
  const persistentDelta =
    breakdown.industrial * 0.12 +
    breakdown.traffic * 0.1 +
    breakdown.trees * 0.1 +
    breakdown.temperature * 0.08 +
    breakdown.pollutants * 0.06 +
    (breakdown.wind + breakdown.rain + breakdown.humidity) * 0.04

  let runningAQI = currentAQI
  const monthlyTrend = monthlySeasonal.map((seasonal, index) => {
    const seasonalDelta = seasonal.delta * (0.35 + index * 0.08)
    const inertia = (runningAQI - currentAQI) * 0.08
    runningAQI = clamp(runningAQI + persistentDelta + seasonalDelta + inertia, 0, 500)

    return {
      month: seasonal.month,
      season: seasonal.season,
      aqi: Math.round(runningAQI),
      seasonalDelta: Math.round(seasonalDelta),
    }
  })

  const predictedAQI = monthlyTrend[monthlyTrend.length - 1]?.aqi ?? Math.round(currentAQI)
  const confidence = calculateConfidence({ pollutants, weather: normalizedWeather, pressureScore })

  return {
    currentAQI: Math.round(currentAQI),
    predictedAQI,
    category: getAQICategory(predictedAQI),
    pressureScore,
    pressureInterpretation: getPressureInterpretation(pressureScore),
    confidence,
    monthlyTrend,
    impactBreakdown: {
      ...breakdown,
      monthlyGrowth: Math.round(persistentDelta),
      seasonalAverage: Math.round(
        monthlyTrend.reduce((sum, month) => sum + month.seasonalDelta, 0) / monthlyTrend.length
      ),
    },
    recommendations: generateRecommendations({
      currentAQI,
      predictedAQI,
      pollutionRatio,
      trafficRatio,
      treeCount,
      temperatureC,
      weather: normalizedWeather,
      pressureScore,
    }),
  }
}
