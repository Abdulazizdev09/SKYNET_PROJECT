import type { Airline } from '../types/airline';
import type { Plane } from '../types/aircraft';
import type { Country, RouteEdge } from '../types/route';
import { FALLBACK_AIRPORTS } from './airports';
import { ROUTE_PAIRS } from './routes';
import { AIRLINES } from './flights';

/** Offline airline pack derived from the curated airline list. */
export const LOCAL_AIRLINES: Airline[] = AIRLINES.map((a, i) => ({
  id: i + 1,
  name: a.name,
  alias: null,
  iata: a.iata,
  icao: null,
  callsign: null,
  country: null,
  active: true,
}));

/** Offline aircraft pack. */
export const LOCAL_PLANES: Plane[] = [
  { name: 'Airbus A320', iata: '320', icao: 'A320' },
  { name: 'Airbus A321neo', iata: '32Q', icao: 'A21N' },
  { name: 'Airbus A330-300', iata: '333', icao: 'A333' },
  { name: 'Airbus A350-900', iata: '359', icao: 'A359' },
  { name: 'Airbus A380-800', iata: '388', icao: 'A388' },
  { name: 'Boeing 737-800', iata: '738', icao: 'B738' },
  { name: 'Boeing 737 MAX 8', iata: '7M8', icao: 'B38M' },
  { name: 'Boeing 777-300ER', iata: '77W', icao: 'B77W' },
  { name: 'Boeing 787-9 Dreamliner', iata: '789', icao: 'B789' },
  { name: 'Boeing 747-8', iata: '74H', icao: 'B748' },
  { name: 'Embraer E190', iata: 'E90', icao: 'E190' },
  { name: 'Bombardier Q400', iata: 'DH4', icao: 'DH8D' },
];

/** Offline route pack: curated pairs expanded to both directions. */
export const LOCAL_ROUTES: RouteEdge[] = ROUTE_PAIRS.flatMap(([from, to]) => [
  { airlineIata: null, fromIata: from, toIata: to, stops: 0, equipment: null },
  { airlineIata: null, fromIata: to, toIata: from, stops: 0, equipment: null },
]);

/** Offline country pack derived from the curated airports. */
export const LOCAL_COUNTRIES: Country[] = (() => {
  const m = new Map<string, string>();
  for (const a of FALLBACK_AIRPORTS) if (a.countryCode) m.set(a.country, a.countryCode);
  return [...m.entries()].map(([name, iso]) => ({ name, iso }));
})();
