export type SeatClass = 'first' | 'business' | 'economy';

export type SeatStatus = 'available' | 'selected' | 'booked' | 'blocked';

export type SeatPosition = 'window' | 'middle' | 'aisle';

export type PassengerStatus = 'checked-in' | 'queued' | 'boarded';

/** Priority value fed into the MaxHeap (higher boards first). */
export const CLASS_PRIORITY: Record<SeatClass, number> = {
  first: 3,
  business: 2,
  economy: 1,
};

export interface Seat {
  id: string; // e.g. "12A"
  row: number;
  column: string; // A–F
  seatClass: SeatClass;
  status: SeatStatus;
  price: number;
  position: SeatPosition;
  isExitRow: boolean;
}

export interface Passenger {
  pnr: string;
  name: string;
  seat: string; // seat id
  seatClass: SeatClass;
  priority: number;
  flightIata: string;
  bookingTime: number; // epoch ms
  status: PassengerStatus;
}

export interface LuggageItem {
  id: string;
  tag: string;
  owner: string;
  weightKg: number;
}
