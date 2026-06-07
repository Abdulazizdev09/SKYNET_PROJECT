import { useEffect, useState } from 'react';
import { pingAirlabs } from '../api/airlabs';
import { pingOpenSky } from '../api/opensky';

export interface ApiStatus {
  opensky: boolean | null; // null = still checking
  airlabs: boolean | null;
}

const RECHECK_MS = 30_000;

/** Probe OpenSky + AirLabs connectivity on mount and every 30s thereafter. */
export function useApiStatus(): ApiStatus {
  const [opensky, setOpensky] = useState<boolean | null>(null);
  const [airlabs, setAirlabs] = useState<boolean | null>(null);

  useEffect(() => {
    let mounted = true;
    const check = (): void => {
      void pingOpenSky().then((v) => mounted && setOpensky(v));
      void pingAirlabs().then((v) => mounted && setAirlabs(v));
    };
    check();
    const id = setInterval(check, RECHECK_MS);
    return () => {
      mounted = false;
      clearInterval(id);
    };
  }, []);

  return { opensky, airlabs };
}
