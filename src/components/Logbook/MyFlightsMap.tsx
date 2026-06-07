import { useEffect, useMemo } from 'react';
import { CircleMarker, MapContainer, Polyline, TileLayer, Tooltip, useMap } from 'react-leaflet';
import L from 'leaflet';
import type { LatLngExpression } from 'leaflet';
import { greatCircle } from '../../utils/geo';
import type { LoggedFlight } from '../../types/logbook';
import type { Airport } from '../../types/airport';

interface Props {
  flights: LoggedFlight[];
  airports: Map<string, Airport>;
}

interface VisitedPoint {
  iata: string;
  city: string;
  lat: number;
  lng: number;
}

function FitVisited({ points }: { points: VisitedPoint[] }) {
  const map = useMap();
  useEffect(() => {
    if (points.length === 0) return;
    if (points.length === 1) {
      const only = points[0];
      map.setView([only.lat, only.lng], 5);
      return;
    }
    const latlngs: LatLngExpression[] = points.map((p): LatLngExpression => [p.lat, p.lng]);
    map.fitBounds(L.latLngBounds(latlngs), { padding: [40, 40], maxZoom: 6 });
  }, [map, points]);
  return null;
}

export function MyFlightsMap({ flights, airports }: Props) {
  const { routes, points } = useMemo(() => {
    const visited = new Map<string, VisitedPoint>();
    const list: { id: string; positions: [number, number][] }[] = [];
    for (const flight of flights) {
      const from = airports.get(flight.fromIata);
      const to = airports.get(flight.toIata);
      if (!from || !to) continue;
      list.push({ id: flight.id, positions: greatCircle([from.lat, from.lng], [to.lat, to.lng]) });
      if (!visited.has(from.iata)) {
        visited.set(from.iata, { iata: from.iata, city: from.city, lat: from.lat, lng: from.lng });
      }
      if (!visited.has(to.iata)) {
        visited.set(to.iata, { iata: to.iata, city: to.city, lat: to.lat, lng: to.lng });
      }
    }
    return { routes: list, points: [...visited.values()] };
  }, [flights, airports]);

  if (flights.length === 0 || points.length === 0) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-ink-400">
        No flights logged yet — add some to see your map.
      </div>
    );
  }

  return (
    <MapContainer center={[20, 0]} zoom={2} minZoom={2} className="h-full w-full" worldCopyJump>
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution="&copy; OpenStreetMap" />

      {routes.map((r) => (
        <Polyline
          key={r.id}
          positions={r.positions}
          pathOptions={{ color: '#0C73FE', weight: 1.5, opacity: 0.55 }}
        />
      ))}

      {points.map((p) => (
        <CircleMarker
          key={p.iata}
          center={[p.lat, p.lng]}
          radius={4}
          pathOptions={{ color: '#fff', weight: 1, fillColor: '#FF6D00', fillOpacity: 0.9 }}
        >
          <Tooltip direction="top">
            <span className="font-semibold">{p.iata}</span>
            {` · ${p.city}`}
          </Tooltip>
        </CircleMarker>
      ))}

      <FitVisited points={points} />
    </MapContainer>
  );
}
