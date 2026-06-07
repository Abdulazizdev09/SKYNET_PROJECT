import type { SeatClass } from './passenger';

export type TravelMode = 'flight' | 'train' | 'road' | 'ship';
export type TripReason = 'leisure' | 'work' | 'crew' | 'other';

/** A flight the user has flown — the personal logbook entry (OpenFlights-style). */
export interface LoggedFlight {
  id: string;
  fromIata: string;
  toIata: string;
  date: string; // ISO yyyy-mm-dd
  airlineIata: string | null;
  aircraft: string | null;
  seatClass: SeatClass | '';
  reason: TripReason;
  mode: TravelMode;
  flightNo: string;
  distanceKm: number;
  notes: string;
}
