import { idbClear, idbGet, idbSet } from '../utils/idb';
import {
  OPENFLIGHTS_URLS,
  parseAirlines,
  parseAirports,
  parseCountries,
  parsePlanes,
  parseRoutes,
} from '../data/openflights';
import type { Airport } from '../types/airport';
import type { Airline } from '../types/airline';
import type { Country, RouteEdge } from '../types/route';
import type { Plane } from '../types/aircraft';

export const OF_KEYS = {
  airports: 'of:airports',
  airlines: 'of:airlines',
  routes: 'of:routes',
  planes: 'of:planes',
  countries: 'of:countries',
} as const;

/** Cache-first fetch + parse of an OpenFlights dataset (IndexedDB-backed). */
async function cached<T extends unknown[]>(
  key: string,
  url: string,
  parse: (t: string) => T,
  force: boolean,
): Promise<T> {
  if (!force) {
    const hit = await idbGet<T>(key);
    // Treat an empty array as a cache miss so a transient bad fetch can't poison the cache.
    if (hit && hit.length > 0) return hit;
  }
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${url} → HTTP ${res.status}`);
  const parsed = parse(await res.text());
  if (parsed.length > 0) await idbSet(key, parsed);
  return parsed;
}

export const loadOFAirlines = (force = false): Promise<Airline[]> =>
  cached(OF_KEYS.airlines, OPENFLIGHTS_URLS.airlines, parseAirlines, force);
export const loadOFRoutes = (force = false): Promise<RouteEdge[]> =>
  cached(OF_KEYS.routes, OPENFLIGHTS_URLS.routes, parseRoutes, force);
export const loadOFPlanes = (force = false): Promise<Plane[]> =>
  cached(OF_KEYS.planes, OPENFLIGHTS_URLS.planes, parsePlanes, force);
export const loadOFCountries = (force = false): Promise<Country[]> =>
  cached(OF_KEYS.countries, OPENFLIGHTS_URLS.countries, parseCountries, force);

/**
 * Airports get extra enrichment: ISO country codes (from countries.dat, so the
 * continent filter works) and a `isMajor` flag derived from route degree.
 */
export async function loadOFAirports(force = false): Promise<Airport[]> {
  if (!force) {
    const hit = await idbGet<Airport[]>(OF_KEYS.airports);
    if (hit && hit.length > 0) return hit;
  }
  const res = await fetch(OPENFLIGHTS_URLS.airports);
  if (!res.ok) throw new Error(`airports → HTTP ${res.status}`);
  let airports = parseAirports(await res.text());

  try {
    const countries = await loadOFCountries(force);
    const isoByName = new Map(countries.map((c) => [c.name.toLowerCase(), c.iso ?? '']));
    airports = airports.map((a) => ({ ...a, countryCode: isoByName.get(a.country.toLowerCase()) ?? '' }));
  } catch {
    // leave country codes blank
  }

  let enriched = false;
  try {
    const routes = await loadOFRoutes(force);
    const degree = new Map<string, number>();
    for (const e of routes) {
      degree.set(e.fromIata, (degree.get(e.fromIata) ?? 0) + 1);
      degree.set(e.toIata, (degree.get(e.toIata) ?? 0) + 1);
    }
    airports = airports.map((a) => ({ ...a, isMajor: (degree.get(a.iata) ?? 0) >= 20 }));
    enriched = true;
  } catch {
    // routes unavailable — every airport stays isMajor:false
  }

  // Only persist a fully-enriched, non-empty result; otherwise let the next load retry.
  if (airports.length > 0 && enriched) await idbSet(OF_KEYS.airports, airports);
  return airports;
}

export async function clearDatasetCache(): Promise<void> {
  await idbClear();
}

/** Which datasets are currently cached (for the Data Sources panel). */
export async function getCacheInfo(): Promise<Record<keyof typeof OF_KEYS, boolean>> {
  const entries = await Promise.all(
    (Object.keys(OF_KEYS) as (keyof typeof OF_KEYS)[]).map(
      async (k) => [k, (await idbGet(OF_KEYS[k])) !== null] as const,
    ),
  );
  return Object.fromEntries(entries) as Record<keyof typeof OF_KEYS, boolean>;
}
