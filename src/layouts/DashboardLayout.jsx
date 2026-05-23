import { useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import Navbar from '../components/layout/Navbar'
import Sidebar from '../components/layout/Sidebar'

function DashboardLayout() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const location = useLocation()

  return (
    <div className="min-h-screen p-3 md:p-5">
      <div className="mx-auto flex w-full max-w-7xl gap-4">
        <Sidebar mobileOpen={mobileOpen} onClose={() => setMobileOpen(false)} />

        <div className="flex min-h-[calc(100vh-2rem)] flex-1 flex-col gap-4">
          <Navbar onMenuClick={() => setMobileOpen((prev) => !prev)} />

          <AnimatePresence mode="wait">
            <motion.main
              key={location.pathname}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.22 }}
              className="flex-1 rounded-2xl border border-cyan-400/15 bg-[var(--surface-glass)] p-4 backdrop-blur-md md:p-6"
            >
              <Outlet />
            </motion.main>
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}

export default DashboardLayout
