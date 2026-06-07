import type { Seat, SeatClass, SeatPosition } from '../types/passenger';
import { CLASS_PRIORITY } from '../types/passenger';
import { mulberry32, pick, randInt } from '../utils/random';

interface ClassDef {
  cls: SeatClass;
  startRow: number;
  endRow: number;
  cols: string[];
  aisleAfter: string[];
  basePrice: number;
}

/** A320-style single-aisle cabin: First (1–4), Business (5–10), Economy (11–30). */
const CABIN: ClassDef[] = [
  { cls: 'first', startRow: 1, endRow: 4, cols: ['A', 'B', 'E', 'F'], aisleAfter: ['B'], basePrice: 1200 },
  { cls: 'business', startRow: 5, endRow: 10, cols: ['A', 'B', 'C', 'D', 'E', 'F'], aisleAfter: ['B', 'D'], basePrice: 620 },
  { cls: 'economy', startRow: 11, endRow: 30, cols: ['A', 'B', 'C', 'D', 'E', 'F'], aisleAfter: ['C'], basePrice: 160 },
];

const EXIT_ROWS = new Set([11, 20]);
const BLOCKED = new Set(['9C', '13D', '17C', '24E']);

export interface CabinSection {
  cls: SeatClass;
  startRow: number;
  endRow: number;
}

export const CABIN_SECTIONS: CabinSection[] = CABIN.map((d) => ({
  cls: d.cls,
  startRow: d.startRow,
  endRow: d.endRow,
}));

function positionOf(col: string, def: ClassDef): SeatPosition {
  if (col === def.cols[0] || col === def.cols[def.cols.length - 1]) return 'window';
  const aisleSeats = new Set<string>();
  for (const a of def.aisleAfter) {
    aisleSeats.add(a);
    const idx = def.cols.indexOf(a);
    if (idx + 1 < def.cols.length) aisleSeats.add(def.cols[idx + 1]);
  }
  return aisleSeats.has(col) ? 'aisle' : 'middle';
}

function priceOf(def: ClassDef, pos: SeatPosition, isExit: boolean): number {
  let p = def.basePrice;
  if (pos === 'window') p += def.cls === 'economy' ? 35 : def.cls === 'business' ? 70 : 110;
  if (pos === 'aisle') p += def.cls === 'economy' ? 20 : 40;
  if (isExit) p += 30;
  return p;
}

/** Build the full seat list for the cabin. */
export function buildSeats(): Seat[] {
  const seats: Seat[] = [];
  for (const def of CABIN) {
    for (let row = def.startRow; row <= def.endRow; row++) {
      const isExit = EXIT_ROWS.has(row);
      for (const col of def.cols) {
        const id = `${row}${col}`;
        const position = positionOf(col, def);
        seats.push({
          id,
          row,
          column: col,
          seatClass: def.cls,
          status: BLOCKED.has(id) ? 'blocked' : 'available',
          price: priceOf(def, position, isExit),
          position,
          isExitRow: isExit,
        });
      }
    }
  }
  return seats;
}

/** Render order for one row of a class, with 'aisle' gap markers inserted. */
export function rowCells(seatClass: SeatClass): (string | 'aisle')[] {
  const def = CABIN.find((d) => d.cls === seatClass);
  if (!def) return [];
  const cells: (string | 'aisle')[] = [];
  for (const col of def.cols) {
    cells.push(col);
    if (def.aisleAfter.includes(col)) cells.push('aisle');
  }
  return cells;
}

export interface PreBooking {
  seatId: string;
  name: string;
  pnr: string;
  seatClass: SeatClass;
  priority: number;
  bookingTime: number;
}

const FIRST_NAMES = ['Aziz', 'Dilnoza', 'James', 'Maria', 'Chen', 'Aarav', 'Sofia', 'Omar', 'Yuki', 'Liam', 'Emma', 'Noah', 'Olivia', 'Ibrahim', 'Fatima', 'Hiroshi', 'Elena', 'David', 'Sara', 'Ravi'];
const LAST_NAMES = ['Karimov', 'Petrova', 'Smith', 'Garcia', 'Wang', 'Sharma', 'Rossi', 'Hassan', 'Tanaka', 'Brown', 'Johnson', 'Muller', 'Ali', 'Kim', 'Lopez', 'Nakamura', 'Ivanov', 'Cohen', 'Reddy', 'Yusupov'];

const PNR_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ0123456789';

/** Generate a 6-character PNR code. */
export function genPNR(rng: () => number = Math.random): string {
  let s = '';
  for (let i = 0; i < 6; i++) s += PNR_CHARS[Math.floor(rng() * PNR_CHARS.length)];
  return s;
}

/** Pick a random pair of names for a new passenger. */
export function genName(rng: () => number = Math.random): string {
  return `${pick(rng, FIRST_NAMES)} ${pick(rng, LAST_NAMES)}`;
}

/** Deterministic set of seats already booked when the cabin first loads. */
export function preBookings(seats: Seat[], count = 14, seed = 99): PreBooking[] {
  const rng = mulberry32(seed);
  const available = seats.filter((s) => s.status === 'available');
  const used = new Set<string>();
  const bookings: PreBooking[] = [];
  const baseTime = Date.now() - count * 60_000;
  for (let i = 0; i < count && available.length > 0; i++) {
    let seat = pick(rng, available);
    let guard = 0;
    while (used.has(seat.id) && guard < 60) {
      seat = pick(rng, available);
      guard++;
    }
    if (used.has(seat.id)) continue;
    used.add(seat.id);
    bookings.push({
      seatId: seat.id,
      name: genName(rng),
      pnr: genPNR(rng),
      seatClass: seat.seatClass,
      priority: CLASS_PRIORITY[seat.seatClass],
      bookingTime: baseTime + i * 60_000 + randInt(rng, 0, 30_000),
    });
  }
  return bookings;
}
