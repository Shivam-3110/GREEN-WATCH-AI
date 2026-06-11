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
import GlassPanel from '../components/dashboard/GlassPanel'
import MetricCard from '../components/dashboard/MetricCard'
import EcoScoreWidget from '../components/dashboard/EcoScoreWidget'
import {
  alertNotifications,
  aqiCards,
  carbonStats,
  footprintTrend,
  pollutionTrend,
} from '../data/dashboardData'

const carbonColors = ['#bef264', '#34d399', '#67e8f9', '#facc15']

const tooltipStyle = {
  background: 'rgba(3, 8, 6, 0.92)',
  border: '1px solid rgba(103, 232, 249, 0.18)',
  borderRadius: 8,
  color: '#ecfeff',
}

function DashboardPage() {
  return (
    <section className="space-y-5">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col justify-between gap-4 border-b border-white/10 pb-5 lg:flex-row lg:items-end"
      >
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-emerald-300">EcoSphere Control Center</p>
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
        {aqiCards.map((card, index) => (
          <MetricCard key={card.label} card={card} index={index} />
        ))}
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.45fr_0.75fr]">
        <GlassPanel title="Pollution Analytics" action="AQI / PM trend">
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={pollutionTrend} margin={{ left: -18, right: 8, top: 12, bottom: 0 }}>
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

        <GlassPanel title="Environmental Charts" action="Weekly footprint">
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={footprintTrend} margin={{ left: -18, right: 8, top: 12, bottom: 0 }}>
                <CartesianGrid stroke="rgba(255,255,255,0.08)" strokeDasharray="4 8" />
                <XAxis dataKey="day" tick={{ fill: '#94a3b8', fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#94a3b8', fontSize: 12 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={tooltipStyle} />
                <Bar dataKey="footprint" fill="#22d3ee" radius={[6, 6, 0, 0]} />
                <Bar dataKey="saved" fill="#a3e635" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
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
