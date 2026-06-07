import { useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import {
  Award,
  Clock,
  Flag,
  Globe,
  MapPin,
  Plane,
  Route,
  TrendingUp,
} from 'lucide-react';
import type { LoggedFlight } from '../../types/logbook';
import type { Airport } from '../../types/airport';
import type { Airline } from '../../types/airline';
import { MaxHeap } from '../../dsa/Heap';
import { HashTable } from '../../dsa/HashTable';
import { formatNumber, formatDuration } from '../../utils/geo';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';

interface Props {
  flights: LoggedFlight[];
  airports: Map<string, Airport>;
  airlines: Map<string, Airline>;
}

const PIE_COLORS = ['#0C73FE', '#FF6D00', '#00C176', '#9BA3B2'];

interface Ranked {
  key: string;
  count: number;
}

interface YearStat {
  year: string;
  flights: number;
  km: number;
}

interface Slice {
  name: string;
  value: number;
}

/** Pull the top `n` keyed counts out of a HashTable<number> via a MaxHeap. */
function topByCount(table: HashTable<number>, n: number): Ranked[] {
  const heap = new MaxHeap<Ranked>((a, b) => a.count - b.count);
  for (const key of table.keys()) {
    heap.insert({ key, count: table.get(key) ?? 0 });
  }
  const out: Ranked[] = [];
  for (let i = 0; i < n; i++) {
    const next = heap.extractMax();
    if (!next) break;
    out.push(next);
  }
  return out;
}

function classLabel(seatClass: string): string {
  if (seatClass === '') return 'Unspecified';
  return seatClass.charAt(0).toUpperCase() + seatClass.slice(1);
}

export function TripStats({ flights, airports, airlines }: Props) {
  const stats = useMemo(() => {
    let totalKm = 0;
    const airportSet = new Set<string>();
    const countrySet = new Set<string>();
    let longest: LoggedFlight | null = null;
    let shortest: LoggedFlight | null = null;

    const airlineCounts = new HashTable<number>();
    const airportCounts = new HashTable<number>();
    const yearMap = new Map<string, YearStat>();
    const classMap = new Map<string, number>();

    for (const f of flights) {
      totalKm += f.distanceKm;

      airportSet.add(f.fromIata);
      airportSet.add(f.toIata);

      const fromCountry = airports.get(f.fromIata)?.country;
      const toCountry = airports.get(f.toIata)?.country;
      if (fromCountry) countrySet.add(fromCountry);
      if (toCountry) countrySet.add(toCountry);

      if (!longest || f.distanceKm > longest.distanceKm) longest = f;
      if (!shortest || f.distanceKm < shortest.distanceKm) shortest = f;

      if (f.airlineIata) {
        airlineCounts.set(f.airlineIata, (airlineCounts.get(f.airlineIata) ?? 0) + 1);
      }

      airportCounts.set(f.fromIata, (airportCounts.get(f.fromIata) ?? 0) + 1);
      airportCounts.set(f.toIata, (airportCounts.get(f.toIata) ?? 0) + 1);

      const year = f.date.slice(0, 4);
      const yearStat = yearMap.get(year) ?? { year, flights: 0, km: 0 };
      yearStat.flights += 1;
      yearStat.km += f.distanceKm;
      yearMap.set(year, yearStat);

      classMap.set(f.seatClass, (classMap.get(f.seatClass) ?? 0) + 1);
    }

    const topAirlines = topByCount(airlineCounts, 5).map((r) => ({
      key: r.key,
      label: airlines.get(r.key)?.name ?? r.key,
      count: r.count,
    }));

    const topAirports = topByCount(airportCounts, 5).map((r) => ({
      key: r.key,
      label: airports.get(r.key)?.city ?? r.key,
      count: r.count,
    }));

    const perYear: YearStat[] = [...yearMap.values()].sort((a, b) =>
      a.year.localeCompare(b.year),
    );

    const byClass: Slice[] = [...classMap.entries()].map(([key, value]) => ({
      name: classLabel(key),
      value,
    }));

    return {
      count: flights.length,
      totalKm,
      estHours: totalKm / 800,
      uniqueAirports: airportSet.size,
      uniqueCountries: countrySet.size,
      longest,
      shortest,
      topAirlines,
      topAirports,
      perYear,
      byClass,
    };
  }, [flights, airports, airlines]);

  if (flights.length === 0) {
    return (
      <Card className="p-8 text-center text-sm text-ink-400">
        Log flights to unlock your travel stats.
      </Card>
    );
  }

  const statCards = [
    {
      label: 'Distance',
      value: `${formatNumber(Math.round(stats.totalKm))} km`,
      icon: <Route size={18} />,
      accent: 'text-orange',
      bg: 'bg-orange-light',
    },
    {
      label: 'Flights',
      value: formatNumber(stats.count),
      icon: <Plane size={18} />,
      accent: 'text-primary',
      bg: 'bg-primary-light',
    },
    {
      label: 'Est. hours',
      value: formatDuration(Math.round(stats.estHours * 60)),
      icon: <Clock size={18} />,
      accent: 'text-success',
      bg: 'bg-success-light',
    },
    {
      label: 'Airports',
      value: formatNumber(stats.uniqueAirports),
      icon: <MapPin size={18} />,
      accent: 'text-primary',
      bg: 'bg-primary-light',
    },
    {
      label: 'Countries',
      value: formatNumber(stats.uniqueCountries),
      icon: <Flag size={18} />,
      accent: 'text-primary',
      bg: 'bg-primary-light',
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      {/* ── headline stat cards ─────────────────────────────── */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {statCards.map((s) => (
          <Card key={s.label} className="p-4">
            <div className="mb-2 flex items-center gap-2">
              <span
                className={`flex h-8 w-8 items-center justify-center rounded-chip ${s.bg} ${s.accent}`}
              >
                {s.icon}
              </span>
              <span className="text-xs font-medium uppercase tracking-wide text-ink-600">
                {s.label}
              </span>
            </div>
            <div className={`text-xl font-bold ${s.accent}`}>{s.value}</div>
          </Card>
        ))}
      </div>

      {/* ── longest / shortest ──────────────────────────────── */}
      {(stats.longest || stats.shortest) && (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {stats.longest && (
            <Card className="flex items-center justify-between p-4">
              <div>
                <div className="text-xs font-medium uppercase tracking-wide text-ink-600">
                  Longest flight
                </div>
                <div className="mt-1 text-sm font-bold text-ink-900">
                  {stats.longest.fromIata} → {stats.longest.toIata}
                </div>
              </div>
              <Badge tone="orange">{formatNumber(Math.round(stats.longest.distanceKm))} km</Badge>
            </Card>
          )}
          {stats.shortest && (
            <Card className="flex items-center justify-between p-4">
              <div>
                <div className="text-xs font-medium uppercase tracking-wide text-ink-600">
                  Shortest flight
                </div>
                <div className="mt-1 text-sm font-bold text-ink-900">
                  {stats.shortest.fromIata} → {stats.shortest.toIata}
                </div>
              </div>
              <Badge tone="blue">{formatNumber(Math.round(stats.shortest.distanceKm))} km</Badge>
            </Card>
          )}
        </div>
      )}

      {/* ── flights per year ────────────────────────────────── */}
      <Card className="p-5">
        <div className="mb-4 flex items-center gap-2">
          <TrendingUp size={18} className="text-primary" />
          <h3 className="text-sm font-bold text-ink-900">Flights per year</h3>
        </div>
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={stats.perYear} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#EEF0F3" vertical={false} />
            <XAxis
              dataKey="year"
              tick={{ fill: '#5A6478', fontSize: 12 }}
              axisLine={{ stroke: '#D9DCE3' }}
              tickLine={false}
            />
            <YAxis
              allowDecimals={false}
              tick={{ fill: '#5A6478', fontSize: 12 }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              cursor={{ fill: 'rgba(12,115,254,0.06)' }}
              contentStyle={{
                borderRadius: 12,
                border: '1px solid #EEF0F3',
                boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
                fontSize: 12,
              }}
            />
            <Bar dataKey="flights" fill="#0C73FE" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </Card>

      {/* ── seat class split ────────────────────────────────── */}
      <Card className="p-5">
        <div className="mb-4 flex items-center gap-2">
          <Globe size={18} className="text-primary" />
          <h3 className="text-sm font-bold text-ink-900">Cabin class split</h3>
        </div>
        <ResponsiveContainer width="100%" height={240}>
          <PieChart>
            <Pie
              data={stats.byClass}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              innerRadius={56}
              outerRadius={88}
              paddingAngle={2}
            >
              {stats.byClass.map((entry, i) => (
                <Cell key={entry.name} fill={PIE_COLORS[i % PIE_COLORS.length]} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                borderRadius: 12,
                border: '1px solid #EEF0F3',
                boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
                fontSize: 12,
              }}
            />
          </PieChart>
        </ResponsiveContainer>
        <div className="mt-2 flex flex-wrap justify-center gap-3">
          {stats.byClass.map((entry, i) => (
            <span key={entry.name} className="flex items-center gap-1.5 text-xs text-ink-600">
              <span
                className="inline-block h-2.5 w-2.5 rounded-full"
                style={{ background: PIE_COLORS[i % PIE_COLORS.length] }}
              />
              {entry.name}
              <span className="font-semibold text-ink-900">{entry.value}</span>
            </span>
          ))}
        </div>
      </Card>

      {/* ── top airlines / airports ─────────────────────────── */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card className="p-5">
          <div className="mb-1 flex items-center gap-2">
            <Award size={18} className="text-primary" />
            <h3 className="text-sm font-bold text-ink-900">Top airlines</h3>
          </div>
          <p className="mb-3 text-xs text-ink-400">ranked via MaxHeap</p>
          {stats.topAirlines.length === 0 ? (
            <div className="rounded-card bg-ink-50 px-4 py-6 text-center text-sm text-ink-400">
              No airline data logged yet.
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {stats.topAirlines.map((a, i) => (
                <div
                  key={a.key}
                  className="flex items-center gap-3 rounded-card border border-ink-100 p-3 transition-all duration-150 hover:bg-ink-50"
                >
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary-light text-xs font-bold text-primary">
                    {i + 1}
                  </span>
                  <span className="min-w-0 flex-1 truncate text-sm font-semibold text-ink-900">
                    {a.label}
                  </span>
                  <Badge tone="blue">{a.count}</Badge>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card className="p-5">
          <div className="mb-1 flex items-center gap-2">
            <MapPin size={18} className="text-primary" />
            <h3 className="text-sm font-bold text-ink-900">Top airports</h3>
          </div>
          <p className="mb-3 text-xs text-ink-400">ranked via MaxHeap</p>
          {stats.topAirports.length === 0 ? (
            <div className="rounded-card bg-ink-50 px-4 py-6 text-center text-sm text-ink-400">
              No airport data logged yet.
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {stats.topAirports.map((a, i) => (
                <div
                  key={a.key}
                  className="flex items-center gap-3 rounded-card border border-ink-100 p-3 transition-all duration-150 hover:bg-ink-50"
                >
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-orange-light text-xs font-bold text-orange">
                    {i + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-semibold text-ink-900">{a.label}</div>
                    <div className="text-xs text-ink-400">{a.key}</div>
                  </div>
                  <Badge tone="orange">{a.count}</Badge>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
