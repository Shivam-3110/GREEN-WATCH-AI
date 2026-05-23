import { motion } from 'framer-motion'
import SectionHeader from '../components/ui/SectionHeader'

const cards = [
  { title: 'Realtime AQI', value: '72', delta: '+4.3%' },
  { title: 'Active Sensors', value: '1,264', delta: '+2.1%' },
  { title: 'Predictions Today', value: '218', delta: '+9.2%' },
]

function DashboardPage() {
  return (
    <section>
      <SectionHeader title="Environmental Intelligence" subtitle="Control Center" />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {cards.map((card, idx) => (
          <motion.article
            key={card.title}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.08 }}
            className="rounded-2xl border border-cyan-400/20 bg-slate-950/50 p-4"
          >
            <p className="text-sm text-slate-300">{card.title}</p>
            <p className="mt-2 text-3xl font-semibold text-cyan-50">{card.value}</p>
            <p className="mt-1 text-sm text-emerald-300">{card.delta}</p>
          </motion.article>
        ))}
      </div>
    </section>
  )
}

export default DashboardPage