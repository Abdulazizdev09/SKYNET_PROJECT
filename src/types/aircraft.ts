/** Passenger aircraft type (from OpenFlights planes.dat). */
export interface Plane {
  name: string;
  iata: string | null;
  icao: string | null;
}
