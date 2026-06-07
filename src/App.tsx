import { lazy, Suspense, useCallback, useState } from 'react';
import type { ReactNode } from 'react';
import {
  BarChart2,
  Building2,
  Database,
  GitBranch,
  Globe,
  NotebookPen,
  Plane,
  Search as SearchIcon,
  Users,
} from 'lucide-react';
import { useClock } from './hooks/useClock';
import { useApiStatus } from './hooks/useApiStatus';
import { useDataSource } from './context/DataSourceContext';
import type { AircraftSource } from './hooks/useViewportAircraft';
import type { LiveSourceId, StaticSourceId } from './types/source';
import { formatNumber } from './utils/geo';
import { Skeleton } from './components/ui/Skeleton';

// Code-split pages so heavy deps (recharts, leaflet) load only when their page opens.
const FlightNetwork = lazy(() => import('./components/FlightNetwork/FlightNetwork').then((m) => ({ default: m.FlightNetwork })));
const CheckIn = lazy(() => import('./components/CheckIn/CheckIn').then((m) => ({ default: m.CheckIn })));
const Search = lazy(() => import('./components/Search/Search').then((m) => ({ default: m.Search })));
const Analytics = lazy(() => import('./components/Analytics/Analytics').then((m) => ({ default: m.Analytics })));
const Rerouting = lazy(() => import('./components/Rerouting/Rerouting').then((m) => ({ default: m.Rerouting })));
const Logbook = lazy(() => import('./components/Logbook/Logbook').then((m) => ({ default: m.Logbook })));
const AirlineDirectory = lazy(() => import('./components/Airlines/AirlineDirectory').then((m) => ({ default: m.AirlineDirectory })));
const AircraftDirectory = lazy(() => import('./components/Aircraft/AircraftDirectory').then((m) => ({ default: m.AircraftDirectory })));
const DataSourceManager = lazy(() => import('./components/Settings/DataSourceManager').then((m) => ({ default: m.DataSourceManager })));

type PageId =
  | 'network'
  | 'checkin'
  | 'search'
  | 'analytics'
  | 'rerouting'
  | 'logbook'
  | 'airlines'
  | 'aircraft'
  | 'sources';

interface NavItem {
  id: PageId;
  label: string;
  title: string;
  icon: ReactNode;
}

const NAV: NavItem[] = [
  { id: 'network', label: 'Flight Network', title: 'Flight Network', icon: <Globe size={18} /> },
  { id: 'checkin', label: 'Check-in', title: 'Check-in & Boarding', icon: <Users size={18} /> },
  { id: 'search', label: 'Search', title: 'Search & Retrieval', icon: <SearchIcon size={18} /> },
  { id: 'analytics', label: 'Analytics', title: 'Analytics & Sorting', icon: <BarChart2 size={18} /> },
  { id: 'rerouting', label: 'Rerouting', title: 'Contingency Rerouting', icon: <GitBranch size={18} /> },
  { id: 'logbook', label: 'Logbook', title: 'My Flight Logbook', icon: <NotebookPen size={18} /> },
  { id: 'airlines', label: 'Airlines', title: 'Airline Directory', icon: <Building2 size={18} /> },
  { id: 'aircraft', label: 'Aircraft', title: 'Aircraft Types', icon: <Plane size={18} /> },
  { id: 'sources', label: 'Data Sources', title: 'Data Sources', icon: <Database size={18} /> },
];

function staticLabel(s: StaticSourceId): string {
  return s === 'openflights' ? 'OpenFlights' : s === 'airlabs' ? 'AirLabs' : 'Local';
}
function liveLabel(s: LiveSourceId): string {
  return s === 'opensky' ? 'OpenSky' : s === 'airlabs' ? 'AirLabs' : 'Local';
}

function StatusDot({ state, onColor }: { state: boolean | null; onColor: string }) {
  const color = state === null ? 'bg-ink-300' : state ? onColor : 'bg-danger';
  return (
    <span className="relative flex h-2.5 w-2.5">
      {state !== false && (
        <span className={`absolute inline-flex h-full w-full animate-ping rounded-full ${color} opacity-60`} />
      )}
      <span className={`relative inline-flex h-2.5 w-2.5 rounded-full ${color}`} />
    </span>
  );
}

