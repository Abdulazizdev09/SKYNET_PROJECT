import { Loader2 } from 'lucide-react';
import {
  CONTINENTS,
  CONTINENT_COUNTRIES,
  countryName,
  type ContinentId,
} from '../../data/continents';
import { Card } from '../ui/Card';

interface Props {
  continent: ContinentId;
  onContinentChange: (c: ContinentId) => void;
  country: string;
  onCountryChange: (c: string) => void;
  showAll: boolean;
  onShowAllChange: (v: boolean) => void;
  loading: boolean;
  airportCount: number;
}

export function ContinentFilter({
  continent,
  onContinentChange,
  country,
  onCountryChange,
  showAll,
  onShowAllChange,
  loading,
  airportCount,
}: Props) {
  const countries = continent === 'all' ? [] : CONTINENT_COUNTRIES[continent];

  return (
    <Card className="pointer-events-auto w-[min(92vw,560px)] p-3">
      <div className="flex flex-wrap gap-1.5">
        {CONTINENTS.map((c) => {
          const active = c.id === continent;
          return (
            <button
              key={c.id}
              onClick={() => onContinentChange(c.id)}
              className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-all duration-150 ${
                active ? 'bg-primary text-white shadow-btn' : 'bg-ink-50 text-ink-600 hover:bg-ink-100'
              }`}
            >
              <span className="mr-1">{c.emoji}</span>
              {c.label}
            </button>
          );
        })}
      </div>

      {continent !== 'all' && (
        <div className="mt-3 flex flex-wrap items-center gap-3 border-t border-ink-100 pt-3">
          <label className="flex items-center gap-2 text-xs font-medium text-ink-600">
            Country
            <select
              value={country}
              onChange={(e) => onCountryChange(e.target.value)}
              className="rounded-chip border border-ink-100 bg-ink-50 px-2 py-1.5 text-xs text-ink-900 outline-none focus:border-primary"
            >
              <option value="all">All countries</option>
              {countries.map((code) => (
                <option key={code} value={code}>
                  {countryName(code)}
                </option>
              ))}
            </select>
          </label>

          <label className="flex cursor-pointer items-center gap-2 text-xs font-medium text-ink-600">
            <input
              type="checkbox"
              checked={showAll}
              onChange={(e) => onShowAllChange(e.target.checked)}
              className="h-3.5 w-3.5 accent-primary"
            />
            Show all airports
          </label>

          <span className="ml-auto flex items-center gap-1.5 text-xs text-ink-400">
            {loading ? (
              <>
                <Loader2 size={12} className="animate-spin" /> loading…
              </>
            ) : (
              <>{airportCount} airports</>
            )}
          </span>
        </div>
      )}
    </Card>
  );
}
