import { useCallback, useMemo, useRef, useState } from 'react';
import type { ChangeEvent, ReactNode } from 'react';
import {
  ArrowRight,
  BarChart2,
  Download,
  ListPlus,
  Map as MapIcon,
  Plus,
  Sparkles,
  Trash2,
  Upload,
} from 'lucide-react';
import type { Airline } from '../../types/airline';
import type { Airport } from '../../types/airport';
import type { LoggedFlight, TravelMode, TripReason } from '../../types/logbook';
import type { SeatClass } from '../../types/passenger';
import { useLogbook } from '../../hooks/useLogbook';
import { useAirlinesData, useAirportsData, usePlanesData } from '../../hooks/useStaticData';
import { formatNumber, haversineKm } from '../../utils/geo';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { Skeleton } from '../ui/Skeleton';
import { MyFlightsMap } from './MyFlightsMap';
import { TripStats } from './TripStats';

type Tab = 'log' | 'map' | 'stats';

interface FormState {
  fromIata: string;
  toIata: string;
  date: string;
  airlineIata: string;
  aircraft: string;
  seatClass: SeatClass | '';
  reason: TripReason;
  mode: TravelMode;
  flightNo: string;
  notes: string;
}

const EMPTY_FORM: FormState = {
  fromIata: '',
  toIata: '',
  date: '',
  airlineIata: '',
  aircraft: '',
  seatClass: '',
  reason: 'leisure',
  mode: 'flight',
  flightNo: '',
  notes: '',
};

const SAMPLE_ROUTES: [string, string, string, string][] = [
  ['TAS', 'IST', 'TK', '2025-03-04'],
  ['IST', 'LHR', 'TK', '2025-03-05'],
  ['LHR', 'JFK', 'BA', '2025-06-12'],
  ['JFK', 'LAX', 'AA', '2025-06-20'],
  ['DXB', 'SIN', 'EK', '2025-09-02'],
  ['SIN', 'SYD', 'SQ', '2025-09-10'],
];

