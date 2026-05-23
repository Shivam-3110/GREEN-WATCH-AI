import SectionHeader from '../components/ui/SectionHeader'

function MapPage() {
  return (
    <section>
      <SectionHeader title="Map Intelligence" subtitle="Geo Module" />
      <div className="rounded-2xl border border-cyan-400/20 bg-slate-950/40 p-4 text-slate-300">
        Leaflet or Mapbox map modules can be mounted here.
      </div>
    </section>
  )
}

export default MapPage