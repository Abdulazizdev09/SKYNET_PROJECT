import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { CircleMarker, MapContainer, Marker, Polyline, TileLayer, useMap } from 'react-leaflet';
import L from 'leaflet';
import type { LatLngBoundsExpression, LatLngExpression } from 'leaflet';
import { GitBranch, MapPin, Navigation, Plane, Route, X } from 'lucide-react';
import type { Airport } from '../../types/airport';
import { useViewportAircraft, type AircraftSource } from '../../hooks/useViewportAircraft';
import { useDataSource } from '../../context/DataSourceContext';
import { fetchAirportsByCountry } from '../../api/airlabs';
import { FALLBACK_AIRPORTS } from '../../data/airports';
import { ROUTE_PAIRS } from '../../data/routes';
import {
  CONTINENT_BOUNDS,
  CONTINENT_COUNTRIES,
  WORLD_BOUNDS,
  type ContinentId,
} from '../../data/continents';
import { buildFlightGraph, routeCost, routeDuration } from '../../utils/network';
import { formatDuration, formatNumber } from '../../utils/geo';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { AirportLayer, type AirportRole } from './AirportLayer';
import { AircraftLayer } from './AircraftLayer';
import { MapEvents } from './MapEvents';
import { ContinentFilter } from './ContinentFilter';

interface Props {
  onFleetUpdate?: (count: number, source: AircraftSource) => void;
}

/** Animate the map to a continent's bounds when the selection changes. */
function FlyTo({ continent }: { continent: ContinentId }) {
  const map = useMap();
  useEffect(() => {
    const bounds: LatLngBoundsExpression =
      continent === 'all' ? WORLD_BOUNDS : CONTINENT_BOUNDS[continent];
    map.flyToBounds(bounds, { duration: 0.8, maxZoom: 6 });
  }, [map, continent]);
  return null;
}

/** Fit the map to the selected route. */
function FitRoute({ points }: { points: LatLngExpression[] }) {
  const map = useMap();
  useEffect(() => {
    if (points.length >= 2) map.fitBounds(L.latLngBounds(points), { padding: [80, 80], maxZoom: 6 });
  }, [map, points]);
  return null;
}

/** Plane animated along the resolved route. */
function RoutePlane({ path }: { path: [number, number][] }) {
  const [pos, setPos] = useState<[number, number] | null>(path[0] ?? null);
  const [track, setTrack] = useState(0);
  useEffect(() => {
    if (path.length < 2) {
      setPos(path[0] ?? null);
      return;
    }
    let seg = 0;
    let t = 0;
    const id = setInterval(() => {
      t += 0.025;
      if (t >= 1) {
        t = 0;
        seg = (seg + 1) % (path.length - 1);
      }
      const a = path[seg];
      const b = path[seg + 1];
      setPos([a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]);
      setTrack((Math.atan2(b[1] - a[1], b[0] - a[0]) * 180) / Math.PI);
    }, 40);
    return () => clearInterval(id);
  }, [path]);
  if (!pos) return null;
  return (
    <Marker
      position={pos}
      zIndexOffset={1000}
      icon={L.divIcon({
        className: 'skynet-marker',
        iconSize: [22, 22],
        iconAnchor: [11, 11],
        html: `<div class="aircraft-icon" style="transform:rotate(${track}deg)"><svg width="22" height="22" viewBox="0 0 24 24" fill="#0C73FE"><path d="M12 2l1.4 7.4L21 13v2l-7.6-1.6L13 21l1.6 1.3v1L12 23l-2.6.3v-1L11 21l-.4-7.6L3 15v-2l7.6-3.6L12 2z"/></svg></div>`,
      })}
    />
  );
}

function dedupeByIata(list: Airport[]): Airport[] {
  const m = new Map<string, Airport>();
  for (const a of list) if (!m.has(a.iata)) m.set(a.iata, a);
  return [...m.values()];
}

