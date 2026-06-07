import type { Airport } from '../types/airport';
import type { Flight, FlightStatus } from '../types/flight';
import { FALLBACK_AIRPORTS } from './airports';
import { ROUTE_PAIRS } from './routes';
import { haversineKm, minutesToHHMM } from '../utils/geo';
import { routeCost, routeDuration } from '../utils/network';
import { mulberry32, pick, randInt } from '../utils/random';

export interface Airline {
  iata: string;
  name: string;
}

export const AIRLINES: Airline[] = [
  { iata: 'HY', name: 'Uzbekistan Airways' },
  { iata: 'BA', name: 'British Airways' },
  { iata: 'AF', name: 'Air France' },
  { iata: 'EK', name: 'Emirates' },
  { iata: 'QR', name: 'Qatar Airways' },
  { iata: 'TK', name: 'Turkish Airlines' },
  { iata: 'LH', name: 'Lufthansa' },
  { iata: 'SQ', name: 'Singapore Airlines' },
  { iata: 'AA', name: 'American Airlines' },
  { iata: 'DL', name: 'Delta Air Lines' },
  { iata: 'UA', name: 'United Airlines' },
  { iata: 'CX', name: 'Cathay Pacific' },
];

const STATUS_WEIGHTS: { status: FlightStatus; weight: number }[] = [
  { status: 'on-time', weight: 55 },
  { status: 'scheduled', weight: 20 },
  { status: 'boarding', weight: 10 },
  { status: 'delayed', weight: 12 },
  { status: 'cancelled', weight: 3 },
];

function weightedStatus(rng: () => number): FlightStatus {
  const total = STATUS_WEIGHTS.reduce((a, b) => a + b.weight, 0);
  let r = rng() * total;
  for (const entry of STATUS_WEIGHTS) {
    if (r < entry.weight) return entry.status;
    r -= entry.weight;
  }
  return 'on-time';
}

const COORDS = new Map<string, Airport>(
  FALLBACK_AIRPORTS.map((a): [string, Airport] => [a.iata, a]),
);

/**
 * Generate a deterministic, realistic set of flights (with prices, departure
 * times, durations and statuses) used by the Search (AVL) and Analytics (sort)
 * views. Acts as the offline schedule dataset behind the AirLabs integration.
 */
export function generateFlights(count = 42, seed = 20260607): Flight[] {
  const rng = mulberry32(seed);
  const flights: Flight[] = [];
  for (let i = 0; i < count; i++) {
    const [dep, arr] = pick(rng, ROUTE_PAIRS);
    const a = COORDS.get(dep);
    const b = COORDS.get(arr);
    if (!a || !b) continue;
    const distance = haversineKm(a.lat, a.lng, b.lat, b.lng);
    const durationMin = routeDuration(distance);
    const depMinutes = randInt(rng, 5 * 60, 22 * 60);
    const airline = pick(rng, AIRLINES);
    const number = randInt(rng, 100, 1999);
    const stops = rng() < 0.78 ? 0 : 1;
    const price = Math.round(routeCost(distance) * (0.8 + rng() * 0.9));
    flights.push({
      id: `${airline.iata}${number}-${i}`,
      flightIata: `${airline.iata}${number}`,
      airline: airline.iata,
      airlineName: airline.name,
      depIata: dep,
      arrIata: arr,
      depTime: minutesToHHMM(depMinutes),
      arrTime: minutesToHHMM(depMinutes + durationMin),
      depMinutes,
      durationMin,
      stops,
      price,
      status: weightedStatus(rng),
    });
  }
  return flights;
}
