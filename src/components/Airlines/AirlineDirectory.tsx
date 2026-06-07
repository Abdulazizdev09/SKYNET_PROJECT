import { useMemo, useState } from 'react';
import { AlertCircle, Plane, RefreshCw, Search as SearchIcon } from 'lucide-react';
import { useAirlinesData } from '../../hooks/useStaticData';
import type { Airline } from '../../types/airline';
import { KMP } from '../../dsa/KMP';
import { HashTable } from '../../dsa/HashTable';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Skeleton } from '../ui/Skeleton';

const LETTER_COLORS = ['#0C73FE', '#FF6D00', '#00C176', '#FAAD14', '#9333EA', '#F5222D', '#0EA5A0'];

function letterColor(s: string): string {
  return LETTER_COLORS[(s.charCodeAt(0) || 0) % LETTER_COLORS.length];
}

const RESULT_CAP = 300;

export function AirlineDirectory() {
  const { data, loading, error, refresh } = useAirlinesData();
  const [query, setQuery] = useState('');
  const [activeOnly, setActiveOnly] = useState(false);

  // Build a HashTable<Airline> keyed by uppercased IATA for O(1) code lookups.
  const iataTable = useMemo(() => {
    const table = new HashTable<Airline>();
    for (const a of data) {
      if (a.iata) table.set(a.iata.toUpperCase(), a);
    }
    return table;
  }, [data]);

  const code = query.trim().toUpperCase();
  const isCodeLookup = code.length >= 2 && code.length <= 3;

  // matched = the full candidate set before the active-only filter / cap.
  const matched = useMemo<Airline[]>(() => {
    if (isCodeLookup) {
      const hit = iataTable.get(code);
      return hit ? [hit] : [];
    }
    const needle = query.trim().toLowerCase();
    if (needle.length === 0) return data;
    return data.filter((a) => KMP.search(a.name.toLowerCase(), needle).length > 0);
  }, [data, query, code, isCodeLookup, iataTable]);

  const filtered = useMemo<Airline[]>(
    () => (activeOnly ? matched.filter((a) => a.active === true) : matched),
    [matched, activeOnly],
  );

  const shown = useMemo(() => filtered.slice(0, RESULT_CAP), [filtered]);

  if (loading) {
    return (
      <div className="page-enter h-full overflow-auto p-6">
        <div className="flex flex-col gap-6">
          <Card className="p-5">
            <Skeleton className="mb-4 h-5 w-48" />
            <Skeleton className="h-12 w-full" />
          </Card>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 9 }).map((_, i) => (
              <Card key={i} className="p-4">
                <div className="flex items-center gap-3">
                  <Skeleton className="h-9 w-9 rounded-full" />
                  <div className="flex-1">
                    <Skeleton className="mb-2 h-4 w-32" />
                    <Skeleton className="h-3 w-20" />
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="page-enter h-full overflow-auto p-6">
        <Card className="flex flex-col items-center gap-3 p-10 text-center">
          <AlertCircle size={28} className="text-danger" />
          <p className="text-sm font-semibold text-ink-900">Could not load the airline directory</p>
          <p className="max-w-md text-xs text-ink-600">{error}</p>
          <Button variant="secondary" icon={<RefreshCw size={16} />} onClick={refresh}>
            Retry
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="page-enter h-full overflow-auto p-6">
      <div className="flex flex-col gap-6">
        {/* ── Filters ─────────────────────────────────────────── */}
        <Card className="p-5">
          <div className="mb-4 flex items-center gap-2">
            <Plane size={18} className="text-primary" />
            <h3 className="text-sm font-bold text-ink-900">Airline Directory</h3>
          </div>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
            <div className="flex-1">
              <Input
                label="Search by name or IATA code"
                placeholder="e.g. British Airways or BA"
                icon={<SearchIcon size={16} />}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>
            <label className="flex cursor-pointer select-none items-center gap-2 pb-3 text-sm text-ink-600">
              <input
                type="checkbox"
                checked={activeOnly}
                onChange={(e) => setActiveOnly(e.target.checked)}
                className="h-4 w-4 cursor-pointer rounded border-ink-200 text-primary accent-primary"
              />
              Active only
            </label>
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-ink-600">
            {isCodeLookup ? (
              <Badge tone="blue">hash O(1)</Badge>
            ) : (
              query.trim().length > 0 && <Badge tone="orange">KMP match</Badge>
            )}
            <span>
              showing <span className="font-bold text-ink-900">{shown.length}</span> of{' '}
              <span className="font-bold text-ink-900">{filtered.length}</span> airlines
            </span>
          </div>
        </Card>

        {/* ── Results grid ────────────────────────────────────── */}
        {shown.length === 0 ? (
          <Card className="flex flex-col items-center gap-2 p-10 text-center">
            <SearchIcon size={26} className="text-ink-300" />
            <p className="text-sm text-ink-400">
              No airlines match your search. Try a different name or IATA code.
            </p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {shown.map((a) => (
              <Card key={a.id} className="animate-fade-in p-4" hover>
                <div className="flex items-center gap-3">
                  <span
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white"
                    style={{ background: letterColor(a.name) }}
                  >
                    {a.name.charAt(0).toUpperCase()}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-bold text-ink-900">{a.name}</div>
                    <div className="truncate text-xs text-ink-600">{a.country ?? 'Unknown'}</div>
                  </div>
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-1.5">
                  {a.iata && <Badge tone="blue">IATA {a.iata}</Badge>}
                  {a.icao && <Badge tone="gray">ICAO {a.icao}</Badge>}
                  {a.active ? <Badge tone="green">Active</Badge> : <Badge tone="gray">Defunct</Badge>}
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
