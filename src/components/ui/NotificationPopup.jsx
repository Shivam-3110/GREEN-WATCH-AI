import { motion, AnimatePresence } from 'framer-motion'
import { useNotifications } from '../../contexts/NotificationContext'

const SEVERITY_STYLES = {
  info:      { bg: 'bg-blue-500',   border: 'border-blue-400',   text: 'text-blue-300' },
  warning:   { bg: 'bg-amber-500',  border: 'border-amber-400',  text: 'text-amber-300' },
  critical:  { bg: 'bg-orange-500', border: 'border-orange-400', text: 'text-orange-300' },
  emergency: { bg: 'bg-red-500',    border: 'border-red-400',    text: 'text-red-300' },
}

const TYPE_ICONS = { aqi: '🌬️', heatwave: '🌡️', flood: '🌊', storm: '⛈️', wildfire: '🔥' }

export default function NotificationPopup() {
  const { alerts, removeAlert, clearAllAlerts } = useNotifications()

  // Show only the latest alert as a single popup
  const latest = alerts[0]

  return (
    <div className="fixed top-4 right-4 z-50 w-80 space-y-2">
      <AnimatePresence mode="wait">
        {latest && (() => {
          const style = SEVERITY_STYLES[latest.severity] ?? SEVERITY_STYLES.info
          const icon  = TYPE_ICONS[latest.type] ?? '⚠️'
          return (
            <motion.div
              key={latest.id}
              initial={{ opacity: 0, x: 80, scale: 0.95 }}
              animate={{ opacity: 1, x: 0,  scale: 1 }}
              exit={{    opacity: 0, x: 80, scale: 0.95 }}
              transition={{ duration: 0.25 }}
              className={`rounded-xl border-l-4 ${style.border} bg-[#060f0a]/95 backdrop-blur-xl shadow-2xl overflow-hidden`}
            >
              <div className={`${style.bg} px-4 py-2 flex items-center justify-between`}>
                <div className="flex items-center gap-2">
                  <span className="text-xl">{icon}</span>
                  <span className="text-white font-semibold text-sm">{latest.title}</span>
                </div>
                <button onClick={() => removeAlert(latest.id)} className="text-white/80 hover:text-white text-lg leading-none">
                  ✕
                </button>
              </div>

              <div className="px-4 py-3 space-y-1">
                <p className="text-sm text-slate-200">{latest.message}</p>
                {latest.details?.aqi !== undefined && (
                  <p className="text-xs text-slate-400">AQI: <span className={`font-bold ${style.text}`}>{latest.details.aqi}</span> — {latest.details.category}</p>
                )}
                {latest.details?.temperature !== undefined && (
                  <p className="text-xs text-slate-400">🌡️ <span className={`font-bold ${style.text}`}>{latest.details.temperature}°C</span>{latest.details.feelsLike ? ` · Feels like ${latest.details.feelsLike}°C` : ''}</p>
                )}
                {latest.details?.location && (
                  <p className="text-xs text-slate-500">📍 {latest.details.location}</p>
                )}
                {latest.recommendations?.slice(0, 2).map((r, i) => (
                  <p key={i} className="text-xs text-slate-400">• {r}</p>
                ))}
                <p className="text-xs text-slate-600 pt-1">{new Date(latest.timestamp).toLocaleTimeString()}</p>
              </div>

              {/* auto-dismiss progress bar */}
              <div className="h-0.5 bg-white/10">
                <motion.div className={`h-full ${style.bg}`}
                  initial={{ width: '100%' }} animate={{ width: '0%' }}
                  transition={{ duration: 8, ease: 'linear' }}
                  onAnimationComplete={() => removeAlert(latest.id)}
                />
              </div>
            </motion.div>
          )
        })()}
      </AnimatePresence>

      {alerts.length > 1 && (
        <motion.button initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          onClick={clearAllAlerts}
          className="w-full rounded-lg bg-white/[0.06] border border-white/10 text-xs text-slate-400 py-1.5 hover:text-slate-200 transition"
        >
          {alerts.length - 1} more alert{alerts.length > 2 ? 's' : ''} — Clear all
        </motion.button>
      )}
    </div>
  )
}
