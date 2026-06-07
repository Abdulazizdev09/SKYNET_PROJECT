import { nullable, parseDat } from '../utils/csv';
import type { Airport } from '../types/airport';
import type { Airline } from '../types/airline';
import type { Country, RouteEdge } from '../types/route';
import type { Plane } from '../types/aircraft';

/** Raw OpenFlights dataset URLs (raw.githubusercontent.com is CORS-open). */
export const OPENFLIGHTS_URLS = {
  airports: 'https://raw.githubusercontent.com/jpatokal/openflights/master/data/airports.dat',
  airlines: 'https://raw.githubusercontent.com/jpatokal/openflights/master/data/airlines.dat',
  routes: 'https://raw.githubusercontent.com/jpatokal/openflights/master/data/routes.dat',
  planes: 'https://raw.githubusercontent.com/jpatokal/openflights/master/data/planes.dat',
  countries: 'https://raw.githubusercontent.com/jpatokal/openflights/master/data/countries.dat',
} as const;

// airports.dat: id,name,city,country,IATA,ICAO,lat,lon,alt,tzoff,dst,tz,type,source
export function parseAirports(text: string): Airport[] {
  const seen = new Set<string>();
  const out: Airport[] = [];
  for (const r of parseDat(text)) {
    const iata = nullable(r[4]);
    if (!iata || iata.length !== 3) continue;
    const lat = Number(r[6]);
    const lng = Number(r[7]);
    if (Number.isNaN(lat) || Number.isNaN(lng)) continue;
    if (seen.has(iata)) continue;
    seen.add(iata);
    out.push({
      iata,
      icao: nullable(r[5]) ?? '',
      name: nullable(r[1]) ?? iata,
      city: nullable(r[2]) ?? '',
      country: nullable(r[3]) ?? '',
      countryCode: '',
      lat,
      lng,
      isMajor: false,
    });
  }
  return out;
}

// airlines.dat: id,name,alias,IATA,ICAO,callsign,country,active(Y/N)
export function parseAirlines(text: string): Airline[] {
  const out: Airline[] = [];
  for (const r of parseDat(text)) {
    const name = r[1];
    if (!name) continue;
    const iata = nullable(r[3]);
    const icao = nullable(r[4]);
    out.push({
      id: Number(r[0]) || 0,
      name,
      alias: nullable(r[2]),
      iata: iata && iata !== '-' ? iata : null,
      icao: icao && icao !== 'N/A' ? icao : null,
      callsign: nullable(r[5]),
      country: nullable(r[6]),
      active: (r[7] ?? '').trim() === 'Y',
    });
  }
  return out;
}

// routes.dat: airline,airlineID,src,srcID,dst,dstID,codeshare,stops,equipment
export function parseRoutes(text: string): RouteEdge[] {
  const out: RouteEdge[] = [];
  for (const r of parseDat(text)) {
    const from = nullable(r[2]);
    const to = nullable(r[4]);
    if (!from || !to) continue;
    out.push({
      airlineIata: nullable(r[0]),
      fromIata: from,
      toIata: to,
      stops: Number(r[7]) || 0,
      equipment: nullable(r[8]),
    });
  }
  return out;
}

// planes.dat: name,IATA,ICAO
export function parsePlanes(text: string): Plane[] {
  const out: Plane[] = [];
  for (const r of parseDat(text)) {
    const name = nullable(r[0]);
    if (!name) continue;
    out.push({ name, iata: nullable(r[1]), icao: nullable(r[2]) });
  }
  return out;
}

// countries.dat: name,iso,dafif
export function parseCountries(text: string): Country[] {
  const out: Country[] = [];
  for (const r of parseDat(text)) {
    const name = nullable(r[0]);
    if (!name) continue;
    out.push({ name, iso: nullable(r[1]) });
  }
  return out;
}
