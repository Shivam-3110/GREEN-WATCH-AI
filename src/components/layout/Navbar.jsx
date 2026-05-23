import { motion } from 'framer-motion'
import StatusChip from '../ui/StatusChip'

function Navbar({ onMenuClick }) {
  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between rounded-2xl border border-cyan-400/20 bg-[var(--surface-glass)] px-4 backdrop-blur-xl">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onMenuClick}
          className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-cyan-400/30 bg-cyan-500/10 text-cyan-100 md:hidden"
          aria-label="Toggle sidebar"
        >
          <span className="text-xl">=</span>
        </button>
        <motion.h1 initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-lg font-semibold tracking-wide text-cyan-50">
          EcoSphere AI
        </motion.h1>
      </div>

      <div className="flex items-center gap-3">
        <StatusChip />
        <div className="h-10 w-10 rounded-full border border-cyan-300/30 bg-gradient-to-br from-cyan-400/30 to-emerald-400/30" />
      </div>
    </header>
  )
}

export default Navbar