import { useCallback, useEffect, useMemo, useState } from 'react';
import { AlertTriangle, Award, Clock, DollarSign, GitBranch, MousePointerClick, Play, RefreshCw, Shield } from 'lucide-react';
import { Backtracking, type BTNode, type BTResult } from '../../dsa/Backtracking';
import type { Airport } from '../../types/airport';
import { FALLBACK_AIRPORTS } from '../../data/airports';
import { ROUTE_PAIRS } from '../../data/routes';
import { buildFlightGraph, graphToAdjacency, routeCost, routeDuration } from '../../utils/network';
import { formatDuration, formatNumber } from '../../utils/geo';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Select } from '../ui/Select';
import { BacktrackTree } from './BacktrackTree';
import { RerouteMap, type RevealedPath } from './RerouteMap';

// Non-optimal route colours (green is reserved for the optimal route).
const PALETTE = ['#0C73FE', '#FF6D00', '#FAAD14', '#9333EA', '#F5222D', '#0EA5A0', '#E11D48', '#2563EB', '#DB2777', '#7C3AED'];

function countTreeNodes(n: BTNode<string>): number {
  let c = 1;
  for (const ch of n.children) c += countTreeNodes(ch);
  return c;
}

export function Rerouting() {
  const airports = useMemo(() => [...FALLBACK_AIRPORTS].sort((a, b) => a.iata.localeCompare(b.iata)), []);
  const airportMap = useMemo(() => {
    const m = new Map<string, Airport>();
    for (const a of FALLBACK_AIRPORTS) m.set(a.iata, a);
    return m;
  }, []);
  const adjacency = useMemo(() => graphToAdjacency(buildFlightGraph(FALLBACK_AIRPORTS, ROUTE_PAIRS)), []);
  const bt = useMemo(() => new Backtracking<string>(adjacency), [adjacency]);

  const [origin, setOrigin] = useState('TAS');
  const [dest, setDest] = useState('JFK');
  const [closedHub, setClosedHub] = useState('IST');
  const [result, setResult] = useState<BTResult<string> | null>(null);
  const [pathReveal, setPathReveal] = useState(0);
  const [visualizing, setVisualizing] = useState(false);
  const [treeReveal, setTreeReveal] = useState(0);
  const [pickStep, setPickStep] = useState<'origin' | 'dest'>('origin');

  const sameEndpoints = origin === dest;

  const run = useCallback(() => {
    if (origin === dest) {
      setResult(null);
      return;
    }
    const blocked = closedHub !== 'none' ? new Set([closedHub]) : new Set<string>();
    const res = bt.findAllPaths(origin, dest, blocked, { maxDepth: 5, maxPaths: 24 });
    setVisualizing(false);
    setTreeReveal(0);
    setResult(res);
    setPathReveal(0);
  }, [origin, dest, closedHub, bt]);

  // Auto-run whenever the scenario changes — instant, no button needed.
  useEffect(() => {
    run();
  }, [run]);

  useEffect(() => {
    if (!result) return;
    let i = 0;
    const id = setInterval(() => {
      i++;
      setPathReveal(i);
      if (i >= result.paths.length) clearInterval(id);
    }, 400);
    return () => clearInterval(id);
  }, [result]);

  useEffect(() => {
    if (!result || !visualizing) return;
    const total = countTreeNodes(result.tree);
    let i = 0;
    setTreeReveal(0);
    const id = setInterval(() => {
      i++;
      setTreeReveal(i);
      if (i >= total) clearInterval(id);
    }, 110);
    return () => clearInterval(id);
  }, [result, visualizing]);

  const onSelectAirport = useCallback(
    (iata: string) => {
      if (pickStep === 'origin') {
        setOrigin(iata);
        setPickStep('dest');
      } else {
        if (iata !== origin) setDest(iata);
        setPickStep('origin');
      }
    },
    [pickStep, origin],
  );

  const revealedPaths: RevealedPath[] = useMemo(() => {
    if (!result) return [];
    return result.paths.slice(0, pathReveal).map((p, i) => {
      const distanceKm = p.cost;
      return {
        nodes: p.nodes,
        distanceKm,
        priceUsd: routeCost(distanceKm),
        durationMin: routeDuration(distanceKm),
        optimal: i === 0,
        color: i === 0 ? '#00C176' : PALETTE[(i - 1) % PALETTE.length],
      };
    });
  }, [result, pathReveal]);

  const best = revealedPaths.find((p) => p.optimal);

  return (
    <div className="page-enter h-full overflow-auto p-6">
      {/* Controls */}
      <Card className="mb-4 p-5">
        <div className="mb-4 flex items-center gap-2">
          <AlertTriangle size={18} className="text-orange" />
          <h3 className="text-sm font-bold text-ink-900">Contingency Rerouting · Recursive Backtracking</h3>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 lg:grid-cols-[1fr_1fr_1fr_auto_auto]">
          <Select label="Origin" value={origin} onChange={(e) => setOrigin(e.target.value)}>
            {airports.map((a) => (
              <option key={a.iata} value={a.iata}>
                {a.iata} · {a.city}
              </option>
            ))}
          </Select>
          <Select label="Destination" value={dest} onChange={(e) => setDest(e.target.value)}>
            {airports.map((a) => (
              <option key={a.iata} value={a.iata}>
                {a.iata} · {a.city}
              </option>
            ))}
          </Select>
          <Select label="Closed hub" value={closedHub} onChange={(e) => setClosedHub(e.target.value)}>
            <option value="none">None</option>
            {airports.map((a) => (
              <option key={a.iata} value={a.iata}>
                {a.iata} · {a.city}
              </option>
            ))}
          </Select>
          <div className="flex items-end">
            <Button icon={<RefreshCw size={15} />} className="w-full" onClick={run} disabled={sameEndpoints}>
              Re-run
            </Button>
          </div>
          <div className="flex items-end">
            <Button variant="secondary" icon={<Play size={15} />} className="w-full" onClick={() => setVisualizing(true)} disabled={!result}>
              Visualize
            </Button>
          </div>
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <span className="flex items-center gap-1.5 rounded-full bg-primary-light px-3 py-1 text-xs font-medium text-primary">
            <MousePointerClick size={13} />
            Click airports on the map — next click sets {pickStep === 'origin' ? 'ORIGIN' : 'DESTINATION'}
          </span>
          {sameEndpoints && <span className="text-xs text-danger">Origin and destination must differ.</span>}
          {result && (
            <>
              <Badge tone="green">{result.paths.length} routes</Badge>
              <Badge tone="blue">{formatNumber(result.explored)} nodes explored</Badge>
              {closedHub !== 'none' && <Badge tone="red">avoiding {closedHub}</Badge>}
              {best && (
                <Badge tone="green">
                  best ${formatNumber(best.priceUsd)} · {formatDuration(best.durationMin)}
                </Badge>
              )}
            </>
          )}
        </div>
      </Card>

      {/* Big interactive map */}
      <Card className="overflow-hidden p-0">
        <div className="h-[60vh] min-h-[420px] w-full">
          <RerouteMap
            airports={airportMap}
            paths={revealedPaths}
            origin={origin}
            dest={dest}
            closedHub={closedHub === 'none' ? null : closedHub}
            onSelectAirport={onSelectAirport}
          />
        </div>
      </Card>

      <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-2">
        {/* Alternative routes with price + time */}
        <Card className="p-5">
          <h3 className="mb-3 flex items-center gap-2 text-sm font-bold text-ink-900">
            <Shield size={16} className="text-primary" /> Alternative Routes
            <span className="ml-auto flex items-center gap-3 text-[11px] font-normal text-ink-400">
              <span className="flex items-center gap-1">
                <Clock size={12} /> time
              </span>
              <span className="flex items-center gap-1">
                <DollarSign size={12} /> price
              </span>
            </span>
          </h3>
          {!result ? (
            <div className="rounded-card bg-ink-50 px-4 py-8 text-center text-sm text-ink-400">
              Pick an origin, destination and a hub to close.
            </div>
          ) : result.paths.length === 0 ? (
            <div className="rounded-card bg-danger-light px-4 py-8 text-center text-sm text-danger">
              No route from {origin} to {dest} avoids {closedHub} within 5 legs.
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {revealedPaths.map((p, i) => (
                <div
                  key={`${p.nodes.join('-')}-${i}`}
                  className={`flex animate-fade-in flex-wrap items-center gap-x-3 gap-y-1 rounded-card border p-3 ${
                    p.optimal ? 'border-success/40 bg-success-light/50' : 'border-ink-100'
                  }`}
                >
                  <span className="h-3 w-3 shrink-0 rounded-full" style={{ background: p.color }} />
                  <div className="flex flex-1 flex-wrap items-center gap-1">
                    {p.nodes.map((n, j) => (
                      <span key={j} className="flex items-center gap-1">
                        <span className="text-xs font-bold text-ink-900">{n}</span>
                        {j < p.nodes.length - 1 && <span className="text-ink-300">→</span>}
                      </span>
                    ))}
                  </div>
                  {p.optimal && (
                    <Badge tone="green">
                      <Award size={11} /> BEST
                    </Badge>
                  )}
                  <Badge tone="gray">{p.nodes.length - 1} legs</Badge>
                  <span className="text-xs text-ink-500">{formatNumber(p.distanceKm)} km</span>
                  <span className="flex items-center gap-1 text-xs font-medium text-ink-700">
                    <Clock size={11} className="text-ink-400" />
                    {formatDuration(p.durationMin)}
                  </span>
                  <span className="w-16 text-right text-sm font-bold text-orange">${formatNumber(p.priceUsd)}</span>
                </div>
              ))}
              {pathReveal < result.paths.length && (
                <div className="py-2 text-center text-xs text-ink-400">
                  Discovering routes… {pathReveal}/{result.paths.length}
                </div>
              )}
            </div>
          )}
        </Card>

        {/* Call tree */}
        <Card className="p-5">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="flex items-center gap-2 text-sm font-bold text-ink-900">
              <GitBranch size={16} className="text-primary" /> Recursion Call Tree
            </h3>
            <div className="flex flex-wrap gap-2 text-[11px] text-ink-600">
              <LegendDot color="#0C73FE" label="explore" />
              <LegendDot color="#00C176" label="success" />
              <LegendDot color="#F5222D" label="dead end" />
              <LegendDot color="#9BA3B2" label="blocked" />
            </div>
          </div>
          {!result ? (
            <div className="flex h-64 items-center justify-center rounded-card bg-ink-50 text-sm text-ink-400">
              Press Visualize to watch the recursion build node-by-node.
            </div>
          ) : (
            <BacktrackTree tree={result.tree} revealCount={visualizing ? treeReveal : countTreeNodes(result.tree)} />
          )}
        </Card>
      </div>
    </div>
  );
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <span className="flex items-center gap-1">
      <span className="inline-block h-3 w-3 rounded-full" style={{ background: color }} />
      {label}
    </span>
  );
}
