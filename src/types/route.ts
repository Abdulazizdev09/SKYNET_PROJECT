/** A directed scheduled route between two airports (from OpenFlights routes.dat). */
export interface RouteEdge {
  airlineIata: string | null;
  fromIata: string;
  toIata: string;
  stops: number;
  equipment: string | null;
}

/** A country record (from OpenFlights countries.dat). */
export interface Country {
  name: string;
  iso: string | null;
}
