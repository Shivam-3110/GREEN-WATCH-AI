import { motion, AnimatePresence } from 'framer-motion'
import { useNotifications } from '../contexts/NotificationContext'
import SectionHeader from '../components/ui/SectionHeader'

const ALERT_META = {
  aqi:      { icon: '🌬️', label: 'Air Quality',   color: 'cyan',   bg: 'bg-cyan-400/10',   border: 'border-cyan-400/25',   text: 'text-cyan-300' },
  heatwave: { icon: '🌡️', label: 'Heatwave',      color: 'red',    bg: 'bg-red-400/10',    border: 'border-red-400/25',    text: 'text-red-300' },
  flood:    { icon: '🌊', label: 'Flood',          color: 'blue',   bg: 'bg-blue-400/10',   border: 'border-blue-400/25',   text: 'text-blue-300' },
  default:  { icon: '⚠️', label: 'Alert',          color: 'amber',  bg: 'bg-amber-400/10',  border: 'border-amber-400/25',  text: 'text-amber-300' },
}

const severityColor = {
  critical: 'text-rose-300',
  high:     'text-red-300',
  medium:   'text-amber-300',
  low:      'text-emerald-300',
}

function getMeta(type) {
  return ALERT_META[type] ?? ALERT_META.default
}

export default function AlertTestPage() {
  const { alerts, isConnected } = useNotifications()

  const grouped = {
    critical: alerts.filter(a => a.severity === 'critical'),
    high:     alerts.filter(a => a.severity === 'high'),
    medium:   alerts.filter(a => a.severity === 'medium'),
    low:      alerts.filter(a => !a.severity || a.severity === 'low'),
  }

  return (
    <section className="space-y-5">
      <SectionHeader title="Alert System" subtitle="Environmental Alerts" />

      {/* Status bar */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-lg border border-white/10 bg-white/[0.055] p-4 backdrop-blur-xl flex items-center gap-4">
          <div className={`h-3 w-3 rounded-full ${isConnected ? 'bg-emerald-400' : 'bg-red-400'} animate-pulse`} />
          <div>
            <p className="text-xs uppercase tracking-widest text-slate-400">Connection</p>
            <p className={`mt-0.5 text-sm font-semibold ${isConnected ? 'text-emerald-300' : 'text-red-300'}`}>
              {isConnected ? 'Live — Receiving alerts' : 'Disconnected'}
            </p>
          </div>
        </div>

        <div className="rounded-lg border border-white/10 bg-white/[0.055] p-4 backdrop-blur-xl">
          <p className="text-xs uppercase tracking-widest text-slate-400">Active Alerts</p>
          <p className="mt-1 text-3xl font-bold text-white">{alerts.length}</p>
        </div>

        <div className="rounded-lg border border-white/10 bg-white/[0.055] p-4 backdrop-blur-xl">
          <p className="text-xs uppercase tracking-widest text-slate-400">Critical</p>
          <p className="mt-1 text-3xl font-bold text-rose-300">{grouped.critical.length}</p>
        </div>
      </div>

      {/* Alert feed */}
      {alerts.length === 0 ? (
        <div className="rounded-lg border border-white/10 bg-white/[0.04] p-12 text-center">
          <p className="text-4xl mb-3">✅</p>
          <p className="text-lg font-semibold text-slate-300">No active alerts</p>
          <p className="mt-1 text-sm text-slate-500">All environmental conditions are within safe limits.</p>
        </div>
      ) : (
        <div className="space-y-3">
          <AnimatePresence>
            {alerts.map((alert, i) => {
              const meta = getMeta(alert.type)
              return (
                <motion.div
                  key={alert.id ?? i}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ delay: i * 0.04 }}
                  className={`rounded-lg border ${meta.border} ${meta.bg} p-4 flex items-start gap-4 backdrop-blur-xl`}
                >
                  <span className="text-2xl mt-0.5">{meta.icon}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className={`text-sm font-semibold ${meta.text}`}>{meta.label}</p>
                      {alert.severity && (
                        <span className={`text-xs font-medium uppercase tracking-wider ${severityColor[alert.severity] ?? 'text-slate-400'}`}>
                          {alert.severity}
                        </span>
                      )}
                      {alert.location && (
                        <span className="text-xs text-slate-500">📍 {alert.location}</span>
                      )}
                    </div>
                    <p className="mt-1 text-sm text-slate-300 leading-relaxed">
                      {alert.message ?? 'Environmental alert detected in your area.'}
                    </p>
                    {alert.timestamp && (
                      <p className="mt-1 text-xs text-slate-500">
                        {new Date(alert.timestamp).toLocaleTimeString()}
                      </p>
                    )}
                  </div>
                </motion.div>
              )
            })}
          </AnimatePresence>
        </div>
      )}

      {/* Info cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { icon: '🌬️', title: 'Air Quality Alerts', desc: 'Triggered when AQI exceeds safe thresholds in your area.' },
          { icon: '🌡️', title: 'Heatwave Warnings', desc: 'Issued when temperatures rise to dangerous levels.' },
          { icon: '🌊', title: 'Flood Advisories', desc: 'Activated during heavy rainfall or rising water levels.' },
          { icon: '🔔', title: 'Realtime Updates', desc: 'All alerts are pushed instantly via live socket connection.' },
        ].map(({ icon, title, desc }) => (
          <div key={title} className="rounded-lg border border-white/10 bg-white/[0.04] p-4 backdrop-blur-xl">
            <p className="text-2xl mb-2">{icon}</p>
            <p className="text-sm font-semibold text-slate-200">{title}</p>
            <p className="mt-1 text-xs leading-5 text-slate-500">{desc}</p>
          </div>
        ))}
      </div>
    </section>
  )
}
