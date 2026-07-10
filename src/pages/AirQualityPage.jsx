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
import MrGreenChat from '../components/ui/MrGreenChat'

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

const getRecommendations = ({ aqi, pm25, no2, o3, co }) => {
  const recs = []

  if (aqi <= 50)
    recs.push({ icon: '🌿', title: 'Great day outdoors', color: 'emerald', desc: 'Air quality is excellent. Ideal for jogging, cycling, and outdoor sports for all age groups.' })
  else if (aqi <= 100)
    recs.push({ icon: '😷', title: 'Sensitive groups take care', color: 'amber', desc: 'Children, elderly, and people with asthma or heart conditions should reduce prolonged outdoor exertion.' })
  else if (aqi <= 150)
    recs.push({ icon: '⚠️', title: 'Limit outdoor activity', color: 'orange', desc: 'Everyone may experience discomfort. Avoid strenuous outdoor work. Keep windows closed during peak hours.' })
  else if (aqi <= 200)
    recs.push({ icon: '🚨', title: 'Stay indoors', color: 'red', desc: 'Serious health risk for all. Use N95 masks if going out. Run air purifiers indoors and avoid traffic areas.' })
  else
    recs.push({ icon: '☣️', title: 'Hazardous — Emergency level', color: 'rose', desc: 'Avoid all outdoor exposure. Seal windows and doors. Seek medical attention if experiencing breathing difficulty.' })

  if (pm25 > 35)
    recs.push({ icon: '🫁', title: 'High PM2.5 — Fine particles', color: 'orange', desc: `PM2.5 at ${pm25} µg/m³ penetrates deep into lungs. Wear N95 masks outdoors. Avoid cooking with solid fuels indoors.` })

  if (no2 > 40)
    recs.push({ icon: '🚗', title: 'Elevated NO₂ — Avoid traffic', color: 'amber', desc: `NO₂ at ${no2} µg/m³ is above safe limits. Avoid busy roads and diesel exhaust. Use public transport or cycle.` })

  if (o3 > 100)
    recs.push({ icon: '☀️', title: 'High ozone — Avoid midday outdoors', color: 'yellow', desc: `Ozone at ${o3} µg/m³ peaks in afternoon heat. Schedule outdoor activities before 10am or after 6pm.` })

  if (co > 1000)
    recs.push({ icon: '🔥', title: 'Elevated CO — Check ventilation', color: 'red', desc: `CO at ${co} µg/m³ is high. Ensure gas appliances are well-ventilated. Never run engines in enclosed spaces.` })

  if (aqi > 100)
    recs.push({ icon: '🏫', title: 'Schools & workplaces', color: 'indigo', desc: 'Shift outdoor school activities indoors. Employers should allow remote work on high-pollution days.' })

  if (aqi > 150)
    recs.push({ icon: '🌱', title: 'Community action needed', color: 'cyan', desc: 'Reduce crop burning, industrial emissions, and vehicle use. Plant trees and support local clean-air policies.' })

  return recs
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

      <GlassPanel title="Health & Society Recommendations" action="Based on live AQI">
        <div className="grid gap-3 sm:grid-cols-2">
          {getRecommendations(currentAQI).map(({ icon, title, desc, color }) => (
            <div key={title} className={`rounded-lg border border-${color}-400/25 bg-${color}-400/5 p-3 flex gap-3`}>
              <span className="text-xl">{icon}</span>
              <div>
                <p className={`text-sm font-semibold text-${color}-300`}>{title}</p>
                <p className="mt-0.5 text-xs leading-5 text-slate-300">{desc}</p>
              </div>
            </div>
          ))}
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

      <MrGreenChat aqiData={currentAQI} />
    </section>
  )
}

export default AirQualityPage
