import type { StaticSourceId } from '../types/source';
import type { Airport } from '../types/airport';
import type { Airline } from '../types/airline';
import type { Country, RouteEdge } from '../types/route';
import type { Plane } from '../types/aircraft';
import { FALLBACK_AIRPORTS } from '../data/airports';
import { LOCAL_AIRLINES, LOCAL_COUNTRIES, LOCAL_PLANES, LOCAL_ROUTES } from '../data/localpack';
import { fetchAirports as fetchAirlabsAirports } from './airlabs';
import { loadOFAirlines, loadOFAirports, loadOFCountries, loadOFPlanes, loadOFRoutes } from './datasets';

/**
 * Resolve a static dataset from the chosen source, always degrading gracefully
 * to the offline local pack so the UI never ends up empty.
 */
export async function getAirports(src: StaticSourceId, force = false): Promise<Airport[]> {
  if (src === 'local') return FALLBACK_AIRPORTS;
  if (src === 'airlabs') {
    const a = await fetchAirlabsAirports();
    return a.length > 0 ? a : FALLBACK_AIRPORTS;
  }
  try {
    return await loadOFAirports(force);
  } catch {
    return FALLBACK_AIRPORTS;
  }
}

export async function getAirlines(src: StaticSourceId, force = false): Promise<Airline[]> {
  if (src !== 'local') {
    try {
      return await loadOFAirlines(force);
    } catch {
      return LOCAL_AIRLINES;
    }
  }
  return LOCAL_AIRLINES;
}

export async function getRoutes(src: StaticSourceId, force = false): Promise<RouteEdge[]> {
  if (src !== 'local') {
    try {
      return await loadOFRoutes(force);
    } catch {
      return LOCAL_ROUTES;
    }
  }
  return LOCAL_ROUTES;
}

export async function getPlanes(src: StaticSourceId, force = false): Promise<Plane[]> {
  if (src !== 'local') {
    try {
      return await loadOFPlanes(force);
    } catch {
      return LOCAL_PLANES;
    }
  }
  return LOCAL_PLANES;
}

export async function getCountries(src: StaticSourceId, force = false): Promise<Country[]> {
  if (src !== 'local') {
    try {
      return await loadOFCountries(force);
    } catch {
      return LOCAL_COUNTRIES;
    }
  }
  return LOCAL_COUNTRIES;
}
