import { useCallback, useEffect, useState } from 'react';
import type { StaticSourceId } from '../types/source';
import type { Airport } from '../types/airport';
import type { Airline } from '../types/airline';
import type { Country, RouteEdge } from '../types/route';
import type { Plane } from '../types/aircraft';
import { useDataSource } from '../context/DataSourceContext';
import { getAirlines, getAirports, getCountries, getPlanes, getRoutes } from '../api/staticData';

export interface DatasetResult<T> {
  data: T[];
  loading: boolean;
  error: string | null;
  refresh: () => void;
}

// Module-level memo so switching pages does not re-parse 10k+ rows each mount.
const memo = new Map<string, unknown[]>();

/** Drop cached parsed datasets (call after clearing the IndexedDB cache). */
export function clearStaticMemo(): void {
  memo.clear();
}

function useDataset<T>(
  name: string,
  getter: (src: StaticSourceId, force: boolean) => Promise<T[]>,
): DatasetResult<T> {
  const { staticSource } = useDataSource();
  const key = `${name}:${staticSource}`;
  const [data, setData] = useState<T[]>(() => (memo.get(key) as T[] | undefined) ?? []);
  const [loading, setLoading] = useState(!memo.has(key));
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(
    async (force: boolean) => {
      const k = `${name}:${staticSource}`;
      if (!force && memo.has(k)) {
        setData(memo.get(k) as T[]);
        setLoading(false);
        return;
      }
      setLoading(true);
      setError(null);
      try {
        const result = await getter(staticSource, force);
        memo.set(k, result);
        setData(result);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to load dataset');
      } finally {
        setLoading(false);
      }
    },
    [name, staticSource, getter],
  );

  useEffect(() => {
    void load(false);
  }, [load]);

  const refresh = useCallback(() => void load(true), [load]);
  return { data, loading, error, refresh };
}

export const useAirportsData = (): DatasetResult<Airport> => useDataset('airports', getAirports);
export const useAirlinesData = (): DatasetResult<Airline> => useDataset('airlines', getAirlines);
export const useRoutesData = (): DatasetResult<RouteEdge> => useDataset('routes', getRoutes);
export const usePlanesData = (): DatasetResult<Plane> => useDataset('planes', getPlanes);
export const useCountriesData = (): DatasetResult<Country> => useDataset('countries', getCountries);