function csvEscape(v: string): string {
  return /[",\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v;
}

function download(filename: string, text: string, type: string): void {
  const blob = new Blob([text], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function Logbook() {
  const { flights, add, remove, clear, importFlights } = useLogbook();
  const airportsRes = useAirportsData();
  const airlinesRes = useAirlinesData();
  const planesRes = usePlanesData();

  const airportsMap = useMemo(() => {
    const m = new Map<string, Airport>();
    for (const a of airportsRes.data) m.set(a.iata, a);
    return m;
  }, [airportsRes.data]);

  const airlinesMap = useMemo(() => {
    const m = new Map<string, Airline>();
    for (const a of airlinesRes.data) if (a.iata) m.set(a.iata, a);
    return m;
  }, [airlinesRes.data]);

  const [tab, setTab] = useState<Tab>('log');
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [formError, setFormError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  // Filters
  const [fYear, setFYear] = useState('all');
  const [fClass, setFClass] = useState('all');
  const [fReason, setFReason] = useState('all');
  const [fQuery, setFQuery] = useState('');

  const set = useCallback((patch: Partial<FormState>) => setForm((f) => ({ ...f, ...patch })), []);

  const distanceFor = useCallback(
    (from: string, to: string): number => {
      const a = airportsMap.get(from);
      const b = airportsMap.get(to);
      if (!a || !b) return 0;
      return Math.round(haversineKm(a.lat, a.lng, b.lat, b.lng));
    },
    [airportsMap],
  );

  const submit = useCallback(() => {
    const from = form.fromIata.trim().toUpperCase();
    const to = form.toIata.trim().toUpperCase();
    if (!from || !to) {
      setFormError('Enter both airports (IATA codes).');
      return;
    }
    if (!airportsMap.has(from) || !airportsMap.has(to)) {
      setFormError('Unknown airport code for the current data source.');
      return;
    }
    setFormError(null);
    add({
      fromIata: from,
      toIata: to,
      date: form.date || new Date().toISOString().slice(0, 10),
      airlineIata: form.airlineIata.trim().toUpperCase() || null,
      aircraft: form.aircraft || null,
      seatClass: form.seatClass,
      reason: form.reason,
      mode: form.mode,
      flightNo: form.flightNo.trim(),
      distanceKm: distanceFor(from, to),
      notes: form.notes.trim(),
    });
    setForm((f) => ({ ...EMPTY_FORM, reason: f.reason, mode: f.mode }));
  }, [form, airportsMap, add, distanceFor]);

  const loadSamples = useCallback(() => {
    for (const [from, to, airline, date] of SAMPLE_ROUTES) {
      if (!airportsMap.has(from) || !airportsMap.has(to)) continue;
      add({
        fromIata: from,
        toIata: to,
        date,
        airlineIata: airline,
        aircraft: null,
        seatClass: 'economy',
        reason: 'leisure',
        mode: 'flight',
        flightNo: '',
        distanceKm: distanceFor(from, to),
        notes: '',
      });
    }
  }, [airportsMap, add, distanceFor]);

  const exportJson = useCallback(() => {
    download('skynet-logbook.json', JSON.stringify(flights, null, 2), 'application/json');
  }, [flights]);

  const exportCsv = useCallback(() => {
    const head = ['from', 'to', 'date', 'airline', 'aircraft', 'class', 'reason', 'mode', 'flightNo', 'distanceKm', 'notes'];
    const rows = flights.map((f) =>
      [f.fromIata, f.toIata, f.date, f.airlineIata ?? '', f.aircraft ?? '', f.seatClass, f.reason, f.mode, f.flightNo, String(f.distanceKm), csvEscape(f.notes)].join(','),
    );
    download('skynet-logbook.csv', [head.join(','), ...rows].join('\n'), 'text/csv');
  }, [flights]);

  const onImportFile = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        try {
          const parsed = JSON.parse(String(reader.result)) as LoggedFlight[];
          if (Array.isArray(parsed)) importFlights(parsed);
        } catch {
          // ignore malformed import
        }
      };
      reader.readAsText(file);
      e.target.value = '';
    },
    [importFlights],
  );

  const years = useMemo(() => {
    const s = new Set<string>();
    for (const f of flights) s.add(f.date.slice(0, 4));
    return [...s].sort().reverse();
  }, [flights]);

  const filtered = useMemo(() => {
    const q = fQuery.trim().toLowerCase();
    return flights.filter((f) => {
      if (fYear !== 'all' && f.date.slice(0, 4) !== fYear) return false;
      if (fClass !== 'all' && f.seatClass !== fClass) return false;
      if (fReason !== 'all' && f.reason !== fReason) return false;
      if (q && !`${f.fromIata} ${f.toIata} ${f.airlineIata ?? ''} ${f.flightNo} ${f.notes}`.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [flights, fYear, fClass, fReason, fQuery]);

  const loading = airportsRes.loading;

  const TABS: { id: Tab; label: string; icon: ReactNode }[] = [
    { id: 'log', label: 'Log', icon: <ListPlus size={15} /> },
    { id: 'map', label: 'Map', icon: <MapIcon size={15} /> },
    { id: 'stats', label: 'Stats', icon: <BarChart2 size={15} /> },
  ];

  return (
    <div className="page-enter h-full overflow-auto p-6">
      {/* Header + tabs + import/export */}
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-1.5">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition-all duration-150 ${
                tab === t.id ? 'bg-primary text-white shadow-btn' : 'bg-ink-50 text-ink-600 hover:bg-ink-100'
              }`}
            >
              {t.icon}
              {t.label}
            </button>
          ))}
          <Badge tone="blue" className="ml-1 self-center">
            {flights.length} flights
          </Badge>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="ghost" icon={<Download size={14} />} className="!py-2" onClick={exportJson}>
            JSON
          </Button>
          <Button variant="ghost" icon={<Download size={14} />} className="!py-2" onClick={exportCsv}>
            CSV
          </Button>
          <Button variant="ghost" icon={<Upload size={14} />} className="!py-2" onClick={() => fileRef.current?.click()}>
            Import
          </Button>
          <input ref={fileRef} type="file" accept="application/json,.json" className="hidden" onChange={onImportFile} />
          {flights.length > 0 && (
            <Button variant="ghost" icon={<Trash2 size={14} />} className="!py-2 !text-danger" onClick={clear}>
              Clear
            </Button>
          )}
        </div>
      </div>

      {loading && <Skeleton className="mb-4 h-24 w-full" />}

      {tab === 'log' && (
        <div className="flex flex-col gap-5">
          {/* Add flight form */}
          <Card className="p-5">
            <div className="mb-4 flex items-center gap-2">
              <Plus size={18} className="text-primary" />
              <h3 className="text-sm font-bold text-ink-900">Log a flight</h3>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              <FromTo label="From (IATA)" value={form.fromIata} onChange={(v) => set({ fromIata: v })} resolved={airportsMap.get(form.fromIata.trim().toUpperCase())} />
              <FromTo label="To (IATA)" value={form.toIata} onChange={(v) => set({ toIata: v })} resolved={airportsMap.get(form.toIata.trim().toUpperCase())} />
              <Input label="Date" type="date" value={form.date} onChange={(e) => set({ date: e.target.value })} />
              <Input label="Airline (IATA)" placeholder="TK" value={form.airlineIata} onChange={(e) => set({ airlineIata: e.target.value })} />
              <Select label="Aircraft" value={form.aircraft} onChange={(e) => set({ aircraft: e.target.value })}>
                <option value="">—</option>
                {planesRes.data.slice(0, 200).map((p) => (
                  <option key={`${p.name}-${p.icao ?? p.iata ?? ''}`} value={p.name}>
                    {p.name}
                  </option>
                ))}
              </Select>
              <Select label="Class" value={form.seatClass} onChange={(e) => set({ seatClass: e.target.value as SeatClass | '' })}>
                <option value="">—</option>
                <option value="economy">Economy</option>
                <option value="business">Business</option>
                <option value="first">First</option>
              </Select>
              <Select label="Reason" value={form.reason} onChange={(e) => set({ reason: e.target.value as TripReason })}>
                <option value="leisure">Leisure</option>
                <option value="work">Work</option>
                <option value="crew">Crew</option>
                <option value="other">Other</option>
              </Select>
              <Select label="Mode" value={form.mode} onChange={(e) => set({ mode: e.target.value as TravelMode })}>
                <option value="flight">Flight</option>
                <option value="train">Train</option>
                <option value="road">Road</option>
                <option value="ship">Ship</option>
              </Select>
              <Input label="Flight no." placeholder="TK712" value={form.flightNo} onChange={(e) => set({ flightNo: e.target.value })} />
              <Input label="Notes" placeholder="Window seat…" value={form.notes} onChange={(e) => set({ notes: e.target.value })} className="sm:col-span-2" />
            </div>
            {formError && <p className="mt-2 text-xs text-danger">{formError}</p>}
            <div className="mt-4 flex flex-wrap gap-2">
              <Button icon={<Plus size={16} />} onClick={submit}>
                Add flight
              </Button>
              {flights.length === 0 && (
                <Button variant="secondary" icon={<Sparkles size={15} />} onClick={loadSamples}>
                  Load sample trips
                </Button>
              )}
            </div>
          </Card>

          {/* Filters + list */}
          <Card className="p-5">
            <div className="mb-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
              <Select label="Year" value={fYear} onChange={(e) => setFYear(e.target.value)}>
                <option value="all">All years</option>
                {years.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </Select>
              <Select label="Class" value={fClass} onChange={(e) => setFClass(e.target.value)}>
                <option value="all">All classes</option>
                <option value="economy">Economy</option>
                <option value="business">Business</option>
                <option value="first">First</option>
              </Select>
              <Select label="Reason" value={fReason} onChange={(e) => setFReason(e.target.value)}>
                <option value="all">All reasons</option>
                <option value="leisure">Leisure</option>
                <option value="work">Work</option>
                <option value="crew">Crew</option>
                <option value="other">Other</option>
              </Select>
              <Input label="Search" placeholder="code, flight, note" value={fQuery} onChange={(e) => setFQuery(e.target.value)} />
            </div>

            {filtered.length === 0 ? (
              <div className="rounded-card bg-ink-50 px-4 py-10 text-center text-sm text-ink-400">
                No flights{flights.length ? ' match the filters' : ' logged yet'}.
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                {filtered.map((f) => (
                  <div key={f.id} className="flex items-center gap-3 rounded-card border border-ink-100 p-3 hover:bg-ink-50">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 text-sm font-bold text-ink-900">
                        {f.fromIata}
                        <ArrowRight size={12} className="text-ink-300" />
                        {f.toIata}
                        {f.airlineIata && <span className="text-xs font-normal text-ink-600">{f.airlineIata}{f.flightNo ? ` ${f.flightNo}` : ''}</span>}
                      </div>
                      <div className="flex flex-wrap items-center gap-2 text-xs text-ink-500">
                        <span>{f.date}</span>
                        {f.seatClass && <Badge tone="blue">{f.seatClass}</Badge>}
                        <Badge tone="gray">{f.reason}</Badge>
                        {f.aircraft && <span className="text-ink-400">{f.aircraft}</span>}
                      </div>
                    </div>
                    <span className="text-sm font-bold text-orange">{formatNumber(f.distanceKm)} km</span>
                    <button onClick={() => remove(f.id)} className="text-ink-400 hover:text-danger" aria-label="Delete">
                      <Trash2 size={15} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      )}

      {tab === 'map' && (
        <Card className="overflow-hidden p-0">
          <div className="h-[68vh] w-full">
            <MyFlightsMap flights={flights} airports={airportsMap} />
          </div>
        </Card>
      )}

      {tab === 'stats' && <TripStats flights={flights} airports={airportsMap} airlines={airlinesMap} />}
    </div>
  );
}

function FromTo({
  label,
  value,
  onChange,
  resolved,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  resolved: Airport | undefined;
}) {
  return (
    <div>
      <Input label={label} placeholder="TAS" value={value} onChange={(e) => onChange(e.target.value)} />
      <div className="mt-1 h-3 text-[10px] text-ink-400">{resolved ? `${resolved.city || resolved.name}` : ''}</div>
    </div>
  );
}
