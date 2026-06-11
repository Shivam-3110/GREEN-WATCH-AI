export const aqiCards = [
  {
    label: 'Live AQI',
    value: '72',
    unit: 'US AQI',
    status: 'Moderate',
    trend: '+4 from last hour',
    accent: 'from-emerald-300 to-cyan-300',
  },
  {
    label: 'PM2.5',
    value: '28',
    unit: 'ug/m3',
    status: 'Watch',
    trend: '-8% daily',
    accent: 'from-cyan-300 to-sky-300',
  },
  {
    label: 'PM10',
    value: '61',
    unit: 'ug/m3',
    status: 'Stable',
    trend: '+3% daily',
    accent: 'from-lime-300 to-emerald-300',
  },
  {
    label: 'Ozone',
    value: '34',
    unit: 'ppb',
    status: 'Clean',
    trend: '-12% daily',
    accent: 'from-amber-200 to-emerald-300',
  },
]

export const pollutionTrend = [
  { time: '00:00', aqi: 58, pm25: 22, pm10: 46 },
  { time: '04:00', aqi: 64, pm25: 25, pm10: 51 },
  { time: '08:00', aqi: 82, pm25: 35, pm10: 70 },
  { time: '12:00', aqi: 74, pm25: 29, pm10: 64 },
  { time: '16:00', aqi: 69, pm25: 26, pm10: 58 },
  { time: '20:00', aqi: 72, pm25: 28, pm10: 61 },
]

export const carbonStats = [
  { name: 'Transport', value: 34 },
  { name: 'Energy', value: 28 },
  { name: 'Food', value: 20 },
  { name: 'Waste', value: 18 },
]

export const footprintTrend = [
  { day: 'Mon', footprint: 42, saved: 12 },
  { day: 'Tue', footprint: 38, saved: 15 },
  { day: 'Wed', footprint: 44, saved: 10 },
  { day: 'Thu', footprint: 31, saved: 21 },
  { day: 'Fri', footprint: 29, saved: 24 },
  { day: 'Sat', footprint: 26, saved: 28 },
  { day: 'Sun', footprint: 24, saved: 31 },
]

export const alertNotifications = [
  {
    title: 'AQI rising in Sector 12',
    message: 'PM2.5 increased near the industrial belt.',
    severity: 'High',
    time: '3 min ago',
  },
  {
    title: 'Carbon target ahead',
    message: 'Weekly footprint is 18% lower than projected.',
    severity: 'Good',
    time: '18 min ago',
  },
  {
    title: 'Waste hotspot detected',
    message: 'Camera node flagged plastic waste accumulation.',
    severity: 'Medium',
    time: '42 min ago',
  },
]

export const ecoScore = {
  score: 86,
  label: 'Resilient',
  change: '+9 this week',
}
