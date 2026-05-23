import { NavLink } from 'react-router-dom'
import { motion } from 'framer-motion'
import { navLinks } from '../../data/navLinks'
import SidebarItem from '../ui/SidebarItem'

function Sidebar({ mobileOpen, onClose }) {
  return (
    <>
      <aside className="hidden w-64 shrink-0 rounded-2xl border border-cyan-400/20 bg-[var(--surface-glass)] p-4 backdrop-blur-xl md:block">
        <p className="mb-4 px-2 text-xs uppercase tracking-[0.2em] text-cyan-200/80">Navigation</p>
        <nav className="space-y-1">
          {navLinks.map((item) => (
            <NavLink key={item.path} to={item.path}>
              {({ isActive }) => <SidebarItem item={item} isActive={isActive} />}
            </NavLink>
          ))}
        </nav>
      </aside>

      {mobileOpen ? (
        <div className="fixed inset-0 z-40 md:hidden">
          <button
            type="button"
            onClick={onClose}
            className="absolute inset-0 bg-slate-950/70"
            aria-label="Close sidebar"
          />
          <motion.aside
            initial={{ x: -260 }}
            animate={{ x: 0 }}
            exit={{ x: -260 }}
            className="relative h-full w-64 border-r border-cyan-400/20 bg-[#07131d] p-4"
          >
            <p className="mb-4 px-2 text-xs uppercase tracking-[0.2em] text-cyan-200/80">Navigation</p>
            <nav className="space-y-1">
              {navLinks.map((item) => (
                <NavLink key={item.path} to={item.path} onClick={onClose}>
                  {({ isActive }) => <SidebarItem item={item} isActive={isActive} />}
                </NavLink>
              ))}
            </nav>
          </motion.aside>
        </div>
      ) : null}
    </>
  )
}

export default Sidebar