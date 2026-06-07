import { useCallback, useEffect, useState } from 'react';
import type { Airport } from '../types/airport';
import { fetchAirports } from '../api/airlabs';

export interface UseAirports {
  data: Airport[];
  loading: boolean;
  error: string | null;
  retry: () => void;
}

/** Load the airport database (AirLabs → built-in fallback). */
export function useAirports(): UseAirports {
  const [data, setData] = useState<Airport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const airports = await fetchAirports();
      setData(airports);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load airports');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return { data, loading, error, retry: load };
}
