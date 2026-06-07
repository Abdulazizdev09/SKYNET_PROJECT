import { useEffect } from 'react';
import { CircleMarker, MapContainer, Polyline, Popup, TileLayer, Tooltip, useMap } from 'react-leaflet';
import L from 'leaflet';
import type { LatLngExpression } from 'leaflet';
import type { Airport } from '../../types/airport';
import { formatDuration, formatNumber, greatCircle } from '../../utils/geo';

export interface RevealedPath {
  nodes: string[];
  distanceKm: number;
  priceUsd: number;
  durationMin: number;
  color: string;
  optimal: boolean;
}

interface Props {
  airports: Map<string, Airport>;
  paths: RevealedPath[];
  origin: string;
  dest: string;
  closedHub: string | null;
  onSelectAirport: (iata: string) => void;
}

/** Fit the view to origin/dest/hub — keyed on the scalar codes so panning/zooming
 *  is NOT reset on every render (only when the endpoints actually change). */
function FitBounds({
  airports,
  origin,
  dest,
  closedHub,
}: {
  airports: Map<string, Airport>;
  origin: string;
  dest: string;
  closedHub: string | null;
}) {
  const map = useMap();
  useEffect(() => {
    const pts: LatLngExpression[] = [];
    for (const code of [origin, dest, closedHub]) {
      if (!code) continue;
      const a = airports.get(code);
      if (a) pts.push([a.lat, a.lng]);
    }
    if (pts.length >= 2) map.fitBounds(L.latLngBounds(pts), { padding: [70, 70], maxZoom: 6 });
    else if (pts.length === 1) map.setView(pts[0], 4);
  }, [map, airports, origin, dest, closedHub]);
  return null;
}

export function RerouteMap({ airports, paths, origin, dest, closedHub, onSelectAirport }: Props) {
  function arcOf(nodes: string[]): [number, number][] {
    const pts: [number, number][] = [];
    for (let i = 0; i < nodes.length - 1; i++) {
      const a = airports.get(nodes[i]);
      const b = airports.get(nodes[i + 1]);
      if (!a || !b) continue;
      const seg = greatCircle([a.lat, a.lng], [b.lat, b.lng], 32);
      pts.push(...(i > 0 ? seg.slice(1) : seg));
    }
    return pts;
  }

  function colorOf(iata: string): string {
    if (iata === origin) return '#00C176';
    if (iata === dest) return '#FF6D00';
    if (iata === closedHub) return '#F5222D';
    return '#0C73FE';
  }

  function roleOf(iata: string): string | null {
    if (iata === origin) return 'Departure';
    if (iata === dest) return 'Destination';
    if (iata === closedHub) return 'Closed hub';
    return null;
  }

  // Draw non-optimal first so the green optimal arc sits on top.
  const ordered = [...paths].sort((a, b) => Number(a.optimal) - Number(b.optimal));

  return (
    <MapContainer
      center={[30, 30]}
      zoom={3}
      minZoom={2}
      scrollWheelZoom
      worldCopyJump
      className="h-full w-full"
      style={{ background: '#eaf1f9' }}
    >
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution="&copy; OpenStreetMap" />

      {ordered.map((p, idx) => (
        <Polyline
          key={`path-${p.nodes.join('-')}-${idx}`}
          positions={arcOf(p.nodes)}
          pathOptions={{
            color: p.color,
            weight: p.optimal ? 5 : 2.5,
            opacity: p.optimal ? 0.95 : 0.55,
            dashArray: p.optimal ? undefined : '6 6',
          }}
        >
          <Tooltip sticky>
            <div className="text-xs">
              <div className="font-bold text-ink-900">
                {p.nodes.join(' → ')} {p.optimal ? '· BEST' : ''}
              </div>
              <div className="text-ink-600">
                {p.nodes.length - 1} legs · {formatNumber(p.distanceKm)} km · {formatDuration(p.durationMin)} ·{' '}
                <span className="font-semibold text-orange">${formatNumber(p.priceUsd)}</span>
              </div>
            </div>
          </Tooltip>
        </Polyline>
      ))}

      {[...airports.values()].map((a) => {
        const role = roleOf(a.iata);
        const special = role !== null;
        return (
          <CircleMarker
            key={a.iata}
            center={[a.lat, a.lng]}
            radius={special ? 8 : 5}
            pathOptions={{
              color: '#fff',
              weight: special ? 2 : 1,
              fillColor: colorOf(a.iata),
              fillOpacity: special ? 1 : 0.6,
            }}
            eventHandlers={{ click: () => onSelectAirport(a.iata) }}
          >
            <Tooltip direction="top">
              <span className="font-semibold">{a.iata}</span> · {a.city}
              {role ? ` · ${role}` : ''}
            </Tooltip>
            <Popup>
              <div className="text-xs">
                <div className="text-sm font-bold text-ink-900">
                  {a.iata} {role && <span className="text-primary">· {role}</span>}
                </div>
                <div className="font-medium text-ink-900">{a.name}</div>
                <div className="text-ink-600">
                  {a.city}
                  {a.country ? `, ${a.country}` : ''}
                </div>
                <div className="mt-1 text-ink-400">
                  IATA {a.iata}
                  {a.icao ? ` · ICAO ${a.icao}` : ''}
                </div>
                <div className="mt-1 text-primary">Click marker to set as origin / destination</div>
              </div>
            </Popup>
          </CircleMarker>
        );
      })}

      <FitBounds airports={airports} origin={origin} dest={dest} closedHub={closedHub} />
    </MapContainer>
  );
}
