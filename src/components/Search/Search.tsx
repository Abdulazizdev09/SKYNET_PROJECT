import { useMemo, useState } from 'react';
import { ArrowRight, Clock, Plane, SlidersHorizontal, Tag } from 'lucide-react';
import { AVLTree } from '../../dsa/AVLTree';
import { HashTable } from '../../dsa/HashTable';
import type { Flight } from '../../types/flight';
import type { Passenger } from '../../types/passenger';
import { generateFlights } from '../../data/flights';
import { generatePassengers } from '../../data/passengers';
import { FALLBACK_AIRPORTS } from '../../data/airports';
import { formatDuration } from '../../utils/geo';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { AvlTreeView } from './AvlTreeView';
import { PnrLookup } from './PnrLookup';

const LETTER_COLORS = ['#0C73FE', '#FF6D00', '#00C176', '#FAAD14', '#9333EA', '#F5222D', '#0EA5A0'];

function letterColor(s: string): string {
  return LETTER_COLORS[(s.charCodeAt(0) || 0) % LETTER_COLORS.length];
}

export function Search() {
  const flights = useMemo(() => generateFlights(), []);
  const passengers = useMemo(() => generatePassengers(), []);
  const pnrTable = useMemo(() => {
    const t = new HashTable<Passenger>();
    for (const p of passengers) t.set(p.pnr, p);
    return t;
  }, [passengers]);
  const samples = useMemo(() => passengers.slice(0, 6).map((p) => p.pnr), [passengers]);

  const airports = useMemo(() => [...FALLBACK_AIRPORTS].sort((a, b) => a.iata.localeCompare(b.iata)), []);

  const [from, setFrom] = useState('any');
  const [to, setTo] = useState('any');
  const [minPrice, setMinPrice] = useState(200);
  const [maxPrice, setMaxPrice] = useState(900);

  const filtered = useMemo(
    () =>
      flights.filter(
        (f) => (from === 'any' || f.depIata === from) && (to === 'any' || f.arrIata === to),
      ),
    [flights, from, to],
  );

  const avl = useMemo(() => {
    const tree = new AVLTree<Flight>((f) => f.price);
    for (const f of filtered) tree.insert(f);
    return tree;
  }, [filtered]);

  const results = useMemo(
    () => avl.rangeQuery(minPrice, maxPrice).sort((a, b) => a.price - b.price),
    [avl, minPrice, maxPrice],
  );

  const viz = useMemo(() => avl.toViz(), [avl]);

  return (
    <div className="page-enter h-full overflow-auto p-6">
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_380px]">
        {/* ── AVL price search ────────────────────────────────── */}
        <div className="flex flex-col gap-6">
          <Card className="p-5">
            <div className="mb-4 flex items-center gap-2">
              <SlidersHorizontal size={18} className="text-primary" />
              <h3 className="text-sm font-bold text-ink-900">Flight Price Search</h3>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <Select label="From" value={from} onChange={(e) => setFrom(e.target.value)}>
                <option value="any">Any origin</option>
                {airports.map((a) => (
                  <option key={a.iata} value={a.iata}>
                    {a.iata} · {a.city}
                  </option>
                ))}
              </Select>
              <Select label="To" value={to} onChange={(e) => setTo(e.target.value)}>
                <option value="any">Any destination</option>
                {airports.map((a) => (
                  <option key={a.iata} value={a.iata}>
                    {a.iata} · {a.city}
                  </option>
                ))}
              </Select>
              <Input
                label="Min price"
                type="number"
                value={minPrice}
                onChange={(e) => setMinPrice(Math.max(0, Number(e.target.value) || 0))}
              />
              <Input
                label="Max price"
                type="number"
                value={maxPrice}
                onChange={(e) => setMaxPrice(Number(e.target.value) || 0)}
              />
            </div>
          </Card>

          <Card className="p-5">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Tag size={18} className="text-primary" />
                <h3 className="text-sm font-bold text-ink-900">AVL Price Index</h3>
              </div>
              <div className="flex items-center gap-2 text-xs text-ink-600">
                <Badge tone="blue">{filtered.length} indexed</Badge>
                <span>
                  range query{' '}
                  <span className="font-semibold text-primary">
                    ${minPrice}–${maxPrice}
                  </span>{' '}
                  → <span className="font-semibold text-success">{results.length} hits</span> · O(log n)
                </span>
              </div>
            </div>
            <AvlTreeView root={viz} min={minPrice} max={maxPrice} />
          </Card>

          <Card className="p-5">
            <h3 className="mb-3 text-sm font-bold text-ink-900">
              Results <span className="font-normal text-ink-400">({results.length}, cheapest first)</span>
            </h3>
            {results.length === 0 ? (
              <div className="rounded-card bg-ink-50 px-4 py-8 text-center text-sm text-ink-400">
                No flights in this price range. Widen the range or change airports.
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                {results.map((f) => (
                  <div
                    key={f.id}
                    className="flex items-center gap-3 rounded-card border border-ink-100 p-3 transition-all duration-150 hover:bg-ink-50"
                  >
                    <span
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white"
                      style={{ background: letterColor(f.airlineName) }}
                    >
                      {f.airlineName[0]}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 text-sm font-bold text-ink-900">
                        {f.flightIata}
                        <span className="truncate text-xs font-normal text-ink-600">{f.airlineName}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-ink-600">
                        <span className="font-semibold text-ink-900">{f.depTime}</span>
                        {f.depIata}
                        <ArrowRight size={11} className="text-ink-300" />
                        <span className="font-semibold text-ink-900">{f.arrTime}</span>
                        {f.arrIata}
                      </div>
                    </div>
                    <div className="hidden items-center gap-1 text-xs text-ink-400 sm:flex">
                      <Clock size={12} /> {formatDuration(f.durationMin)}
                      <span className="mx-1">·</span>
                      {f.stops === 0 ? 'Direct' : `${f.stops} stop`}
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-orange">${f.price}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

        {/* ── PNR hash lookup ─────────────────────────────────── */}
        <div className="flex flex-col gap-6">
          <PnrLookup table={pnrTable} samples={samples} />
          <Card className="p-5">
            <div className="mb-2 flex items-center gap-2">
              <Plane size={16} className="text-primary" />
              <h3 className="text-sm font-bold text-ink-900">Directory</h3>
            </div>
            <p className="text-xs leading-relaxed text-ink-600">
              <span className="font-bold text-ink-900">{passengers.length}</span> passenger records loaded
              into the hash table across <span className="font-bold text-ink-900">{pnrTable.getCapacity()}</span>{' '}
              buckets. Average lookup cost is <span className="font-semibold text-primary">O(1)</span> — the
              table doubles capacity past a 0.75 load factor to keep chains short.
            </p>
          </Card>
        </div>
      </div>
    </div>
  );
}
