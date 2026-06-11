import { motion } from 'framer-motion'

function AuthShell({ children, eyebrow, title, subtitle }) {
  return (
    <main className="relative min-h-screen overflow-hidden bg-[#030806] text-cyan-50">
      <div className="absolute inset-0 bg-[linear-gradient(rgba(34,211,238,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(16,185,129,0.08)_1px,transparent_1px)] bg-[size:42px_42px]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_-10%,rgba(45,212,191,0.22),transparent_34%),linear-gradient(135deg,rgba(4,120,87,0.32),transparent_44%),linear-gradient(315deg,rgba(202,138,4,0.12),transparent_38%)]" />

      <section className="relative z-10 mx-auto grid min-h-screen w-full max-w-6xl items-center gap-8 px-4 py-8 lg:grid-cols-[1fr_440px] lg:px-6">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="max-w-2xl"
        >
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-emerald-300">{eyebrow}</p>
          <h1 className="mt-4 max-w-xl text-4xl font-semibold leading-tight text-white sm:text-5xl">
            {title}
          </h1>
          <p className="mt-4 max-w-lg text-sm leading-6 text-slate-300 sm:text-base">{subtitle}</p>

          <div className="mt-8 grid max-w-xl gap-3 sm:grid-cols-3">
            {['AQI Watch', 'Carbon Score', 'Eco Alerts'].map((item) => (
              <div key={item} className="rounded-lg border border-emerald-300/20 bg-black/24 px-3 py-3 backdrop-blur">
                <span className="block h-1 w-8 rounded-full bg-emerald-300" />
                <p className="mt-3 text-sm text-slate-200">{item}</p>
              </div>
            ))}
          </div>
        </motion.div>

        {children}
      </section>
    </main>
  )
}

export default AuthShell
