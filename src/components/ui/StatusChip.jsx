import { motion } from 'framer-motion'

function StatusChip() {
  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      className="hidden rounded-xl border border-emerald-300/30 bg-emerald-500/10 px-3 py-1 text-xs text-emerald-200 md:flex"
    >
      Live Sensors Connected
    </motion.div>
  )
}

export default StatusChip