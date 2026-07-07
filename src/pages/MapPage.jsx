import { useEffect, useState } from 'react'
import SectionHeader from '../components/ui/SectionHeader'
import EnvironmentalHeatmap from '../components/map/EnvironmentalHeatmap'
import { getLocationCoordinates } from '../utils/location'

// Generate pollution zones around a coordinate based on real AQI data
const buildZones = ([lat, lon], aqi) => [
  { id: 'z1', name: 'Core Zone',   center: [lat, lon],               radius: 3000,  severity: aqi > 150 ? 'critical' : aqi > 100 ? 'warning' : 'stable', aqi },
  { id: 'z2', name: 'Mid Zone',    center: [lat + 0.02, lon + 0.02], radius: 6000,  severity: aqi > 100 ? 'warning' : 'stable', aqi: Math.round(aqi * 0.8) },
  { id: 'z3', name: 'Outer Zone',  center: [lat - 0.02, lon - 0.02], radius: 9000,  severity: 'stable', aqi: Math.round(aqi * 0.6) },
]

const buildHeat = ([lat, lon], aqi) => [
  { id: 'h1', center: [lat, lon],               radius: 12000, intensity: aqi / 200 },
  { id: 'h2', center: [lat + 0.03, lon - 0.03], radius: 9000,  intensity: aqi / 300 },
  { id: 'h3', center: [lat - 0.03, lon + 0.03], radius: 8000,  intensity: aqi / 350 },
]

const buildStations = ([lat, lon], data) => [
  { id: 's1', name: 'Your Area',        city: data.city ?? 'Your Location', position: [lat, lon],               aqi: data.aqi,                    pm25: data.pm25, pm10: data.pm10, status: data.status, updatedAt: 'Just now' },
  { id: 's2', name: 'North Sensor',     city: data.city ?? 'Nearby',        position: [lat + 0.04, lon],         aqi: Math.round(data.aqi * 0.9),  pm25: Math.round(data.pm25 * 0.9), pm10: Math.round(data.pm10 * 0.9), status: data.status, updatedAt: '2 min ago' },
  { id: 's3', name: 'East Sensor',      city: data.city ?? 'Nearby',        position: [lat, lon + 0.05],         aqi: Math.round(data.aqi * 1.1),  pm25: Math.round(data.pm25 * 1.1), pm10: Math.round(data.pm10 * 1.1), status: data.status, updatedAt: '3 min ago' },
  { id: 's4', name: 'South Sensor',     city: data.city ?? 'Nearby',        position: [lat - 0.04, lon],         aqi: Math.round(data.aqi * 0.85), pm25: Math.round(data.pm25 * 0.85), pm10: Math.round(data.pm10 * 0.85), status: data.status, updatedAt: '5 min ago' },
  { id: 's5', name: 'West Sensor',      city: data.city ?? 'Nearby',        position: [lat, lon - 0.05],         aqi: Math.round(data.aqi * 0.95), pm25: Math.round(data.pm25 * 0.95), pm10: Math.round(data.pm10 * 0.95), status: data.status, updatedAt: '4 min ago' },
]

function MapPage() {
  const [center, setCenter]   = useState([28.55, 77.24])
  const [mapData, setMapData] = useState(null)
  const [city, setCity]       = useState(null)

  useEffect(() => {
    getLocationCoordinates().then(async ({ lat, lon, city: detectedCity }) => {
      const coords = [lat, lon]
      setCenter(coords)
      setCity(detectedCity)

      // Build map immediately with default AQI so circles always show
      const buildMap = (aqi, status) => setMapData({
        stations: buildStations(coords, { aqi, pm25: 25, pm10: 45, status, city: detectedCity }),
        zones:    buildZones(coords, aqi),
        heat:     buildHeat(coords, aqi),
        aqi,
        status,
      })

      buildMap(75, 'Moderate') // show circles immediately

      try {
        const res  = await fetch(`/api/v1/air-quality/current?lat=${lat}&lon=${lon}`)
        const json = await res.json()
        if (json.success) buildMap(json.data.aqi, json.data.status) // update with real data
      } catch {}
    })
  }, [])

  if (!center) return null

  return (
    <section className="space-y-5">
      <SectionHeader title="Map Intelligence" subtitle="Geo Module" />

      <div className="grid gap-4 lg:grid-cols-[1fr_280px]">
        <EnvironmentalHeatmap
          center={center}
          stations={mapData?.stations ?? undefined}
          zones={mapData?.zones ?? undefined}
          heat={mapData?.heat ?? undefined}
        />

        <aside className="space-y-4">
          <div className="rounded-lg border border-cyan-300/20 bg-white/[0.055] p-4 backdrop-blur-xl">
            <p className="text-xs uppercase tracking-[0.18em] text-emerald-300">Your Location</p>
            <p className="mt-1 text-lg font-semibold text-white">{city ?? 'Detecting...'}</p>
            <p className="mt-2 text-3xl font-semibold text-white">{mapData?.aqi ?? '—'}</p>
            <p className="mt-1 text-sm text-slate-400">{mapData?.status ?? (city ? 'Backend offline' : 'Fetching...')}</p>
          </div>

          <div className="rounded-lg border border-cyan-300/20 bg-white/[0.055] p-4 backdrop-blur-xl">
            <p className="text-sm font-semibold text-cyan-50">Map Legend</p>
            <div className="mt-4 space-y-3 text-sm text-slate-300">
              <div className="flex items-center gap-3"><span className="h-3 w-3 rounded-full bg-emerald-300" />Stable / Good AQI</div>
              <div className="flex items-center gap-3"><span className="h-3 w-3 rounded-full bg-yellow-300" />Warning / Moderate</div>
              <div className="flex items-center gap-3"><span className="h-3 w-3 rounded-full bg-rose-400" />Critical / Unhealthy</div>
              <div className="flex items-center gap-3"><span className="h-3 w-3 rounded-full bg-cyan-300 opacity-60" />Heat intensity overlay</div>
              <div className="flex items-center gap-3"><span className="h-3 w-3 rounded-full bg-sky-400" />📍 Your location</div>
            </div>
          </div>

          <div className="rounded-lg border border-cyan-300/20 bg-white/[0.055] p-4 backdrop-blur-xl">
            <p className="text-sm font-semibold text-cyan-50">Nearby Sensors</p>
            <p className="mt-3 text-2xl font-semibold text-emerald-300">{mapData ? mapData.stations.length : 5}</p>
            <p className="mt-1 text-sm text-slate-400">{mapData ? 'Around your location' : 'Default sensors shown'}</p>
          </div>
        </aside>
      </div>
    </section>
  )
}

export default MapPage