import { useCallback, useEffect, useState } from 'react';
import type { LoggedFlight } from '../types/logbook';

const STORAGE_KEY = 'skynet:logbook';

function load(): LoggedFlight[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as LoggedFlight[];
  } catch {
    // ignore
  }
  return [];
}

let idSeq = 0;
function newId(): string {
  idSeq += 1;
  return `lf_${Date.now().toString(36)}_${idSeq}_${Math.floor(Math.random() * 1e6)}`;
}

export interface UseLogbook {
  flights: LoggedFlight[];
  add: (f: Omit<LoggedFlight, 'id'>) => void;
  update: (f: LoggedFlight) => void;
  remove: (id: string) => void;
  clear: () => void;
  importFlights: (list: LoggedFlight[], replace?: boolean) => void;
}

/** Personal flight logbook persisted to localStorage. */
export function useLogbook(): UseLogbook {
  const [flights, setFlights] = useState<LoggedFlight[]>(() => load());

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(flights));
    } catch {
      // ignore (quota)
    }
  }, [flights]);

  const add = useCallback((f: Omit<LoggedFlight, 'id'>) => {
    setFlights((prev) => [{ ...f, id: newId() }, ...prev]);
  }, []);

  const update = useCallback((f: LoggedFlight) => {
    setFlights((prev) => prev.map((x) => (x.id === f.id ? f : x)));
  }, []);

  const remove = useCallback((id: string) => {
    setFlights((prev) => prev.filter((x) => x.id !== id));
  }, []);

  const clear = useCallback(() => setFlights([]), []);

  const importFlights = useCallback((list: LoggedFlight[], replace = false) => {
    setFlights((prev) => {
      // Regenerate any missing or colliding ids so React keys stay unique.
      const seen = new Set(replace ? [] : prev.map((p) => p.id));
      const incoming = list.map((f) => {
        let id = f.id;
        if (!id || seen.has(id)) id = newId();
        seen.add(id);
        return { ...f, id };
      });
      return replace ? incoming : [...incoming, ...prev];
    });
  }, []);

  return { flights, add, update, remove, clear, importFlights };
}
