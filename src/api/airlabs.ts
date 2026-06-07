import axios from 'axios';
import type { AirLabsAirport, Airport } from '../types/airport';
import type { AirLabsFlight, Flight, OpenSkyState } from '../types/flight';
import { FALLBACK_AIRPORTS } from '../data/airports';
import { generateFlights } from '../data/flights';

// Dev: same-origin proxy (avoids CORS). Prod build: direct (falls back if blocked).
const BASE = import.meta.env.DEV ? '/airlabs' : 'https://airlabs.co/api/v9';
const KEY = import.meta.env.VITE_AIRLABS_KEY as string | undefined;

export const HAS_AIRLABS_KEY = Boolean(KEY);

// Request only the fields we render — shrinks payloads dramatically.
const AIRPORT_FIELDS = 'name,iata_code,icao_code,lat,lng,country_code,city,is_major';
const FLIGHT_FIELDS = 'hex,lat,lng,dir,alt,speed,flight_iata,dep_iata,arr_iata,status,airline_iata,flag';

function mapAirport(raw: AirLabsAirport): Airport | null {
  if (!raw.iata_code || typeof raw.lat !== 'number' || typeof raw.lng !== 'number') return null;
  return {
    iata: raw.iata_code,
    icao: raw.icao_code ?? '',
    name: raw.name ?? raw.iata_code,
    city: raw.city ?? '',
    country: '',
    countryCode: raw.country_code,
    lat: raw.lat,
    lng: raw.lng,
    isMajor: raw.is_major === true || raw.is_major === 1,
  };
}

/**
 * Fetch airports for ONE country (`country_code`) with a trimmed field set.
 * Falls back to the matching slice of the built-in dataset on any failure.
 */
export async function fetchAirportsByCountry(countryCode: string): Promise<Airport[]> {
  const fallback = (): Airport[] => FALLBACK_AIRPORTS.filter((a) => a.countryCode === countryCode);
  if (!KEY) return fallback();
  try {
    const { data } = await axios.get<{ response?: AirLabsAirport[] }>(`${BASE}/airports`, {
      params: { api_key: KEY, country_code: countryCode, _fields: AIRPORT_FIELDS },
      timeout: 8000,
    });
    const mapped = (data.response ?? []).map(mapAirport).filter((a): a is Airport => a !== null);
    return mapped.length > 0 ? mapped : fallback();
  } catch {
    return fallback();
  }
}

/** Legacy global airports fetch — kept for compatibility; NOT used by the map. */
export async function fetchAirports(): Promise<Airport[]> {
  if (!KEY) return FALLBACK_AIRPORTS;
  try {
    const { data } = await axios.get<{ response?: AirLabsAirport[] }>(`${BASE}/airports`, {
      params: { api_key: KEY, _fields: AIRPORT_FIELDS },
      timeout: 8000,
    });
    const mapped = (data.response ?? []).map(mapAirport).filter((a): a is Airport => a !== null);
    return mapped.length > 0 ? mapped : FALLBACK_AIRPORTS;
  } catch {
    return FALLBACK_AIRPORTS;
  }
}

function mapFlight(raw: AirLabsFlight): OpenSkyState | null {
  if (typeof raw.lat !== 'number' || typeof raw.lng !== 'number') return null;
  return {
    icao24: raw.hex ?? raw.flight_iata ?? 'unknown',
    callsign: raw.flight_iata ?? 'N/A',
    originCountry: raw.flag ?? raw.airline_iata ?? '',
    longitude: raw.lng,
    latitude: raw.lat,
    baroAltitude: raw.alt ?? null,
    onGround: false,
    velocity: raw.speed != null ? raw.speed / 3.6 : null, // km/h → m/s
    trueTrack: raw.dir ?? 0,
  };
}

/**
 * Fetch live flights inside a viewport `bbox` ("SWlat,SWlng,NElat,NElng"),
 * using AirLabs' `zoom` (0–11) to thin out density. Throws on failure so the
 * caller can fall back to OpenSky or the simulated fleet.
 */
export async function fetchAirLabsFlights(bbox: string, zoom: number): Promise<OpenSkyState[]> {
  if (!KEY) throw new Error('AirLabs key missing');
  const { data } = await axios.get<{ response?: AirLabsFlight[] }>(`${BASE}/flights`, {
    params: { api_key: KEY, bbox, zoom: Math.min(Math.max(zoom, 0), 11), _fields: FLIGHT_FIELDS },
    timeout: 9000,
  });
  return (data.response ?? []).map(mapFlight).filter((s): s is OpenSkyState => s !== null);
}

/**
 * Fetch flight schedules. AirLabs schedules carry no pricing, so we attempt the
 * live call to exercise the integration, then return the seeded synthetic
 * dataset which has the price/time fields the AVL tree and sort visualiser need.
 */
export async function fetchSchedules(depIata?: string): Promise<Flight[]> {
  try {
    if (KEY) {
      await axios.get(`${BASE}/schedules`, {
        params: { api_key: KEY, dep_iata: depIata ?? 'TAS' },
        timeout: 8000,
      });
    }
  } catch {
    // ignored — fall through to synthetic dataset
  }
  const all = generateFlights();
  return depIata ? all.filter((f) => f.depIata === depIata) : all;
}

/** Connectivity probe for the top-bar status indicator. */
export async function pingAirlabs(): Promise<boolean> {
  if (!KEY) return false;
  try {
    const { data } = await axios.get<{ request?: unknown }>(`${BASE}/ping`, {
      params: { api_key: KEY },
      timeout: 6000,
    });
    return Boolean(data);
  } catch {
    return false;
  }
}
