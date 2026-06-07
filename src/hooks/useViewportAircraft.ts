import { useCallback, useEffect, useRef, useState } from 'react';
import type { OpenSkyState } from '../types/flight';
import type { LiveSourceId } from '../types/source';
import { fetchAirLabsFlights } from '../api/airlabs';
import {
  advanceAircraft,
  capAircraft,
  densityForZoom,
  fetchLiveAircraft,
  generateSimulatedAircraftInBbox,
  zoomDensityParam,
  type BBox,
} from '../api/opensky';

export type AircraftSource = 'live' | 'simulated';

export interface ViewportAircraft {
  data: OpenSkyState[];
  source: AircraftSource;
  setViewport: (bbox: BBox, zoom: number) => void;
}

function bboxString(b: BBox): string {
  return [b.lamin, b.lomin, b.lamax, b.lomax].join(',');
}

/**
 * Viewport-driven live aircraft. Fetches ONLY when the map viewport changes
 * (no fixed polling timer): AirLabs `/flights` bbox+zoom first, then OpenSky
 * bbox, then a simulated fleet bounded to the viewport. Caps at 300 markers,
 * pauses while the tab is hidden, and animates the simulated fleet locally.
 */
export function useViewportAircraft(
  onUpdate?: (count: number, source: AircraftSource) => void,
  liveSource: LiveSourceId = 'opensky',
): ViewportAircraft {
  const [data, setData] = useState<OpenSkyState[]>([]);
  const [source, setSource] = useState<AircraftSource>('simulated');

  const viewportRef = useRef<{ bbox: BBox; zoom: number } | null>(null);
  const sourceRef = useRef<AircraftSource>('simulated');
  const dataRef = useRef<OpenSkyState[]>([]);
  const hiddenRef = useRef(false);
  const reqIdRef = useRef(0);
  const onUpdateRef = useRef(onUpdate);
  onUpdateRef.current = onUpdate;

  const apply = useCallback((list: OpenSkyState[], src: AircraftSource): void => {
    const capped = capAircraft(list, 300);
    dataRef.current = capped;
    sourceRef.current = src;
    setData(capped);
    setSource(src);
    onUpdateRef.current?.(capped.length, src);
  }, []);

  const setViewport = useCallback(
    async (bbox: BBox, zoom: number): Promise<void> => {
      viewportRef.current = { bbox, zoom };
      // Bump on every entry so any in-flight request is invalidated (e.g. when the
      // user switches the live source to 'simulated' mid-fetch).
      const reqId = ++reqIdRef.current;
      if (hiddenRef.current) return;

      // Local source: skip the network entirely.
      if (liveSource === 'simulated') {
        apply(generateSimulatedAircraftInBbox(bbox, densityForZoom(zoom)), 'simulated');
        return;
      }

      let result: OpenSkyState[] | null = null;
      try {
        result =
          liveSource === 'airlabs'
            ? await fetchAirLabsFlights(bboxString(bbox), zoomDensityParam(zoom))
            : await fetchLiveAircraft(bbox);
        if (!result || result.length === 0) result = null;
      } catch {
        result = null;
      }
      if (reqId !== reqIdRef.current) return; // a newer request superseded this one

      if (result && result.length > 0) apply(result, 'live');
      else apply(generateSimulatedAircraftInBbox(bbox, densityForZoom(zoom)), 'simulated');
    },
    [apply, liveSource],
  );

  // Pause on tab hidden; refresh the current viewport when it becomes visible.
  useEffect(() => {
    const onVis = (): void => {
      hiddenRef.current = document.hidden;
      if (!document.hidden && viewportRef.current) {
        void setViewport(viewportRef.current.bbox, viewportRef.current.zoom);
      }
    };
    document.addEventListener('visibilitychange', onVis);
    return () => document.removeEventListener('visibilitychange', onVis);
  }, [setViewport]);

  // Re-fetch the current viewport whenever the live source changes.
  useEffect(() => {
    if (viewportRef.current) void setViewport(viewportRef.current.bbox, viewportRef.current.zoom);
  }, [setViewport]);

  // Animate the simulated fleet locally (no network), paused while hidden.
  useEffect(() => {
    const id = setInterval(() => {
      if (hiddenRef.current || sourceRef.current !== 'simulated') return;
      const vp = viewportRef.current;
      if (!vp || dataRef.current.length === 0) return;
      const next = advanceAircraft(dataRef.current, 2, vp.bbox);
      dataRef.current = next;
      setData(next);
    }, 2000);
    return () => clearInterval(id);
  }, []);

  return { data, source, setViewport };
}
