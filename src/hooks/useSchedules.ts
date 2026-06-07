import { useCallback, useEffect, useState } from 'react';
import type { Flight } from '../types/flight';
import { fetchSchedules } from '../api/airlabs';

export interface UseSchedules {
  data: Flight[];
  loading: boolean;
  error: string | null;
  retry: () => void;
}

/** Load flight schedules (AirLabs attempt → seeded synthetic dataset). */
export function useSchedules(depIata?: string): UseSchedules {
  const [data, setData] = useState<Flight[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const flights = await fetchSchedules(depIata);
      setData(flights);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load schedules');
    } finally {
      setLoading(false);
    }
  }, [depIata]);

  useEffect(() => {
    void load();
  }, [load]);

  return { data, loading, error, retry: load };
}
