import { Circle, MapContainer, Marker, Popup, TileLayer } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { aqiStations, heatZones, pollutionZones } from '../../data/aqiMapData'

const zoneStyles = {
  critical: { color: '#fb7185', fillColor: '#fb7185' },
  warning: { color: '#facc15', fillColor: '#facc15' },
  stable: { color: '#34d399', fillColor: '#34d399' },
}

const getAqiColor = (aqi) => {
  if (aqi <= 50) return '#34d399'
  if (aqi <= 100) return '#a3e635'
  if (aqi <= 150) return '#facc15'
  if (aqi <= 200) return '#fb7185'
  return '#e879f9'
}

const createAqiIcon = (station) =>
  L.divIcon({
    className: '',
    html: `
      <div class="aqi-marker" style="--aqi-color:${getAqiColor(station.aqi)}">
        <span class="aqi-marker__pulse"></span>
        <span class="aqi-marker__core">${station.aqi}</span>
      </div>
    `,
    iconSize: [48, 48],
    iconAnchor: [24, 24],
    popupAnchor: [0, -18],
  })

function EnvironmentalHeatmap({
  stations = aqiStations,
  zones = pollutionZones,
  heat = heatZones,
  center = [28.55, 77.24],
  zoom = 10,
}) {
  return (
    <div className="overflow-hidden rounded-lg border border-cyan-300/20 bg-black/30 shadow-[0_24px_80px_rgba(0,0,0,0.35)]">
      <MapContainer center={center} zoom={zoom} scrollWheelZoom className="h-[520px] min-h-[420px] w-full">
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          className="dark-map-tiles"
        />

        {heat.map((zone) => (
          <Circle
            key={zone.id}
            center={zone.center}
            radius={zone.radius}
            pathOptions={{
              color: '#22d3ee',
              fillColor: '#22d3ee',
              fillOpacity: zone.intensity * 0.16,
              opacity: 0.08,
              weight: 1,
            }}
          />
        ))}

        {zones.map((zone) => {
          const style = zoneStyles[zone.severity]

          return (
            <Circle
              key={zone.id}
              center={zone.center}
              radius={zone.radius}
              pathOptions={{
                color: style.color,
                fillColor: style.fillColor,
                fillOpacity: 0.13,
                opacity: 0.55,
                weight: 2,
              }}
            >
              <Popup>
                <div className="space-y-1">
                  <strong>{zone.name}</strong>
                  <p>AQI: {zone.aqi}</p>
                  <p>Severity: {zone.severity}</p>
                </div>
              </Popup>
            </Circle>
          )
        })}

        {stations.map((station) => (
          <Marker key={station.id} position={station.position} icon={createAqiIcon(station)}>
            <Popup>
              <div className="min-w-44 space-y-1">
                <strong>{station.name}</strong>
                <p>{station.city}</p>
                <p>AQI: {station.aqi}</p>
                <p>PM2.5: {station.pm25} ug/m3</p>
                <p>PM10: {station.pm10} ug/m3</p>
                <p>Status: {station.status}</p>
                <p>Updated: {station.updatedAt}</p>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  )
}

export default EnvironmentalHeatmap
