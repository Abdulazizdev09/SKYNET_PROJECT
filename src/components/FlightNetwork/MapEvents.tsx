import { useEffect, useRef } from 'react';
import { useMap } from 'react-leaflet';
import type { BBox } from '../../api/opensky';

interface Props {
  onViewport: (bbox: BBox, zoom: number) => void;
  debounceMs?: number;
}

/**
 * Reports the map viewport (bbox + zoom) on moveend/zoomend, debounced so we
 * don't fetch while the user is still dragging. Fires once on mount.
 */
export function MapEvents({ onViewport, debounceMs = 800 }: Props) {
  const map = useMap();
  const cbRef = useRef(onViewport);
  cbRef.current = onViewport;

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | null = null;
    const fire = (): void => {
      const b = map.getBounds();
      cbRef.current(
        { lamin: b.getSouth(), lomin: b.getWest(), lamax: b.getNorth(), lomax: b.getEast() },
        Math.floor(map.getZoom()),
      );
    };
    const onMove = (): void => {
      if (timer) clearTimeout(timer);
      timer = setTimeout(fire, debounceMs);
    };
    map.on('moveend', onMove);
    map.on('zoomend', onMove);
    fire();
    return () => {
      if (timer) clearTimeout(timer);
      map.off('moveend', onMove);
      map.off('zoomend', onMove);
    };
  }, [map, debounceMs]);

  return null;
}