export const FlightNetwork = memo(function FlightNetwork({ onFleetUpdate }: Props) {
  // Curated network drives routing (stable regardless of which markers show).
  const graph = useMemo(() => buildFlightGraph(FALLBACK_AIRPORTS, ROUTE_PAIRS), []);
  const coordMap = useMemo(() => {
    const m = new Map<string, Airport>();
    for (const a of FALLBACK_AIRPORTS) m.set(a.iata, a);
    return m;
  }, []);

  const { liveSource } = useDataSource();
  const aircraft = useViewportAircraft(onFleetUpdate, liveSource);

  // Continent / country airport filtering with per-country caching.
  const [continent, setContinent] = useState<ContinentId>('all');
  const [country, setCountry] = useState('all');
  const [showAll, setShowAll] = useState(false);
  const cacheRef = useRef<Map<string, Airport[]>>(new Map());
  const [rawAirports, setRawAirports] = useState<Airport[]>(FALLBACK_AIRPORTS);
  const [loadingAirports, setLoadingAirports] = useState(false);

  const loadAirports = useCallback(async (cont: ContinentId, ctry: string): Promise<void> => {
    if (cont === 'all') {
      setRawAirports(FALLBACK_AIRPORTS);
      return;
    }
    const codes = ctry === 'all' ? CONTINENT_COUNTRIES[cont] : [ctry];
    setLoadingAirports(true);
    const results = await Promise.all(
      codes.map(async (code) => {
        const cached = cacheRef.current.get(code);
        if (cached) return cached;
        const fetched = await fetchAirportsByCountry(code);
        cacheRef.current.set(code, fetched);
        return fetched;
      }),
    );
    setRawAirports(results.flat());
    setLoadingAirports(false);
  }, []);

  useEffect(() => {
    void loadAirports(continent, country);
  }, [continent, country, loadAirports]);

  const visibleAirports = useMemo(() => {
    const deduped = dedupeByIata(rawAirports);
    return showAll ? deduped : deduped.filter((a) => a.isMajor);
  }, [rawAirports, showAll]);

  // Route selection state.
  const [depIata, setDepIata] = useState<string | null>(null);
  const [destIata, setDestIata] = useState<string | null>(null);
  const [showMst, setShowMst] = useState(false);
  const [selectedAirport, setSelectedAirport] = useState<Airport | null>(null);

  const route = useMemo(() => {
    if (!depIata || !destIata) return null;
    const { path, distance } = graph.dijkstra(depIata, destIata);
    if (path.length === 0) return null;
    return {
      path,
      distanceKm: Math.round(distance),
      cost: routeCost(distance),
      durationMin: routeDuration(distance),
      stops: Math.max(0, path.length - 2),
    };
  }, [graph, depIata, destIata]);

  const mst = useMemo(() => (showMst ? graph.kruskal() : null), [graph, showMst]);

  const routePoints = useMemo<[number, number][]>(() => {
    if (!route) return [];
    return route.path
      .map((iata) => coordMap.get(iata))
      .filter((a): a is Airport => a !== undefined)
      .map((a) => [a.lat, a.lng]);
  }, [route, coordMap]);

  const roleOf = useCallback(
    (iata: string): AirportRole => {
      if (iata === depIata) return 'dep';
      if (iata === destIata) return 'dest';
      if (route && route.path.includes(iata)) return 'stop';
      return 'idle';
    },
    [depIata, destIata, route],
  );

  const onAirportSelect = useCallback(
    (a: Airport): void => {
      setSelectedAirport(a);
      if (!graph.hasNode(a.iata)) return;
      if (!depIata) {
        setDepIata(a.iata);
      } else if (!destIata && a.iata !== depIata) {
        setDestIata(a.iata);
      } else {
        setDepIata(a.iata);
        setDestIata(null);
      }
    },
    [graph, depIata, destIata],
  );

  const clearRoute = useCallback((): void => {
    setDepIata(null);
    setDestIata(null);
    setSelectedAirport(null);
  }, []);

  const onContinent = useCallback((c: ContinentId): void => {
    setContinent(c);
    setCountry('all');
  }, []);

  const highlightKey = `${depIata ?? ''}|${destIata ?? ''}|${route ? route.path.join('>') : ''}`;
  const routable = selectedAirport ? graph.hasNode(selectedAirport.iata) : false;

  return (
    <div className="relative h-full w-full">
      <MapContainer center={[24, 18]} zoom={3} minZoom={2} worldCopyJump className="h-full w-full" style={{ background: '#eaf1f9' }}>
        <TileLayer attribution="&copy; OpenStreetMap" url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

        {mst &&
          mst.edges.map((e, i) => {
            const a = coordMap.get(e.from);
            const b = coordMap.get(e.to);
            if (!a || !b) return null;
            return (
              <Polyline
                key={`mst-${i}`}
                positions={[[a.lat, a.lng], [b.lat, b.lng]]}
                pathOptions={{ color: '#9BA3B2', weight: 1.5, opacity: 0.7, dashArray: '4 6' }}
              />
            );
          })}

        {routePoints.length >= 2 && (
          <>
            <Polyline
              positions={routePoints}
              className="route-line"
              pathOptions={{ color: '#0C73FE', weight: 3, dashArray: '8 8', opacity: 0.9 }}
            />
            {routePoints.slice(1, -1).map((p, i) => (
              <CircleMarker key={`stop-${i}`} center={p} radius={5} pathOptions={{ color: '#fff', weight: 2, fillColor: '#0C73FE', fillOpacity: 1 }} />
            ))}
            <RoutePlane path={routePoints} />
            <FitRoute points={routePoints} />
          </>
        )}

        <AirportLayer airports={visibleAirports} roleOf={roleOf} onSelect={onAirportSelect} highlightKey={highlightKey} />
        <AircraftLayer aircraft={aircraft.data} />
        <MapEvents onViewport={aircraft.setViewport} />
        <FlyTo continent={continent} />
      </MapContainer>

      {/* Continent filter (top-left) */}
      <div className="pointer-events-none absolute left-4 top-4 z-[1000]">
        <ContinentFilter
          continent={continent}
          onContinentChange={onContinent}
          country={country}
          onCountryChange={setCountry}
          showAll={showAll}
          onShowAllChange={setShowAll}
          loading={loadingAirports}
          airportCount={visibleAirports.length}
        />
      </div>

      {/* Route planner (top-right) */}
      <div className="pointer-events-none absolute right-4 top-4 z-[1000] flex w-72 flex-col gap-3">
        <Card className="pointer-events-auto p-4">
          <div className="mb-3 flex items-center gap-2">
            <Route size={18} className="text-primary" />
            <h3 className="text-sm font-bold text-ink-900">Route Planner</h3>
          </div>
          <p className="mb-3 text-xs leading-relaxed text-ink-600">
            Click a hub to set <span className="font-semibold text-success">departure</span>, then another
            for <span className="font-semibold text-orange">destination</span>. Dijkstra finds the shortest path.
          </p>
          <div className="flex items-center gap-2 text-sm">
            <span className="flex-1 rounded-chip bg-ink-50 px-2 py-1.5 font-semibold text-ink-900">{depIata ?? '—'}</span>
            <Navigation size={14} className="text-ink-400" />
            <span className="flex-1 rounded-chip bg-ink-50 px-2 py-1.5 font-semibold text-ink-900">{destIata ?? '—'}</span>
            {(depIata || destIata) && (
              <button onClick={clearRoute} className="text-ink-400 hover:text-danger" aria-label="Clear">
                <X size={16} />
              </button>
            )}
          </div>
          <Button
            variant={showMst ? 'primary' : 'secondary'}
            icon={<GitBranch size={15} />}
            className="mt-3 w-full !py-2.5"
            onClick={() => setShowMst((v) => !v)}
          >
            {showMst ? 'Hide Backup Network' : 'Show Backup Network (MST)'}
          </Button>
          {mst && <p className="mt-2 text-center text-xs text-ink-400">MST: {mst.edges.length} links · {formatNumber(mst.totalWeight)} km</p>}
        </Card>

        {route && (
          <Card className="pointer-events-auto animate-fade-in p-4">
            <div className="mb-2 flex items-center gap-2">
              <Plane size={16} className="text-primary" />
              <h3 className="text-sm font-bold text-ink-900">{depIata} → {destIata}</h3>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Stat label="Distance" value={`${formatNumber(route.distanceKm)} km`} />
              <Stat label="Est. cost" value={`$${formatNumber(route.cost)}`} accent />
              <Stat label="Stops" value={route.stops === 0 ? 'Direct' : `${route.stops}`} />
              <Stat label="Flight time" value={formatDuration(route.durationMin)} />
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-1">
              {route.path.map((iata, i) => (
                <span key={iata} className="flex items-center gap-1">
                  <Badge tone={i === 0 ? 'green' : i === route.path.length - 1 ? 'orange' : 'blue'}>{iata}</Badge>
                  {i < route.path.length - 1 && <span className="text-ink-300">·</span>}
                </span>
              ))}
            </div>
          </Card>
        )}
      </div>

      {/* Live status (bottom-left) */}
      <div className="absolute bottom-6 left-4 z-[1000]">
        <Card className="flex items-center gap-3 px-4 py-2.5">
          <span className="relative flex h-2.5 w-2.5">
            <span className={`absolute inline-flex h-full w-full animate-ping rounded-full ${aircraft.source === 'live' ? 'bg-success' : 'bg-orange'} opacity-75`} />
            <span className={`relative inline-flex h-2.5 w-2.5 rounded-full ${aircraft.source === 'live' ? 'bg-success' : 'bg-orange'}`} />
          </span>
          <div className="text-xs">
            <div className="font-semibold text-ink-900">{formatNumber(aircraft.data.length)} aircraft in view</div>
            <div className="text-ink-400">{aircraft.source === 'live' ? 'OpenSky / AirLabs live' : 'Simulated fleet'} · viewport-scoped</div>
          </div>
        </Card>
      </div>

      {/* Selected airport (bottom-right) */}
      {selectedAirport && (
        <div className="absolute bottom-6 right-4 z-[1000] w-64">
          <Card className="animate-fade-in p-4">
            <div className="mb-1 flex items-start justify-between">
              <div className="flex items-center gap-2">
                <MapPin size={16} className="text-primary" />
                <span className="text-lg font-bold text-ink-900">{selectedAirport.iata}</span>
              </div>
              <button onClick={() => setSelectedAirport(null)} className="text-ink-400 hover:text-ink-900" aria-label="Close">
                <X size={16} />
              </button>
            </div>
            <p className="text-sm font-medium text-ink-900">{selectedAirport.name}</p>
            <p className="text-xs text-ink-600">
              {selectedAirport.city}
              {selectedAirport.country ? `, ${selectedAirport.country}` : ''}
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              <Badge tone="blue">IATA {selectedAirport.iata}</Badge>
              {selectedAirport.icao && <Badge tone="gray">ICAO {selectedAirport.icao}</Badge>}
              {!routable && <Badge tone="gray">info only</Badge>}
            </div>
          </Card>
        </div>
      )}
    </div>
  );
});

function Stat({ label, value, accent = false }: { label: string; value: string; accent?: boolean }) {
  return (
    <div>
      <div className="text-[10px] font-medium uppercase tracking-wide text-ink-400">{label}</div>
      <div className={`text-sm font-bold ${accent ? 'text-orange' : 'text-ink-900'}`}>{value}</div>
    </div>
  );
}
