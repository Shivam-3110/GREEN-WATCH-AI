import { useEffect, useState } from 'react'
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { motion } from 'framer-motion'
import apiClient from '../services/apiClient'
import GlassPanel from '../components/dashboard/GlassPanel'
import MetricCard from '../components/dashboard/MetricCard'
import EcoScoreWidget from '../components/dashboard/EcoScoreWidget'
import { getLocationCoordinates } from '../utils/location'
import { alertNotifications } from '../data/dashboardData'

const carbonColors = ['#bef264', '#34d399', '#67e8f9', '#facc15']

const tooltipStyle = {
  background: 'rgba(3, 8, 6, 0.92)',
  border: '1px solid rgba(103, 232, 249, 0.18)',
  borderRadius: 8,
  color: '#ecfeff',
}

function DashboardPage() {
  const [aqiData, setAqiData] = useState(null)
  const [pollutionTrend, setPollutionTrend] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [carbonStats, setCarbonStats] = useState([])
  const [pollutants, setPollutants] = useState([])

  useEffect(() => {
    const fetchAQIData = async () => {
      try {
        setLoading(true)
        setError(null)
        console.log('Fetching location...')
        const location = await getLocationCoordinates()
        console.log('Location:', location)
        
        console.log('Fetching current AQI...')
        const currentRes = await apiClient.get('/air-quality/current', {
          params: { lat: location.lat, lon: location.lon },
        })
        console.log('Current AQI response:', currentRes.data)
        
        console.log('Fetching forecast...')
        const forecastRes = await apiClient.get('/air-quality/forecast', {
          params: { lat: location.lat, lon: location.lon },
        })
        console.log('Forecast response:', forecastRes.data)

        if (currentRes.data.success) {
          const current = currentRes.data.data
          setPollutants([
            { name: 'PM2.5', value: current.pm25,  limit: 35,   fill: '#ff2d2d' },
            { name: 'PM10',  value: current.pm10,  limit: 50,   fill: '#ff6a00' },
            { name: 'NO₂',   value: current.no2,   limit: 53,   fill: '#ff9500' },
            { name: 'SO₂',   value: current.so2,   limit: 35,   fill: '#c800ff' },
            { name: 'CO',    value: current.co,    limit: 1000, fill: '#ff003c' },
            { name: 'O₃',    value: current.o3,    limit: 70,   fill: '#ff4500' },
          ])
          setAqiData([
            {
              label: 'Live AQI',
              value: Math.round(current.aqi),
              unit: location.city || 'Your Location',
              status: current.status,
              trend: '+Real time',
              accent: 'from-emerald-300 to-cyan-300',
            },
            {
              label: 'PM2.5',
              value: current.pm25,
              unit: 'ug/m3',
              status: current.pm25 > 35 ? 'Watch' : 'Good',
              trend: 'Live',
              accent: 'from-cyan-300 to-sky-300',
            },
            {
              label: 'PM10',
              value: current.pm10,
              unit: 'ug/m3',
              status: current.pm10 > 50 ? 'Alert' : 'Stable',
              trend: 'Live',
              accent: 'from-lime-300 to-emerald-300',
            },
            {
              label: 'O3',
              value: current.o3,
              unit: 'ppb',
              status: current.o3 > 50 ? 'Watch' : 'Clean',
              trend: 'Live',
              accent: 'from-amber-200 to-emerald-300',
            },
          ])
        }

        if (forecastRes.data.success) {
          setPollutionTrend(forecastRes.data.data)
        }
      } catch (err) {
        console.error('Error fetching AQI data:', err.response?.data || err.message)
        setError(err.response?.data?.message || 'Failed to load AQI data')
      } finally {
        setLoading(false)
      }
    }

    fetchAQIData()
    const interval = setInterval(fetchAQIData, 300000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    const PAYLOAD = {
      vehicleUsage: { car_petrol: 300, bus: 100 },
      electricityUsage: { kWh: 400, sourceType: 'grid_average' },
      foodHabits: { beef: 3, chicken: 5, vegetables: 10 },
      fuelConsumption: { petrol: 40 },
    }
    apiClient.post('/carbon-footprint/calculate', PAYLOAD)
      .then(res => {
        if (!res.data.success) return
        const { percentages, carbonFootprintScore } = res.data.data
        setCarbonStats([
          { name: 'Transport', value: parseFloat(percentages.vehicle) },
          { name: 'Energy',    value: parseFloat(percentages.electricity) },
          { name: 'Food',      value: parseFloat(percentages.food) },
          { name: 'Fuel',      value: parseFloat(percentages.fuel) },
        ])
        // Derive weekly trend: daily avg from monthly total, with ±15% variation
        const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
        const dailyAvg = carbonFootprintScore / 30
        const variations = [1.05, 0.95, 1.1, 0.88, 0.92, 0.78, 0.72]
        setFootprintTrend(
          days.map((day, i) => {
            const fp = Math.round(dailyAvg * variations[i])
            const saved = Math.round(fp * (0.2 + i * 0.03))
            return { day, footprint: fp, saved }
          })
        )
      })
      .catch(() => {})
  }, [])
  return (
    <section className="space-y-5">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col justify-between gap-4 border-b border-white/10 pb-5 lg:flex-row lg:items-end"
      >
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-emerald-300">GREEN-WATCH Control Center</p>
          <h2 className="mt-2 max-w-2xl text-3xl font-semibold text-white md:text-4xl">
            Environmental intelligence dashboard
          </h2>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300">
            Live AQI, pollution movement, carbon footprint signals, and alerts stitched into one operational view.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-2 text-sm sm:flex">
          <span className="rounded-lg border border-emerald-300/20 bg-emerald-400/10 px-3 py-2 text-emerald-200">Live sync</span>
          <span className="rounded-lg border border-cyan-300/20 bg-cyan-400/10 px-3 py-2 text-cyan-100">24h forecast</span>
        </div>
      </motion.div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {loading ? (
          <div className="col-span-full rounded-lg border border-white/10 bg-black/20 p-4 text-center text-slate-400">
            Loading AQI data...
          </div>
        ) : error ? (
          <div className="col-span-full rounded-lg border border-red-500/20 bg-red-500/5 p-4 text-center text-red-400">
            {error}
          </div>
        ) : (
          aqiData?.map((card, index) => (
            <MetricCard key={card.label} card={card} index={index} />
          ))
        )}
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.45fr_0.75fr]">
        <GlassPanel title="Pollution Analytics" action="AQI / PM trend">
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={pollutionTrend.length > 0 ? pollutionTrend : []} margin={{ left: -18, right: 8, top: 12, bottom: 0 }}>
                <defs>
                  <linearGradient id="aqi-fill" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="5%" stopColor="#67e8f9" stopOpacity={0.34} />
                    <stop offset="95%" stopColor="#67e8f9" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="pm-fill" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="5%" stopColor="#bef264" stopOpacity={0.28} />
                    <stop offset="95%" stopColor="#bef264" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="rgba(255,255,255,0.08)" strokeDasharray="4 8" />
                <XAxis dataKey="time" tick={{ fill: '#94a3b8', fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#94a3b8', fontSize: 12 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={tooltipStyle} />
                <Area type="monotone" dataKey="aqi" stroke="#67e8f9" fill="url(#aqi-fill)" strokeWidth={3} />
                <Area type="monotone" dataKey="pm25" stroke="#bef264" fill="url(#pm-fill)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </GlassPanel>

        <GlassPanel title="Eco Score Widget" action="Personal index">
          <EcoScoreWidget />
        </GlassPanel>
      </div>

      <div className="grid gap-4 xl:grid-cols-[0.9fr_1.1fr_0.9fr]">
        <GlassPanel title="Carbon Footprint Stats" action="kg CO2e">
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={carbonStats} dataKey="value" nameKey="name" innerRadius={54} outerRadius={86} paddingAngle={4}>
                  {carbonStats.map((entry, index) => (
                    <Cell key={entry.name} fill={carbonColors[index % carbonColors.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={tooltipStyle} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {carbonStats.map((item, index) => (
              <div key={item.name} className="rounded-lg border border-white/10 bg-black/20 p-2 text-xs text-slate-300">
                <span className="mb-2 block h-1 w-7 rounded-full" style={{ backgroundColor: carbonColors[index] }} />
                {item.name}: {item.value}%
              </div>
            ))}
          </div>
        </GlassPanel>

        <GlassPanel title="Air Quality Breakdown" action="Live pollutants">
          <div className="flex h-full flex-col justify-between gap-2">
            {(pollutants.length > 0 ? pollutants : [
              { name: 'PM2.5', value: 0, limit: 35,   fill: '#ff2d2d' },
              { name: 'PM10',  value: 0, limit: 50,   fill: '#ff6a00' },
              { name: 'NO₂',   value: 0, limit: 53,   fill: '#ff9500' },
              { name: 'SO₂',   value: 0, limit: 35,   fill: '#c800ff' },
              { name: 'CO',    value: 0, limit: 1000, fill: '#ff003c' },
              { name: 'O₃',    value: 0, limit: 70,   fill: '#ff4500' },
            ]).map((p, i) => {
              const pct = Math.min((p.value / p.limit) * 100, 100)
              const danger = pct >= 100 ? 'HAZARDOUS' : pct >= 75 ? 'DANGER' : pct >= 50 ? 'WARNING' : 'SAFE'
              return (
                <motion.div
                  key={p.name}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.06 }}
                  className="group rounded-lg border border-white/5 bg-black/30 p-3"
                  style={{ boxShadow: pct >= 75 ? `0 0 12px ${p.fill}33` : 'none' }}
                >
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-xs font-semibold text-white">{p.name}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-400">{p.value} <span className="text-slate-600">/ {p.limit} µg/m³</span></span>
                      <span
                        className="rounded px-1.5 py-0.5 text-[10px] font-bold tracking-wider"
                        style={{ color: p.fill, backgroundColor: `${p.fill}22`, border: `1px solid ${p.fill}55` }}
                      >
                        {danger}
                      </span>
                    </div>
                  </div>
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/5">
                    <motion.div
                      className="h-full rounded-full"
                      style={{ backgroundColor: p.fill, boxShadow: `0 0 8px ${p.fill}` }}
                      initial={{ width: 0 }}
                      animate={{ width: `${pct}%` }}
                      transition={{ duration: 0.8, delay: i * 0.06, ease: 'easeOut' }}
                    />
                  </div>
                </motion.div>
              )
            })}
          </div>
        </GlassPanel>

        <GlassPanel title="Alert Notifications" action={`${alertNotifications.length} active`}>
          <div className="space-y-3">
            {alertNotifications.map((alert, index) => (
              <motion.article
                key={alert.title}
                initial={{ opacity: 0, x: 16 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.08 }}
                className="rounded-lg border border-white/10 bg-black/22 p-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium text-white">{alert.title}</p>
                    <p className="mt-1 text-xs leading-5 text-slate-400">{alert.message}</p>
                  </div>
                  <span className="rounded-md border border-emerald-300/20 bg-emerald-400/10 px-2 py-1 text-xs text-emerald-200">
                    {alert.severity}
                  </span>
                </div>
                <p className="mt-3 text-xs text-slate-500">{alert.time}</p>
              </motion.article>
            ))}
          </div>
        </GlassPanel>
      </div>
    </section>
  )
}

export default DashboardPage
