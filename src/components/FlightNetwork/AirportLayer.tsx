import { useEffect, useRef } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet.markercluster';
import type { Airport } from '../../types/airport';

export type AirportRole = 'idle' | 'dep' | 'dest' | 'stop';

interface Props {
  airports: Airport[];
  roleOf: (iata: string) => AirportRole;
  onSelect: (airport: Airport) => void;
  /** Bump to force a rebuild when role colours change (route selection). */
  highlightKey: string;
}

function airportIcon(iata: string, role: AirportRole): L.DivIcon {
  const color = role === 'dep' ? '#00C176' : role === 'dest' ? '#FF6D00' : '#0C73FE';
  const ping = role === 'dep' || role === 'dest' ? `<span class="skynet-ping" style="--c:${color}"></span>` : '';
  return L.divIcon({
    className: 'skynet-marker',
    iconSize: [44, 30],
    iconAnchor: [22, 12],
    html: `<div class="ap-pin">${ping}<span class="ap-dot" style="--c:${color}"></span><span class="ap-label">${iata}</span></div>`,
  });
}

/**
 * Airport markers in a Leaflet markercluster group. Clusters at low zoom into a
 * single count badge and expands on zoom-in, so thousands of airports never
 * render as individual markers at once.
 */
export function AirportLayer({ airports, roleOf, onSelect, highlightKey }: Props) {
  const map = useMap();
  const clusterRef = useRef<L.MarkerClusterGroup | null>(null);
  const onSelectRef = useRef(onSelect);
  onSelectRef.current = onSelect;
  const roleRef = useRef(roleOf);
  roleRef.current = roleOf;

  useEffect(() => {
    const cluster = L.markerClusterGroup({
      chunkedLoading: true,
      maxClusterRadius: 55,
      showCoverageOnHover: false,
      spiderfyOnMaxZoom: true,
      iconCreateFunction: (c: L.MarkerCluster) =>
        L.divIcon({
          className: 'skynet-marker',
          iconSize: [38, 38],
          html: `<div class="ap-cluster">${c.getChildCount()}</div>`,
        }),
    });
    cluster.addTo(map);
    clusterRef.current = cluster;
    return () => {
      cluster.remove();
      clusterRef.current = null;
    };
  }, [map]);

  useEffect(() => {
    const cluster = clusterRef.current;
    if (!cluster) return;
    cluster.clearLayers();
    const markers: L.Marker[] = [];
    for (const a of airports) {
      const marker = L.marker([a.lat, a.lng], { icon: airportIcon(a.iata, roleRef.current(a.iata)) });
      marker.bindTooltip(`${a.iata} · ${a.city}`, { direction: 'top', offset: [0, -10] });
      marker.on('click', () => onSelectRef.current(a));
      markers.push(marker);
    }
    cluster.addLayers(markers);
  }, [airports, highlightKey]);

  return null;
}
