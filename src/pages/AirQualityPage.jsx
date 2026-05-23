import SectionHeader from '../components/ui/SectionHeader'

function AirQualityPage() {
  return (
    <section>
      <SectionHeader title="Air Quality Analytics" subtitle="AQI Module" />
      <div className="rounded-2xl border border-cyan-400/20 bg-slate-950/40 p-4 text-slate-300">
        AQI widgets and charts plug in here.
      </div>
    </section>
  )
}

export default AirQualityPage