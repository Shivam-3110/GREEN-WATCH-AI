import { motion } from 'framer-motion'

function GlassPanel({ title, action, children, className = '' }) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className={`rounded-lg border border-white/10 bg-white/[0.055] p-4 backdrop-blur-xl ${className}`}
    >
      <div className="mb-4 flex items-center justify-between gap-3">
        <h3 className="text-sm font-semibold text-cyan-50">{title}</h3>
        {action ? <span className="text-xs text-emerald-300">{action}</span> : null}
      </div>
      {children}
    </motion.section>
  )
}

export default GlassPanel
