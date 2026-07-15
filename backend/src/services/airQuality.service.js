import axios from 'axios'

const OPENWEATHER_API = 'https://api.openweathermap.org/data/2.5/air_pollution'
const FORECAST_API = 'https://api.openweathermap.org/data/2.5/air_pollution/forecast'
const WEATHER_API = 'https://api.openweathermap.org/data/2.5/weather'

const getAQIDescription = (aqi) => {
  const levels = {
    1: { label: 'Clean', status: 'Good' },
    2: { label: 'Fair', status: 'Watch' },
    3: { label: 'Moderate', status: 'Moderate' },
    4: { label: 'Poor', status: 'Alert' },
    5: { label: 'Very Poor', status: 'Critical' },
  }
  return levels[aqi] || { label: 'Unknown', status: 'Unknown' }
}

const aqiIndexToUSAQI = (aqiIndex) => {
  const conversion = {
    1: 25,
    2: 50,
    3: 75,
    4: 100,
    5: 150,
  }
  return conversion[aqiIndex] || 50
}

const getCurrentWeather = async (lat, lon) => {
  try {
    const response = await axios.get(WEATHER_API, {
      params: {
        lat,
        lon,
        appid: process.env.OPENWEATHER_API_KEY,
        units: 'metric',
      },
    })

    const rain = response.data.rain || {}

    return {
      temperature: Math.round(response.data.main?.temp * 10) / 10,
      humidity: response.data.main?.humidity,
      windSpeed: response.data.wind?.speed,
      rainfall: rain['1h'] ?? rain['3h'] ?? 0,
    }
  } catch (error) {
    console.warn('Weather snapshot unavailable:', error.message)
    return {}
  }
}

export const getCurrentAQI = async (lat, lon) => {
  try {
    const [response, weather] = await Promise.all([
      axios.get(OPENWEATHER_API, {
        params: {
          lat,
          lon,
          appid: process.env.OPENWEATHER_API_KEY,
        },
      }),
      getCurrentWeather(lat, lon),
    ])

    const { list } = response.data
    if (!list || list.length === 0) throw new Error('No AQI data available')

    const data = list[0]
    const aqi = data.main.aqi
    const components = data.components

    return {
      aqi: aqiIndexToUSAQI(aqi),
      pm25: Math.round(components.pm2_5 * 10) / 10,
      pm10: Math.round(components.pm10 * 10) / 10,
      o3: Math.round(components.o3 * 10) / 10,
      no2: Math.round(components.no2 * 10) / 10,
      so2: Math.round(components.so2 * 10) / 10,
      co: Math.round(components.co * 10) / 10,
      ...weather,
      ...getAQIDescription(aqi),
      timestamp: new Date(data.dt * 1000),
    }
  } catch (error) {
    console.error('Error fetching AQI data:', error.message)
    throw new Error('Failed to fetch AQI data')
  }
}

export const getAQIForecast = async (lat, lon) => {
  try {
    const response = await axios.get(FORECAST_API, {
      params: {
        lat,
        lon,
        appid: process.env.OPENWEATHER_API_KEY,
      },
    })

    const { list } = response.data
    if (!list || list.length === 0) throw new Error('No forecast data available')

    return list.slice(0, 24).map((item, index) => ({
      time: new Date(item.dt * 1000).toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
      }),
      hour: new Date(item.dt * 1000).getHours(),
      aqi: aqiIndexToUSAQI(item.main.aqi),
      pm25: Math.round(item.components.pm2_5 * 10) / 10,
      pm10: Math.round(item.components.pm10 * 10) / 10,
    }))
  } catch (error) {
    console.error('Error fetching AQI forecast:', error.message)
    throw new Error('Failed to fetch AQI forecast')
  }
}
