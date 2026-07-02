import { motion, AnimatePresence } from 'framer-motion';
import { useNotifications } from '../../contexts/NotificationContext';

const SEVERITY_STYLES = {
  info: {
    bg: 'bg-blue-500',
    light: 'bg-blue-50',
    border: 'border-blue-500',
    text: 'text-blue-600',
    icon: 'ℹ️',
  },
  warning: {
    bg: 'bg-yellow-500',
    light: 'bg-yellow-50',
    border: 'border-yellow-500',
    text: 'text-yellow-600',
    icon: '⚠️',
  },
  critical: {
    bg: 'bg-orange-500',
    light: 'bg-orange-50',
    border: 'border-orange-500',
    text: 'text-orange-600',
    icon: '🔶',
  },
  emergency: {
    bg: 'bg-red-500',
    light: 'bg-red-50',
    border: 'border-red-500',
    text: 'text-red-600',
    icon: '🚨',
  },
};

const ALERT_TYPE_ICONS = {
  aqi: '🌬️',
  heatwave: '🌡️',
  flood: '🌊',
  storm: '⛈️',
  wildfire: '🔥',
};

export default function NotificationPopup() {
  const { alerts, removeAlert, clearAllAlerts, isConnected } = useNotifications();

  const getSeverityStyle = (severity) => SEVERITY_STYLES[severity] || SEVERITY_STYLES.info;

  return (
    <div className="fixed top-4 right-4 z-50 max-w-md space-y-3">
      {/* Connection Status Indicator */}
      <motion.div
        initial={{ opacity: 0, x: 50 }}
        animate={{ opacity: 1, x: 0 }}
        className={`flex items-center gap-2 px-3 py-2 rounded-lg ${
          isConnected ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
        }`}
      >
        <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'} animate-pulse`} />
        <span className="text-xs font-medium">
          {isConnected ? 'Live Alerts Active' : 'Connecting...'}
        </span>
      </motion.div>

      {/* Clear All Button */}
      {alerts.length > 0 && (
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          onClick={clearAllAlerts}
          className="w-full bg-gray-800 text-white text-xs py-2 rounded-lg hover:bg-gray-700 transition"
        >
          Clear All ({alerts.length})
        </motion.button>
      )}

      {/* Alerts */}
      <AnimatePresence mode="popLayout">
        {alerts.slice(0, 5).map((alert, index) => {
          const style = getSeverityStyle(alert.severity);
          const typeIcon = ALERT_TYPE_ICONS[alert.type] || '📢';

          return (
            <motion.div
              key={alert.id}
              initial={{ opacity: 0, x: 100, scale: 0.9 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 100, scale: 0.9 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
              className={`${style.light} border-l-4 ${style.border} rounded-lg shadow-lg overflow-hidden backdrop-blur-sm`}
            >
              {/* Header */}
              <div className={`${style.bg} px-4 py-2 flex items-center justify-between`}>
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{typeIcon}</span>
                  <span className="text-white font-bold text-sm">{alert.title}</span>
                </div>
                <button
                  onClick={() => removeAlert(alert.id)}
                  className="text-white hover:bg-white/20 rounded p-1 transition"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Content */}
              <div className="p-4">
                <p className="text-sm text-gray-700 mb-3">{alert.message}</p>

                {/* Details */}
                {alert.details && (
                  <div className="space-y-1 mb-3">
                    {alert.details.location && (
                      <p className="text-xs text-gray-600">
                        📍 <span className="font-medium">{alert.details.location}</span>
                      </p>
                    )}
                    {alert.details.aqi !== undefined && (
                      <p className="text-xs text-gray-600">
                        AQI: <span className={`font-bold ${style.text}`}>{alert.details.aqi}</span> ({alert.details.category})
                      </p>
                    )}
                    {alert.details.temperature !== undefined && (
                      <p className="text-xs text-gray-600">
                        🌡️ <span className={`font-bold ${style.text}`}>{alert.details.temperature}°C</span>
                        {alert.details.feelsLike && ` (Feels like ${alert.details.feelsLike}°C)`}
                      </p>
                    )}
                    {alert.details.riskLevel && (
                      <p className="text-xs text-gray-600">
                        Risk Level: <span className={`font-bold ${style.text} capitalize`}>{alert.details.riskLevel}</span>
                      </p>
                    )}
                  </div>
                )}

                {/* Recommendations */}
                {alert.recommendations && alert.recommendations.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-gray-200">
                    <p className="text-xs font-bold text-gray-700 mb-2">Safety Actions:</p>
                    <ul className="space-y-1">
                      {alert.recommendations.slice(0, 3).map((rec, idx) => (
                        <li key={idx} className="text-xs text-gray-600 flex items-start gap-1">
                          <span>•</span>
                          <span>{rec}</span>
                        </li>
                      ))}
                    </ul>
                    {alert.recommendations.length > 3 && (
                      <p className="text-xs text-gray-500 mt-1">+{alert.recommendations.length - 3} more</p>
                    )}
                  </div>
                )}

                {/* Timestamp */}
                <p className="text-xs text-gray-400 mt-3">
                  {new Date(alert.timestamp).toLocaleTimeString()}
                </p>
              </div>

              {/* Severity Indicator */}
              <div className={`h-1 ${style.bg}`}>
                <motion.div
                  initial={{ width: '100%' }}
                  animate={{ width: '0%' }}
                  transition={{ duration: 10, ease: 'linear' }}
                  className="h-full bg-white/30"
                />
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>

      {/* Show count if more than 5 alerts */}
      {alerts.length > 5 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-gray-800 text-white text-xs text-center py-2 rounded-lg"
        >
          +{alerts.length - 5} more alerts
        </motion.div>
      )}
    </div>
  );
}
