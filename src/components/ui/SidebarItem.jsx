import { motion } from 'framer-motion'

const iconMap = {
  grid: 'M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h6v6h-6z',
  wind: 'M3 9h14a2 2 0 1 0-2-2M2 13h18a2 2 0 1 1-2 2M4 17h9a2 2 0 1 1-2 2',
  map: 'M3 6l6-2 6 2 6-2v14l-6 2-6-2-6 2V6z',
  settings: 'M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8zm8 4-.98.53a7.3 7.3 0 0 1 0 1L20 14l-1 2-1.1-.2a7.3 7.3 0 0 1-.7.7L17 18l-2 1-1-.98a7.3 7.3 0 0 1-1 0L12 19l-2-1 .2-1.1a7.3 7.3 0 0 1-.7-.7L8 16l-1-2 .98-.53a7.3 7.3 0 0 1 0-1L7 12l1-2 1.1.2c.2-.25.45-.5.7-.7L10 8l2-1 1 .98a7.3 7.3 0 0 1 1 0L15 7l2 1-.2 1.1c.25.2.5.45.7.7L19 10l1 2z',
}

function NavIcon({ type }) {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4 fill-none stroke-current" strokeWidth="1.5">
      <path d={iconMap[type]} />
    </svg>
  )
}

function SidebarItem({ item, isActive, onClick }) {
  return (
    <motion.button
      whileHover={{ x: 4 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={`flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm transition ${
        isActive
          ? 'bg-cyan-400/20 text-cyan-100 shadow-[0_0_20px_rgba(6,182,212,0.35)]'
          : 'text-slate-300 hover:bg-cyan-500/10 hover:text-cyan-100'
      }`}
    >
      <NavIcon type={item.icon} />
      <span>{item.label}</span>
    </motion.button>
  )
}

export default SidebarItem