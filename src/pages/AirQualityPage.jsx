import { useEffect, useState } from 'react'
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  LineChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { motion } from 'framer-motion'
import apiClient from '../services/apiClient'
import SectionHeader from '../components/ui/SectionHeader'
import GlassPanel from '../components/dashboard/GlassPanel'
import { getLocationCoordinates } from '../utils/location'

const tooltipStyle = {
  background: 'rgba(3, 8, 6, 0.92)',
  border: '1px solid rgba(103, 232, 249, 0.18)',
  borderRadius: 8,
  color: '#ecfeff',
}

const getAQIColor = (aqi) => {
  if (aqi <= 50) return '#34d399'
  if (aqi <= 100) return '#fbbf24'
  if (aqi <= 150) return '#f97316'
  if (aqi <= 200) return '#ef4444'
  return '#7c2d12'
}

const getAQIStatus = (aqi) => {
  if (aqi <= 50) return { label: 'Good', color: 'emerald' }
  if (aqi <= 100) return { label: 'Moderate', color: 'amber' }
  if (aqi <= 150) return { label: 'Poor', color: 'orange' }
  if (aqi <= 200) return { label: 'Very Poor', color: 'red' }
  return { label: 'Severe', color: 'rose' }
}

function AirQualityPage() {
  const [currentAQI, setCurrentAQI] = useState(null)
  const [forecast, setForecast] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchAirQualityData = async () => {
      try {
        setLoading(true)
        const location = await getLocationCoordinates()
        const [currentRes, forecastRes] = await Promise.all([
          apiClient.get('/air-quality/current', { params: { lat: location.lat, lon: location.lon } }),
          apiClient.get('/air-quality/forecast', { params: { lat: location.lat, lon: location.lon } }),
        ])

        if (currentRes.data.success) setCurrentAQI(currentRes.data.data)
        if (forecastRes.data.success) setForecast(forecastRes.data.data)
        setError(null)
      } catch (err) {
        console.error('Error fetching air quality:', err)
        setError('Failed to load air quality data')
      } finally {
        setLoading(false)
      }
    }

    fetchAirQualityData()
    const interval = setInterval(fetchAirQualityData, 300000)
    return () => clearInterval(interval)
  }, [])

  if (error) {
    return (
      <section>
        <SectionHeader title="Air Quality Analytics" subtitle="AQI Module" />
        <div className="rounded-lg border border-red-500/20 bg-red-500/5 p-6 text-center text-red-400">
          {error}
        </div>
      </section>
    )
  }

  if (loading || !currentAQI) {
    return (
      <section>
        <SectionHeader title="Air Quality Analytics" subtitle="AQI Module" />
        <div className="rounded-lg border border-white/10 bg-black/20 p-6 text-center text-slate-400">
          Loading air quality data...
        </div>
      </section>
    )
  }

  const aqiStatus = getAQIStatus(currentAQI.aqi)
  const pollutants = [
    { name: 'PM2.5', value: currentAQI.pm25, unit: 'µg/m³', ideal: 12 },
    { name: 'PM10', value: currentAQI.pm10, unit: 'µg/m³', ideal: 50 },
    { name: 'O₃', value: currentAQI.o3, unit: 'ppb', ideal: 70 },
    { name: 'NO₂', value: currentAQI.no2, unit: 'ppb', ideal: 53 },
    { name: 'SO₂', value: currentAQI.so2, unit: 'ppb', ideal: 35 },
    { name: 'CO', value: currentAQI.co, unit: 'ppb', ideal: 1000 },
  ]

  return (
    <section className="space-y-5">
      <SectionHeader title="Air Quality Analytics" subtitle="Real-time AQI Module" />

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className={`rounded-2xl border-2 border-${aqiStatus.color}-400/30 bg-${aqiStatus.color}-950/30 p-8`}
      >
        <div className="flex items-start justify-between">
          <div>
            <p className={`text-sm font-semibold uppercase tracking-wider text-${aqiStatus.color}-300`}>
              AQI Status
            </p>
            <div className="mt-4 flex items-end gap-3">
              <span className="text-6xl font-bold text-white">{Math.round(currentAQI.aqi)}</span>
              <div>
                <p className="text-2xl font-semibold text-white">{aqiStatus.label}</p>
                <p className="mt-1 text-sm text-slate-400">
                  Updated {new Date(currentAQI.timestamp).toLocaleTimeString()}
                </p>
              </div>
            </div>
          </div>
          <div
            className="h-24 w-24 rounded-full opacity-20"
            style={{ backgroundColor: getAQIColor(currentAQI.aqi) }}
          />
        </div>
      </motion.div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {pollutants.map((pollutant, idx) => (
          <motion.div
            key={pollutant.name}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.05 }}
            className="rounded-lg border border-white/10 bg-black/30 p-4"
          >
            <p className="text-sm text-slate-400">{pollutant.name}</p>
            <p className="mt-2 text-2xl font-semibold text-white">
              {pollutant.value.toFixed(1)} <span className="text-sm text-slate-500">{pollutant.unit}</span>
            </p>
            <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-white/5">
              <div
                className="h-full bg-gradient-to-r from-emerald-400 to-cyan-400"
                style={{
                  width: `${Math.min((pollutant.value / pollutant.ideal) * 100, 100)}%`,
                }}
              />
            </div>
            <p className="mt-2 text-xs text-slate-500">Ideal: {pollutant.ideal} {pollutant.unit}</p>
          </motion.div>
        ))}
      </div>

      <GlassPanel title="24-Hour AQI Forecast" action="Hourly breakdown">
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={forecast} margin={{ left: -18, right: 8, top: 12, bottom: 0 }}>
              <defs>
                <linearGradient id="aqi-gradient" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="5%" stopColor="#67e8f9" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#67e8f9" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="rgba(255,255,255,0.08)" strokeDasharray="4 8" />
              <XAxis dataKey="time" tick={{ fill: '#94a3b8', fontSize: 12 }} />
              <YAxis tick={{ fill: '#94a3b8', fontSize: 12 }} />
              <Tooltip contentStyle={tooltipStyle} />
              <Area type="monotone" dataKey="aqi" stroke="#67e8f9" fill="url(#aqi-gradient)" strokeWidth={3} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </GlassPanel>

      <div className="grid gap-4 lg:grid-cols-2">
        <GlassPanel title="PM2.5 Trend" action="24-hour view">
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={forecast} margin={{ left: -18, right: 8, top: 12, bottom: 0 }}>
                <CartesianGrid stroke="rgba(255,255,255,0.08)" strokeDasharray="4 8" />
                <XAxis dataKey="time" tick={{ fill: '#94a3b8', fontSize: 12 }} />
                <YAxis tick={{ fill: '#94a3b8', fontSize: 12 }} />
                <Tooltip contentStyle={tooltipStyle} />
                <Line type="monotone" dataKey="pm25" stroke="#bef264" dot={false} strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </GlassPanel>

        <GlassPanel title="PM10 Trend" action="24-hour view">
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={forecast} margin={{ left: -18, right: 8, top: 12, bottom: 0 }}>
                <CartesianGrid stroke="rgba(255,255,255,0.08)" strokeDasharray="4 8" />
                <XAxis dataKey="time" tick={{ fill: '#94a3b8', fontSize: 12 }} />
                <YAxis tick={{ fill: '#94a3b8', fontSize: 12 }} />
                <Tooltip contentStyle={tooltipStyle} />
                <Line type="monotone" dataKey="pm10" stroke="#34d399" dot={false} strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </GlassPanel>
      </div>

      <GlassPanel title="Health Recommendations" action="AQI based">
        <div className="space-y-3">
          {currentAQI.aqi <= 50 && (
            <div className="rounded-lg border border-emerald-400/30 bg-emerald-400/5 p-3">
              <p className="font-semibold text-emerald-300">Air Quality is Good</p>
              <p className="mt-1 text-sm text-emerald-200/80">
                It's a great day for outdoor activities. Enjoy the fresh air!
              </p>
            </div>
          )}
          {currentAQI.aqi > 50 && currentAQI.aqi <= 100 && (
            <div className="rounded-lg border border-amber-400/30 bg-amber-400/5 p-3">
              <p className="font-semibold text-amber-300">Air Quality is Moderate</p>
              <p className="mt-1 text-sm text-amber-200/80">
                Members of sensitive groups may experience respiratory issues during outdoor activities.
              </p>
            </div>
          )}
          {currentAQI.aqi > 100 && currentAQI.aqi <= 150 && (
            <div className="rounded-lg border border-orange-400/30 bg-orange-400/5 p-3">
              <p className="font-semibold text-orange-300">Air Quality is Poor</p>
              <p className="mt-1 text-sm text-orange-200/80">
                Everyone may begin to experience health effects. Limit outdoor activities.
              </p>
            </div>
          )}
          {currentAQI.aqi > 150 && (
            <div className="rounded-lg border border-red-400/30 bg-red-400/5 p-3">
              <p className="font-semibold text-red-300">Air Quality is Very Poor</p>
              <p className="mt-1 text-sm text-red-200/80">
                Health alert: Everyone should avoid outdoor activities. Stay indoors with air filtration.
              </p>
            </div>
          )}
        </div>
      </GlassPanel>
    </section>
  )
}

export default AirQualityPage
