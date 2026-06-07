import axios from 'axios';
import type { OpenSkyResponse, OpenSkyState, OpenSkyStateTuple } from '../types/flight';
import { mulberry32, pick, randInt } from '../utils/random';

// In dev, go through the Vite proxy (avoids CORS). In a production build there
// is no proxy, so direct calls are attempted and will fall back if CORS-blocked.
const DEV = import.meta.env.DEV;
const BASE = DEV ? '/osky' : 'https://opensky-network.org/api';
const TOKEN_URL = DEV
  ? '/osky-auth/auth/realms/opensky-network/protocol/openid-connect/token'
  : 'https://auth.opensky-network.org/auth/realms/opensky-network/protocol/openid-connect/token';
const CLIENT_ID = import.meta.env.VITE_OPENSKY_CLIENT_ID as string | undefined;
const CLIENT_SECRET = import.meta.env.VITE_OPENSKY_CLIENT_SECRET as string | undefined;

export interface BBox {
  lamin: number;
  lomin: number;
  lamax: number;
  lomax: number;
}

const AIRLINES = ['HY', 'BA', 'AF', 'EK', 'QR', 'TK', 'LH', 'SQ', 'AA', 'UA', 'CX', 'DL'];

/** Map a raw OpenSky positional tuple to a named, position-valid state. */
function mapState(tuple: OpenSkyStateTuple): OpenSkyState | null {
  const longitude = tuple[5];
  const latitude = tuple[6];
  if (longitude === null || latitude === null) return null;
  return {
    icao24: tuple[0],
    callsign: (tuple[1] ?? '').trim() || 'N/A',
    originCountry: tuple[2],
    longitude,
    latitude,
    baroAltitude: tuple[7],
    onGround: tuple[8],
    velocity: tuple[9],
    trueTrack: tuple[10] ?? 0,
  };
}

// ── OAuth2 client-credentials token (cached) ─────────────────
let tokenCache: { token: string; expiresAt: number } | null = null;

async function getToken(): Promise<string | null> {
  if (!CLIENT_ID || !CLIENT_SECRET) return null;
  if (tokenCache && tokenCache.expiresAt > Date.now()) return tokenCache.token;
  try {
    // OpenSky uses OAuth2 client-credentials with a form-encoded body.
    const body = new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
    });
    const { data } = await axios.post<{ access_token?: string; expires_in?: number }>(TOKEN_URL, body, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      timeout: 8000,
    });
    if (!data.access_token) return null;
    tokenCache = { token: data.access_token, expiresAt: Date.now() + ((data.expires_in ?? 1800) - 60) * 1000 };
    return tokenCache.token;
  } catch {
    return null;
  }
}

/**
 * Fetch live aircraft within a bounding box. NEVER fetches globally — the bbox
 * is mandatory (a global `/states/all` returns 5000+ aircraft and freezes the
 * UI). Throws on failure so the caller can fall back.
 */
export async function fetchLiveAircraft(bbox: BBox): Promise<OpenSkyState[]> {
  const token = await getToken();
  const headers = token ? { Authorization: `Bearer ${token}` } : undefined;
  const { data } = await axios.get<OpenSkyResponse>(`${BASE}/states/all`, {
    params: { lamin: bbox.lamin, lomin: bbox.lomin, lamax: bbox.lamax, lomax: bbox.lomax },
    headers,
    timeout: 9000,
  });
  return (data.states ?? []).map(mapState).filter((s): s is OpenSkyState => s !== null);
}

/** AirLabs `zoom` density parameter to use for a given map zoom level. */
export function zoomDensityParam(mapZoom: number): number {
  if (mapZoom < 4) return 3;
  if (mapZoom <= 7) return 6;
  return 9;
}

/** Target number of simulated aircraft for a given map zoom level. */
export function densityForZoom(mapZoom: number): number {
  if (mapZoom < 4) return 60;
  if (mapZoom <= 7) return 180;
  return 300;
}

/** Hard cap: keep at most `max` aircraft, preferring the fastest (most active). */
export function capAircraft(list: OpenSkyState[], max = 300): OpenSkyState[] {
  if (list.length <= max) return list;
  return [...list].sort((a, b) => (b.velocity ?? 0) - (a.velocity ?? 0)).slice(0, max);
}

/** Generate a believable fleet uniformly distributed inside a bounding box. */
export function generateSimulatedAircraftInBbox(bbox: BBox, count: number): OpenSkyState[] {
  const seed = (Math.floor((bbox.lamin + 90) * 73 + (bbox.lomin + 180) * 31) % 100000) + 1;
  const rng = mulberry32(seed);
  const latSpan = bbox.lamax - bbox.lamin || 1;
  const lngSpan = bbox.lomax - bbox.lomin || 1;
  const fleet: OpenSkyState[] = [];
  for (let i = 0; i < count; i++) {
    fleet.push({
      icao24: (0x400000 + randInt(rng, 0, 0x3fffff)).toString(16),
      callsign: `${pick(rng, AIRLINES)}${randInt(rng, 100, 999)}`,
      originCountry: 'Simulated',
      longitude: bbox.lomin + rng() * lngSpan,
      latitude: bbox.lamin + rng() * latSpan,
      baroAltitude: randInt(rng, 9000, 12500),
      onGround: false,
      velocity: randInt(rng, 200, 265),
      trueTrack: rng() * 360,
    });
  }
  return fleet;
}

/**
 * Advance simulated aircraft forward by `seconds` along their heading, wrapping
 * positions that exit the bounding box back to the opposite edge. Pure.
 */
export function advanceAircraft(states: OpenSkyState[], seconds: number, bbox: BBox): OpenSkyState[] {
  const latSpan = bbox.lamax - bbox.lamin || 1;
  const lngSpan = bbox.lomax - bbox.lomin || 1;
  return states.map((s) => {
    const distM = (s.velocity ?? 230) * seconds;
    const brg = (s.trueTrack * Math.PI) / 180;
    let lat = s.latitude + (distM * Math.cos(brg)) / 111320;
    let lng = s.longitude + (distM * Math.sin(brg)) / (111320 * Math.cos((s.latitude * Math.PI) / 180));
    if (lat > bbox.lamax) lat -= latSpan;
    if (lat < bbox.lamin) lat += latSpan;
    if (lng > bbox.lomax) lng -= lngSpan;
    if (lng < bbox.lomin) lng += lngSpan;
    return { ...s, latitude: lat, longitude: lng };
  });
}

/** Connectivity probe for the top-bar status indicator (tiny bbox). */
export async function pingOpenSky(): Promise<boolean> {
  try {
    await axios.get(`${BASE}/states/all`, {
      params: { lamin: 46, lomin: 6, lamax: 47, lomax: 7 },
      timeout: 7000,
    });
    return true;
  } catch {
    return false;
  }
}
