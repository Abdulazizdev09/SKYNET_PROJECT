/**
 * OpenSky `/states/all` returns each aircraft as a positional tuple, not an
 * object. This mirrors the documented field order so we can map it safely.
 */
export type OpenSkyStateTuple = [
  string, // 0  icao24
  string | null, // 1  callsign
  string, // 2  origin_country
  number | null, // 3  time_position
  number | null, // 4  last_contact
  number | null, // 5  longitude
  number | null, // 6  latitude
  number | null, // 7  baro_altitude
  boolean, // 8  on_ground
  number | null, // 9  velocity
  number | null, // 10 true_track
  number | null, // 11 vertical_rate
  number[] | null, // 12 sensors
  number | null, // 13 geo_altitude
  string | null, // 14 squawk
  boolean, // 15 spi
  number, // 16 position_source
];

export interface OpenSkyResponse {
  time: number;
  states: OpenSkyStateTuple[] | null;
}

/** Normalised live-aircraft state (mapped out of the raw tuple). */
export interface OpenSkyState {
  icao24: string;
  callsign: string;
  originCountry: string;
  longitude: number;
  latitude: number;
  baroAltitude: number | null;
  onGround: boolean;
  velocity: number | null;
  trueTrack: number;
}

export type FlightStatus = 'scheduled' | 'boarding' | 'on-time' | 'delayed' | 'cancelled';

/** Raw live-flight row from AirLabs `/flights` (bbox + zoom filtered). */
export interface AirLabsFlight {
  hex?: string | null;
  reg_number?: string | null;
  flag?: string | null;
  lat: number;
  lng: number;
  dir?: number | null; // heading in degrees
  alt?: number | null; // metres
  speed?: number | null; // km/h
  flight_iata?: string | null;
  dep_iata?: string | null;
  arr_iata?: string | null;
  airline_iata?: string | null;
  status?: string | null;
}

/** Raw schedule row from AirLabs `/schedules`. */
export interface AirLabsSchedule {
  flight_iata: string | null;
  airline_iata: string | null;
  dep_iata: string;
  arr_iata: string;
  dep_time: string | null;
  arr_time: string | null;
  status: string | null;
  duration: number | null;
}

/** Normalised flight used by Search, Analytics and the schedule board. */
export interface Flight {
  id: string;
  flightIata: string;
  airline: string;
  airlineName: string;
  depIata: string;
  arrIata: string;
  depTime: string; // HH:MM (24h)
  arrTime: string; // HH:MM (24h)
  depMinutes: number; // minutes since midnight — sort key
  durationMin: number;
  stops: number;
  price: number;
  status: FlightStatus;
}

/** Result of a Dijkstra route query, ready for the map + info card. */
export interface RouteResult {
  path: string[]; // IATA codes start → end
  distanceKm: number;
  cost: number;
  stops: number;
  durationMin: number;
}
