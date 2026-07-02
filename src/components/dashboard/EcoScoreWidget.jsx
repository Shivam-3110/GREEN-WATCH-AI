import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import apiClient from '../../services/apiClient'

const DEFAULT_PAYLOAD = {
  carbon: { totalEmissions: 4000, breakdown: {} },
  energy: { monthlyKWh: 400, sourceType: 'grid_average', efficiencyMeasures: {} },
  transportation: { vehicleUsage: { car_petrol: 300 }, publicTransit: 50, cycling: 10, walking: 20 },
  waste: { totalWaste: 40, recycled: 10, composted: 5, wasteTypes: {} },
  water: { monthlyConsumption: 120, conservationMeasures: {}, outdoorUsage: 20 },
}

function EcoScoreWidget() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    apiClient.post('/eco-score/calculate', DEFAULT_PAYLOAD)
      .then(res => {
        if (res.data.success) setData(res.data.data.ecoScore)
      })
      .catch(() => setData(null))
      .finally(() => setLoading(false))
  }, [])

  const score = data?.overallScore ?? 0
  const label = data?.level ?? '—'
  const grade = data?.grade ?? '—'
  const circumference = 2 * Math.PI * 46
  const offset = circumference - (score / 100) * circumference

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-slate-400">
        Calculating...
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center justify-center gap-4 py-2 text-center">
      <div className="relative h-36 w-36">
        <svg viewBox="0 0 120 120" className="h-full w-full -rotate-90">
          <circle cx="60" cy="60" r="46" stroke="rgba(255,255,255,0.09)" strokeWidth="10" fill="none" />
          <motion.circle
            cx="60" cy="60" r="46"
            stroke="url(#eco-score-grad)"
            strokeWidth="10" fill="none"
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: offset }}
            transition={{ duration: 1, ease: 'easeOut' }}
          />
          <defs>
            <linearGradient id="eco-score-grad" x1="0" x2="1">
              <stop offset="0%" stopColor="#bef264" />
              <stop offset="55%" stopColor="#34d399" />
              <stop offset="100%" stopColor="#67e8f9" />
            </linearGradient>
          </defs>
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <p className="text-4xl font-semibold text-white">{score}</p>
          <p className="text-xs uppercase tracking-[0.16em] text-slate-400">Eco Score</p>
        </div>
      </div>
      <div>
        <p className="text-sm text-emerald-200">{label}</p>
        <p className="mt-1 text-xs text-slate-400">Grade: {grade}</p>
      </div>
    </div>
  )
}

export default EcoScoreWidget
