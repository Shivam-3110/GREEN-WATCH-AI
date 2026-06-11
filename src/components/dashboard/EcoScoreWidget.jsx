import { motion } from 'framer-motion'
import { ecoScore } from '../../data/dashboardData'

function EcoScoreWidget() {
  const circumference = 2 * Math.PI * 46
  const offset = circumference - (ecoScore.score / 100) * circumference

  return (
    <div className="flex flex-col items-center justify-center gap-4 py-2 text-center">
      <div className="relative h-36 w-36">
        <svg viewBox="0 0 120 120" className="h-full w-full -rotate-90">
          <circle cx="60" cy="60" r="46" stroke="rgba(255,255,255,0.09)" strokeWidth="10" fill="none" />
          <motion.circle
            cx="60"
            cy="60"
            r="46"
            stroke="url(#eco-score)"
            strokeWidth="10"
            fill="none"
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: offset }}
            transition={{ duration: 1, ease: 'easeOut' }}
          />
          <defs>
            <linearGradient id="eco-score" x1="0" x2="1">
              <stop offset="0%" stopColor="#bef264" />
              <stop offset="55%" stopColor="#34d399" />
              <stop offset="100%" stopColor="#67e8f9" />
            </linearGradient>
          </defs>
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <p className="text-4xl font-semibold text-white">{ecoScore.score}</p>
          <p className="text-xs uppercase tracking-[0.16em] text-slate-400">Eco Score</p>
        </div>
      </div>
      <div>
        <p className="text-sm text-emerald-200">{ecoScore.label}</p>
        <p className="mt-1 text-xs text-slate-400">{ecoScore.change}</p>
      </div>
    </div>
  )
}

export default EcoScoreWidget
