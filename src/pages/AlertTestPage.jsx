import { useState } from 'react';
import { motion } from 'framer-motion';
import axios from 'axios';
import { useNotifications } from '../contexts/NotificationContext';

export default function AlertTestPage() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const { alerts, isConnected } = useNotifications();

  const triggerAlert = async (type) => {
    setLoading(true);
    setResult(null);

    try {
      const response = await axios.post('http://localhost:5000/api/v1/alerts/test', {
        type,
        location: 'Delhi',
      });

      setResult({
        success: true,
        message: `${type} alert triggered successfully!`,
        data: response.data,
      });
    } catch (error) {
      setResult({
        success: false,
        message: error.response?.data?.message || 'Failed to trigger alert',
      });
    } finally {
      setLoading(false);
    }
  };

  const alertTypes = [
    { type: 'aqi', name: 'Air Quality', icon: '🌬️', color: 'bg-blue-500' },
    { type: 'heatwave', name: 'Heatwave', icon: '🌡️', color: 'bg-red-500' },
    { type: 'flood', name: 'Flood', icon: '🌊', color: 'bg-cyan-500' },
    { type: 'random', name: 'Random Alert', icon: '🎲', color: 'bg-purple-500' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">🚨 Environmental Alert System</h1>
          <p className="text-gray-600">Test realtime notifications with Socket.io</p>
        </motion.div>

        {/* Connection Status */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-gray-800 mb-1">Connection Status</h2>
              <p className="text-sm text-gray-600">Socket.io realtime connection</p>
            </div>
            <div className={`flex items-center gap-2 px-4 py-2 rounded-full ${
              isConnected ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
            }`}>
              <div className={`w-3 h-3 rounded-full ${
                isConnected ? 'bg-green-500' : 'bg-red-500'
              } animate-pulse`} />
              <span className="font-medium">{isConnected ? 'Connected' : 'Disconnected'}</span>
            </div>
          </div>
        </div>

        {/* Active Alerts Count */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-gray-800 mb-1">Active Alerts</h2>
              <p className="text-sm text-gray-600">Currently showing notifications</p>
            </div>
            <div className="bg-gradient-to-r from-cyan-500 to-blue-600 text-white text-3xl font-bold w-16 h-16 rounded-full flex items-center justify-center">
              {alerts.length}
            </div>
          </div>
        </div>

        {/* Trigger Alerts */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Trigger Test Alerts</h2>
          <div className="grid grid-cols-2 gap-4">
            {alertTypes.map((alert) => (
              <motion.button
                key={alert.type}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => triggerAlert(alert.type)}
                disabled={loading}
                className={`${alert.color} text-white rounded-xl p-6 hover:shadow-lg transition disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                <div className="text-4xl mb-2">{alert.icon}</div>
                <div className="text-lg font-bold">{alert.name}</div>
              </motion.button>
            ))}
          </div>
        </div>

        {/* Result */}
        {result && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`rounded-2xl shadow-lg p-6 ${
              result.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
            }`}
          >
            <div className="flex items-start gap-3">
              <span className="text-2xl">{result.success ? '✅' : '❌'}</span>
              <div className="flex-1">
                <h3 className={`font-bold mb-1 ${result.success ? 'text-green-700' : 'text-red-700'}`}>
                  {result.success ? 'Success!' : 'Error'}
                </h3>
                <p className="text-sm text-gray-700">{result.message}</p>
              </div>
            </div>
          </motion.div>
        )}

        {/* Instructions */}
        <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-2xl shadow-lg p-6">
          <h3 className="text-lg font-bold text-gray-800 mb-3">📋 How It Works</h3>
          <ul className="space-y-2 text-sm text-gray-700">
            <li className="flex items-start gap-2">
              <span>1️⃣</span>
              <span>Socket.io connects automatically when app loads</span>
            </li>
            <li className="flex items-start gap-2">
              <span>2️⃣</span>
              <span>Click any button above to trigger a test alert</span>
            </li>
            <li className="flex items-start gap-2">
              <span>3️⃣</span>
              <span>Alert appears in top-right corner with realtime animation</span>
            </li>
            <li className="flex items-start gap-2">
              <span>4️⃣</span>
              <span>Click X to dismiss individual alerts or "Clear All" to remove all</span>
            </li>
            <li className="flex items-start gap-2">
              <span>5️⃣</span>
              <span>Alerts auto-expire based on their severity level</span>
            </li>
          </ul>
        </div>

        {/* API Endpoints */}
        <div className="mt-6 bg-gray-800 text-white rounded-2xl shadow-lg p-6">
          <h3 className="text-lg font-bold mb-3">🔌 API Endpoints</h3>
          <div className="space-y-2 font-mono text-xs">
            <div className="bg-gray-700 rounded p-2">
              <span className="text-green-400">POST</span> /api/v1/alerts/aqi
            </div>
            <div className="bg-gray-700 rounded p-2">
              <span className="text-green-400">POST</span> /api/v1/alerts/heatwave
            </div>
            <div className="bg-gray-700 rounded p-2">
              <span className="text-green-400">POST</span> /api/v1/alerts/flood
            </div>
            <div className="bg-gray-700 rounded p-2">
              <span className="text-green-400">POST</span> /api/v1/alerts/test
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
