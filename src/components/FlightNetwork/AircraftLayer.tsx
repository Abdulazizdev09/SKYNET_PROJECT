import { useEffect, useRef } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import type { OpenSkyState } from '../../types/flight';

interface Props {
  aircraft: OpenSkyState[];
}

function planeIcon(track: number): L.DivIcon {
  return L.divIcon({
    className: 'skynet-marker',
    iconSize: [20, 20],
    iconAnchor: [10, 10],
    html: `<div class="aircraft-icon" style="transform:rotate(${track}deg)"><svg width="20" height="20" viewBox="0 0 24 24" fill="#FF6D00"><path d="M12 2l1.4 7.4L21 13v2l-7.6-1.6L13 21l1.6 1.3v1L12 23l-2.6.3v-1L11 21l-.4-7.6L3 15v-2l7.6-3.6L12 2z"/></svg></div>`,
  });
}

function tooltipHtml(ac: OpenSkyState): string {
  const alt = ac.baroAltitude ? `${Math.round(ac.baroAltitude)} m` : 'n/a';
  const spd = ac.velocity ? `${Math.round(ac.velocity * 3.6)} km/h` : 'n/a';
  return `<div style="font-size:11px"><b>${ac.callsign}</b><br/>${alt} · ${spd}<br/>${ac.originCountry}</div>`;
}

/**
 * Imperative aircraft layer. Markers are created once and then updated in place
 * via setLatLng / setIcon (keyed by icao24) — React never re-renders them, so a
 * fleet of up to 300 planes animates without reconciliation cost.
 */
export function AircraftLayer({ aircraft }: Props) {
  const map = useMap();
  const groupRef = useRef<L.LayerGroup | null>(null);
  const markersRef = useRef<Map<string, { marker: L.Marker; track: number }>>(new Map());

  useEffect(() => {
    const group = L.layerGroup().addTo(map);
    groupRef.current = group;
    const markers = markersRef.current;
    return () => {
      group.remove();
      groupRef.current = null;
      markers.clear();
    };
  }, [map]);

  useEffect(() => {
    const group = groupRef.current;
    if (!group) return;
    const markers = markersRef.current;

    const desired = new Map<string, OpenSkyState>();
    for (const ac of aircraft) desired.set(ac.icao24, ac);

    for (const [id, ac] of desired) {
      const existing = markers.get(id);
      if (existing) {
        existing.marker.setLatLng([ac.latitude, ac.longitude]);
        if (Math.abs(existing.track - ac.trueTrack) > 2) {
          existing.marker.setIcon(planeIcon(ac.trueTrack));
          existing.track = ac.trueTrack;
        }
      } else {
        const marker = L.marker([ac.latitude, ac.longitude], { icon: planeIcon(ac.trueTrack) });
        marker.bindTooltip(tooltipHtml(ac), { direction: 'top', offset: [0, -6] });
        marker.addTo(group);
        markers.set(id, { marker, track: ac.trueTrack });
      }
    }

    for (const [id, val] of markers) {
      if (!desired.has(id)) {
        group.removeLayer(val.marker);
        markers.delete(id);
      }
    }
  }, [aircraft]);

  return null;
}
