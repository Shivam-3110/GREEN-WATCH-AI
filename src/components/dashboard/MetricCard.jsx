import { motion } from 'framer-motion'

function MetricCard({ card, index }) {
  return (
    <motion.article
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06 }}
      whileHover={{ y: -4 }}
      className="group rounded-lg border border-white/10 bg-white/[0.055] p-4 shadow-[0_18px_50px_rgba(0,0,0,0.24)] backdrop-blur-xl"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-slate-400">{card.label}</p>
          <div className="mt-3 flex items-end gap-2">
            <p className="text-3xl font-semibold text-white">{card.value}</p>
            <p className="pb-1 text-xs text-slate-400">{card.unit}</p>
          </div>
        </div>
        <span className={`h-10 w-10 rounded-lg bg-gradient-to-br ${card.accent} opacity-90 shadow-[0_0_28px_rgba(45,212,191,0.2)]`} />
      </div>
      <div className="mt-5 flex items-center justify-between gap-3 border-t border-white/10 pt-3 text-xs">
        <span className="text-emerald-200">{card.status}</span>
        <span className="text-slate-400">{card.trend}</span>
      </div>
    </motion.article>
  )
}

export default MetricCard
