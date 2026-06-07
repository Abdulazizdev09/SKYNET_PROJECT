import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import type { DataSourceState, LiveSourceId, StaticSourceId } from '../types/source';

const STORAGE_KEY = 'skynet:datasource';
const DEFAULT: DataSourceState = { staticSource: 'openflights', liveSource: 'opensky' };

interface DataSourceContextValue extends DataSourceState {
  setStaticSource: (s: StaticSourceId) => void;
  setLiveSource: (s: LiveSourceId) => void;
  resetToLocal: () => void;
}

const Ctx = createContext<DataSourceContextValue | null>(null);

function loadState(): DataSourceState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const p = JSON.parse(raw) as Partial<DataSourceState>;
      return {
        staticSource: p.staticSource ?? DEFAULT.staticSource,
        liveSource: p.liveSource ?? DEFAULT.liveSource,
      };
    }
  } catch {
    // ignore
  }
  return DEFAULT;
}

export function DataSourceProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<DataSourceState>(() => loadState());

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // ignore
    }
  }, [state]);

  const setStaticSource = useCallback((s: StaticSourceId) => setState((p) => ({ ...p, staticSource: s })), []);
  const setLiveSource = useCallback((s: LiveSourceId) => setState((p) => ({ ...p, liveSource: s })), []);
  const resetToLocal = useCallback(() => setState({ staticSource: 'local', liveSource: 'simulated' }), []);

  const value = useMemo<DataSourceContextValue>(
    () => ({ ...state, setStaticSource, setLiveSource, resetToLocal }),
    [state, setStaticSource, setLiveSource, resetToLocal],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useDataSource(): DataSourceContextValue {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useDataSource must be used within a DataSourceProvider');
  return ctx;
}
