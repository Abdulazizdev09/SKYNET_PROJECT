/** Normalised airline (from OpenFlights airlines.dat or the local pack). */
export interface Airline {
  id: number;
  name: string;
  alias: string | null;
  iata: string | null;
  icao: string | null;
  callsign: string | null;
  country: string | null;
  active: boolean;
}