export default function App() {
  const [active, setActive] = useState<PageId>('network');
  const now = useClock();
  const status = useApiStatus();
  const ds = useDataSource();
  const [fleet, setFleet] = useState<{ count: number; source: AircraftSource }>({ count: 0, source: 'simulated' });
  const handleFleet = useCallback((count: number, source: AircraftSource) => setFleet({ count, source }), []);

  const utc = `${String(now.getUTCHours()).padStart(2, '0')}:${String(now.getUTCMinutes()).padStart(2, '0')}:${String(now.getUTCSeconds()).padStart(2, '0')} UTC`;
  const current = NAV.find((n) => n.id === active) ?? NAV[0];

  function renderPage(): ReactNode {
    switch (active) {
      case 'network':
        return <FlightNetwork onFleetUpdate={handleFleet} />;
      case 'checkin':
        return <CheckIn />;
      case 'search':
        return <Search />;
      case 'analytics':
        return <Analytics />;
      case 'rerouting':
        return <Rerouting />;
      case 'logbook':
        return <Logbook />;
      case 'airlines':
        return <AirlineDirectory />;
      case 'aircraft':
        return <AircraftDirectory />;
      case 'sources':
        return <DataSourceManager />;
    }
  }

  return (
    <div className="flex h-screen overflow-hidden bg-white text-ink-900">
      {/* ── Sidebar ──────────────────────────────────────────── */}
      <aside className="flex w-60 shrink-0 flex-col border-r border-ink-100 bg-white">
        <div className="flex items-center gap-2 px-5 py-4">
          <div className="flex h-9 w-9 items-center justify-center rounded-btn bg-primary text-white shadow-btn">
            <Plane size={20} />
          </div>
          <div>
            <div className="text-base font-extrabold tracking-tight text-ink-900">SkyNet</div>
            <div className="text-[10px] font-medium uppercase tracking-widest text-ink-400">Aviation Ops</div>
          </div>
        </div>

        <nav className="flex flex-1 flex-col gap-1 overflow-y-auto px-3 py-4">
          {NAV.map((item) => {
            const isActive = item.id === active;
            return (
              <button
                key={item.id}
                onClick={() => setActive(item.id)}
                className={`flex items-center gap-3 rounded-btn border-l-[3px] px-3 py-2.5 text-sm font-semibold transition-all duration-150 ${
                  isActive
                    ? 'border-primary bg-primary-light text-primary'
                    : 'border-transparent text-ink-600 hover:bg-ink-50 hover:text-ink-900'
                }`}
              >
                {item.icon}
                {item.label}
              </button>
            );
          })}
        </nav>

        <div className="border-t border-ink-100 px-5 py-4">
          <div className="mb-2 flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span
                className={`absolute inline-flex h-full w-full animate-ping rounded-full ${
                  fleet.source === 'live' ? 'bg-success' : 'bg-orange'
                } opacity-60`}
              />
              <span
                className={`relative inline-flex h-2 w-2 rounded-full ${
                  fleet.source === 'live' ? 'bg-success' : 'bg-orange'
                }`}
              />
            </span>
            <span className="text-sm font-bold text-ink-900">{formatNumber(fleet.count)}</span>
            <span className="text-xs text-ink-500">aircraft in view</span>
          </div>
          <div className="text-xs font-medium tabular-nums text-ink-400">{utc}</div>
        </div>
      </aside>

      {/* ── Main column ──────────────────────────────────────── */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-16 shrink-0 items-center justify-between border-b border-ink-100 bg-white px-6">
          <h1 className="text-xl font-bold text-ink-900">{current.title}</h1>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setActive('sources')}
              className="flex items-center gap-2 rounded-full bg-ink-50 px-3 py-1.5 text-xs font-semibold text-ink-700 transition-colors hover:bg-ink-100"
              title="Change data sources"
            >
              <Database size={13} className="text-primary" />
              {staticLabel(ds.staticSource)} · {liveLabel(ds.liveSource)}
            </button>
            <div className="flex items-center gap-2 text-xs font-medium text-ink-600">
              <StatusDot state={status.opensky} onColor="bg-success" />
              OpenSky {status.opensky === false ? 'offline' : status.opensky ? 'live' : '…'}
            </div>
            <div className="flex items-center gap-2 text-xs font-medium text-ink-600">
              <StatusDot state={status.airlabs} onColor="bg-primary" />
              AirLabs {status.airlabs === false ? 'offline' : status.airlabs ? 'connected' : '…'}
            </div>
          </div>
        </header>

        <main className="min-h-0 flex-1 bg-white">
          <div key={active} className="page-enter h-full">
            <Suspense fallback={<div className="p-6"><Skeleton className="h-full w-full" /></div>}>
              {renderPage()}
            </Suspense>
          </div>
        </main>
      </div>
    </div>
  );
}
