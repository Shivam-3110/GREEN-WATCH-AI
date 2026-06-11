import SectionHeader from '../components/ui/SectionHeader'
import EnvironmentalHeatmap from '../components/map/EnvironmentalHeatmap'
import { aqiStations } from '../data/aqiMapData'

function MapPage() {
  return (
    <section className="space-y-5">
      <SectionHeader title="Map Intelligence" subtitle="Geo Module" />

      <div className="grid gap-4 lg:grid-cols-[1fr_280px]">
        <EnvironmentalHeatmap />

        <aside className="space-y-4">
          <div className="rounded-lg border border-cyan-300/20 bg-white/[0.055] p-4 backdrop-blur-xl">
            <p className="text-xs uppercase tracking-[0.18em] text-emerald-300">Realtime AQI Nodes</p>
            <p className="mt-2 text-3xl font-semibold text-white">{aqiStations.length}</p>
            <p className="mt-2 text-sm leading-6 text-slate-300">
              Animated sensor markers with pollution zones and heat overlays.
            </p>
          </div>

          <div className="rounded-lg border border-cyan-300/20 bg-white/[0.055] p-4 backdrop-blur-xl">
            <p className="text-sm font-semibold text-cyan-50">Map Legend</p>
            <div className="mt-4 space-y-3 text-sm text-slate-300">
              <div className="flex items-center gap-3">
                <span className="h-3 w-3 rounded-full bg-emerald-300" />
                Healthy to moderate AQI
              </div>
              <div className="flex items-center gap-3">
                <span className="h-3 w-3 rounded-full bg-yellow-300" />
                Sensitive pollution zone
              </div>
              <div className="flex items-center gap-3">
                <span className="h-3 w-3 rounded-full bg-rose-400" />
                Unhealthy hotspot
              </div>
              <div className="flex items-center gap-3">
                <span className="h-3 w-3 rounded-full bg-cyan-300 opacity-60" />
                Heat intensity overlay
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-cyan-300/20 bg-white/[0.055] p-4 backdrop-blur-xl">
            <p className="text-sm font-semibold text-cyan-50">Highest AQI</p>
            <p className="mt-3 text-2xl font-semibold text-rose-300">192</p>
            <p className="mt-1 text-sm text-slate-400">Faridabad Industrial Edge</p>
          </div>
        </aside>
      </div>
    </section>
  )
}

export default MapPage
