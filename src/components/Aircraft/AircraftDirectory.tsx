import { useMemo, useState } from 'react';
import { Plane, Search } from 'lucide-react';
import { usePlanesData } from '../../hooks/useStaticData';
import type { Plane as PlaneType } from '../../types/aircraft';
import { KMP } from '../../dsa/KMP';
import type { BadgeTone } from '../ui/Badge';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Input } from '../ui/Input';
import { Skeleton } from '../ui/Skeleton';

interface Maker {
  label: string;
  tone: BadgeTone;
}

function makerFor(name: string): Maker {
  const n = name.trim();
  if (n.startsWith('Airbus')) return { label: 'Airbus', tone: 'blue' };
  if (n.startsWith('Boeing')) return { label: 'Boeing', tone: 'orange' };
  if (n.startsWith('Embraer')) return { label: 'Embraer', tone: 'gray' };
  if (n.startsWith('Bombardier')) return { label: 'Bombardier', tone: 'gray' };
  const word = n.split(/[\s-]+/)[0] || 'Other';
  return { label: word, tone: 'gray' };
}

export function AircraftDirectory() {
  const { data, loading, error, refresh } = usePlanesData();
  const [query, setQuery] = useState('');

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (q.length === 0) return data;
    return data.filter((p) => KMP.search(p.name.toLowerCase(), q).length > 0);
  }, [data, query]);

  return (
    <div className="page-enter h-full overflow-auto p-6">
      <div className="flex flex-col gap-6">
        <Card className="p-5">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Plane size={18} className="text-primary" />
              <h3 className="text-sm font-bold text-ink-900">Aircraft Directory</h3>
            </div>
            <div className="flex items-center gap-2 text-xs text-ink-600">
              <Badge tone="blue">{data.length} types</Badge>
              <span>
                matching{' '}
                <span className="font-semibold text-primary">{results.length}</span> · KMP search
              </span>
            </div>
          </div>
          <Input
            placeholder="Search aircraft types by name…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            icon={<Search size={16} />}
          />
        </Card>

        {error ? (
          <Card className="p-8 text-center">
            <p className="mb-3 text-sm text-danger">{error}</p>
            <button
              onClick={refresh}
              className="rounded-btn bg-primary px-5 py-2.5 text-sm font-semibold text-white transition-all duration-150 hover:bg-primary-hover hover:shadow-btn"
            >
              Retry
            </button>
          </Card>
        ) : loading ? (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 9 }).map((_, i) => (
              <Card key={i} className="flex items-center gap-3 p-4">
                <Skeleton className="h-11 w-11 rounded-full" />
                <div className="min-w-0 flex-1">
                  <Skeleton className="mb-2 h-4 w-3/4" />
                  <div className="flex gap-2">
                    <Skeleton className="h-5 w-14 rounded-full" />
                    <Skeleton className="h-5 w-14 rounded-full" />
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : results.length === 0 ? (
          <Card className="p-8 text-center text-sm text-ink-400">
            No aircraft types match “{query}”. Try a different name.
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {results.map((p: PlaneType, i: number) => {
              const maker = makerFor(p.name);
              return (
                <Card
                  key={`${p.icao ?? p.iata ?? p.name}-${i}`}
                  hover
                  className="flex items-center gap-3 p-4"
                >
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary-light text-primary">
                    <Plane size={20} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-bold text-ink-900">{p.name}</div>
                    <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                      <Badge tone={maker.tone}>{maker.label}</Badge>
                      {p.iata && <Badge tone="gray">IATA {p.iata}</Badge>}
                      {p.icao && <Badge tone="gray">ICAO {p.icao}</Badge>}
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
