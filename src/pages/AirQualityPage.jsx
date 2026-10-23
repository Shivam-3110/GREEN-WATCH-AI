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
  const aqiVisual = ['Good', 'Moderate'].includes(aqiStatus.label)
    ? {
        level: 'good',
        image: '/images/aqi/happy-nazuko.png',
        imageAlt: 'Girl illustration for good to moderate air quality',
        card: 'border-rose-200/15 from-slate-800 via-rose-950 to-rose-800',
        glow: 'bg-rose-400/10',
        atmosphereStart: '#F9A8D4',
        atmosphereEnd: '#FB7185',
        cloud: '#FBCFE8',
      }
    : ['Poor', 'Very Poor'].includes(aqiStatus.label)
      ? {
          level: 'unhealthy',
          image: '/images/aqi/mask-nazuko.png',
          imageAlt: 'Girl illustration for poor to unhealthy air quality',
          card: 'border-amber-200/20 from-slate-800 via-amber-950 to-amber-800',
          glow: 'bg-amber-400/10',
          atmosphereStart: '#FDE68A',
          atmosphereEnd: '#F59E0B',
          cloud: '#FEF3C7',
        }
      : {
          level: 'hazardous',
          image: '/images/aqi/sick-nazuko.png',
          imageAlt: 'Girl illustration for very unhealthy or hazardous air quality',
          card: 'border-red-200/20 from-slate-900 via-red-950 to-red-900',
          glow: 'bg-red-500/15',
          atmosphereStart: '#FDA4AF',
          atmosphereEnd: '#EF4444',
          cloud: '#FECACA',
        }
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
        className={`relative min-h-[19rem] overflow-hidden rounded-2xl border bg-gradient-to-b ${aqiVisual.card} p-5 shadow-[0_24px_70px_rgba(0,0,0,0.3)] sm:min-h-[20rem] sm:p-7`}
      >
        <div className={`pointer-events-none absolute -right-16 -top-24 h-64 w-64 rounded-full ${aqiVisual.glow} blur-3xl`} />
        <motion.svg className="pointer-events-none absolute inset-0 h-full w-full" viewBox="0 0 1000 300" preserveAspectRatio="none" aria-hidden="true">
          <defs>
            <linearGradient id="aqi-atmosphere" x1="500" y1="0" x2="500" y2="300" gradientUnits="userSpaceOnUse">
              <stop stopColor={aqiVisual.atmosphereStart} stopOpacity=".07" />
              <stop offset="1" stopColor={aqiVisual.atmosphereEnd} stopOpacity=".78" />
            </linearGradient>
            <filter id="aqi-cloud-softness" x="-20%" y="-40%" width="140%" height="180%">
              <feGaussianBlur stdDeviation="4" />
            </filter>
          </defs>
          <rect width="1000" height="300" fill="url(#aqi-atmosphere)" />
          <motion.g animate={{ x: [0, 1000] }} transition={{ duration: 160, repeat: Infinity, ease: 'linear' }} filter="url(#aqi-cloud-softness)" fill={aqiVisual.cloud} fillOpacity=".55">
            <g>
              <ellipse cx="145" cy="115" rx="140" ry="24" />
              <ellipse cx="190" cy="106" rx="78" ry="31" />
              <ellipse cx="515" cy="133" rx="178" ry="24" />
              <ellipse cx="565" cy="122" rx="90" ry="33" />
              <ellipse cx="880" cy="106" rx="154" ry="26" />
              <ellipse cx="840" cy="96" rx="82" ry="31" />
            </g>
            <g transform="translate(-1000 0)">
              <ellipse cx="145" cy="115" rx="140" ry="24" />
              <ellipse cx="190" cy="106" rx="78" ry="31" />
              <ellipse cx="515" cy="133" rx="178" ry="24" />
              <ellipse cx="565" cy="122" rx="90" ry="33" />
              <ellipse cx="880" cy="106" rx="154" ry="26" />
              <ellipse cx="840" cy="96" rx="82" ry="31" />
            </g>
          </motion.g>
          <motion.g animate={{ x: [0, 1000] }} transition={{ duration: 199, repeat: Infinity, ease: 'linear' }} filter="url(#aqi-cloud-softness)" fill={aqiVisual.cloud} fillOpacity=".29">
            <g>
              <ellipse cx="300" cy="205" rx="192" ry="22" />
              <ellipse cx="680" cy="218" rx="230" ry="27" />
            </g>
            <g transform="translate(-1000 0)">
              <ellipse cx="300" cy="205" rx="192" ry="22" />
              <ellipse cx="680" cy="218" rx="230" ry="27" />
            </g>
          </motion.g>
          <path d="M0 278h1000" stroke="#FBCFE8" strokeOpacity=".12" />
          <path d="M0 300v-15h18v-9h9v24m18 0v-20h13v-11h7v31m15 0v-14h20v-18h9v32m36 0v-24h14v-12h7v36m28 0v-18h18v-15h8v33m32 0v-25h11v-10h9v35m25 0v-17h16v-12h10v29m42 0v-28h13v-10h8v38m24 0v-21h18v-17h9v38m35 0v-14h21v-22h10v36m38 0v-25h12v-11h9v36m28 0v-17h18v-13h8v30m43 0v-22h15v-13h9v35m31 0v-15h18v-18h9v33m39 0v-25h12v-10h10v35m35 0v-18h18v-14h9v32m37 0v-23h14v-12h10v35m32 0v-16h19v-14h8v30m33 0v-26h13v-9h10v35m35 0v-17h18v-16h9v33" fill="#FBCFE8" fillOpacity=".1" />
        </motion.svg>
        <div className="relative">
          <div className="relative flex flex-col gap-7 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex min-w-0 items-center gap-3 sm:gap-4">
              <svg className="h-12 w-10 shrink-0 sm:h-16 sm:w-12" viewBox="0 0 48 72" fill="none" aria-hidden="true">
                <defs>
                  <linearGradient id="smog-gradient" x1="8" y1="12" x2="40" y2="62" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#FBBF24" stopOpacity=".9" />
                    <stop offset="1" stopColor="#F97316" stopOpacity=".55" />
                  </linearGradient>
                </defs>
                <path d="M9 37c-4-1-6-4-6-8 0-4 3-7 7-8 1-7 7-12 14-12 6 0 11 3 13 9 5 0 9 4 9 9 0 5-4 9-9 10H9Z" fill="url(#smog-gradient)" fillOpacity=".13" stroke="url(#smog-gradient)" strokeWidth="1.6" />
                <path d="M9 43c5-3 9-3 14 0 5 3 9 3 15 0M6 50c5-3 9-3 14 0 5 3 9 3 15 0" stroke="url(#smog-gradient)" strokeLinecap="round" strokeWidth="2" />
                <circle cx="16" cy="25" r="2" fill="#FBBF24" />
                <circle cx="26" cy="20" r="1.5" fill="#FDBA74" />
                <path d="m35 54 7 12H28l7-12Z" fill="#F97316" fillOpacity=".14" stroke="#FB923C" strokeLinejoin="round" strokeWidth="1.5" />
                <path d="M35 58v4m0 2v.1" stroke="#FDBA74" strokeLinecap="round" strokeWidth="1.5" />
              </svg>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_12px_rgba(52,211,153,0.8)]" />
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-black-950">Live AQI</p>
                </div>
                <div className="mt-4 flex flex-wrap items-end gap-x-4 gap-y-2">
                <span className="text-6xl font-semibold leading-none tracking-tight text-pink-700 sm:text-7xl">
                    {Math.round(currentAQI.aqi)}
                  </span>
                  <span className="pb-1 text-sm text-black font-bold">AQI</span>
                  <span className={`mb-1 rounded-full border border-${aqiStatus.color}-400/25 bg-${aqiStatus.color}-400/10 px-3 py-1 text-sm font-medium text-${aqiStatus.color}-300`}>
                    {aqiStatus.label}
                  </span>
                </div>
                <p className="mt-3 text-sm text-gray-800 font-semibold ">
                  Updated {new Date(currentAQI.timestamp).toLocaleTimeString()}
                </p>
              </div>
            </div>
            <div className="flex items-center justify-between gap-4 sm:justify-end sm:gap-5">
              <div className="grid grid-cols-2 gap-3 sm:min-w-64">
                {[{ label: 'PM2.5', value: currentAQI.pm25 }, { label: 'PM10', value: currentAQI.pm10 }].map((item) => (
                  <div key={item.label} className="rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3">
                    <p className="text-xs font-medium uppercase tracking-wider font-semibold text-gray-900">{item.label}</p>
                    <p className="mt-2 text-xl font-semibold text-white">
                      {item.value.toFixed(1)} <span className="text-xs font-normal text-gray-900 font-semibold "> µg/m³</span>
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="mt-7">
            <div className="relative h-2.5 rounded-full bg-gradient-to-r from-emerald-400 via-lime-300 via-amber-300 via-orange-400 via-red-500 to-purple-600">
              <span
                className="absolute top-1/2 h-5 w-5 -translate-x-1/2 -translate-y-1/2 rounded-full border-[3px] border-white bg-slate-950 shadow-[0_0_16px_rgba(255,255,255,0.55)]"
                style={{ left: `${Math.min(Math.max(currentAQI.aqi / 301, 0), 1) * 100}%` }}
              />
            </div>
            <div className="mt-3 grid grid-cols-3 gap-2 text-[10px]  text-gray-800 sm:grid-cols-6 sm:text-xs font-medium">
              {['Good', 'Moderate', 'Poor', 'Unhealthy', 'Severe', 'Hazardous'].map((label) => (
                <span key={label} className="text-center">{label}</span>
              ))}
            </div>
          </div>
          <div className="mt-1 flex h-48 items-end justify-between px-1 sm:h-52" aria-hidden="true">
            <svg className="mb-1 h-16 w-24 shrink-0 sm:h-20 sm:w-28" viewBox="0 0 80 56" fill="none">
              <path d="M25 41c-9 1-15-4-13-12 1-5 5-8 9-9" stroke="#A66A45" strokeLinecap="round" strokeWidth="2.5" />
              <path d="M48 39c5-9 17-9 21 0 2 5-1 10-6 11H46c-4-1-5-6-2-9l4-2Z" fill="#9A5B39" stroke="#5B3829" strokeWidth="1.5" />
              <path d="M28 25c0-9 5-15 13-15 7 0 13 6 13 15v8H28v-8Z" fill="#B9774B" stroke="#5B3829" strokeWidth="1.5" />
              <circle cx="29" cy="16" r="10" fill="#9A5B39" stroke="#5B3829" strokeWidth="1.5" />
              <circle cx="53" cy="15" r="10" fill="#9A5B39" stroke="#5B3829" strokeWidth="1.5" />
              <circle cx="29" cy="16" r="5.8" fill="#F2B8A0" />
              <circle cx="53" cy="15" r="5.8" fill="#F2B8A0" />
              <ellipse cx="35" cy="24" rx="3.2" ry="4" fill="white" />
              <ellipse cx="48" cy="24" rx="3.2" ry="4" fill="white" />
              <circle cx="36" cy="25" r="1.8" fill="#33231D" />
              <circle cx="47" cy="25" r="1.8" fill="#33231D" />
              <path d="M35 31c4-3 10-3 14 0 0 4-3 7-7 7s-7-3-7-7Z" fill="#F6E1CB" />
              <ellipse cx="42" cy="31" rx="2.2" ry="1.6" fill="#E78D91" />
              <path d="M40 35c1.5 1.5 3 1.5 4.5 0m-15-2-7 2m7 1-6 4m30-7 7 2m-7 1 6 4" stroke="#F2D8C6" strokeLinecap="round" strokeWidth="1.2" />
              <path d="M51 45h5m-20 5h-5m25 0h-5" stroke="#F2C19A" strokeLinecap="round" strokeWidth="2.5" />
            </svg>
            <img
              src={aqiVisual.image}
              alt={aqiVisual.imageAlt}
              className="h-46 w-34 shrink-0 object-cover object-bottom drop-shadow-lg sm:h-50 sm:w-38"
            />
          </div>
        </div>
      </motion.div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 ">
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
