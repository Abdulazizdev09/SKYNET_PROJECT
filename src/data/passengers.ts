import type { Passenger, SeatClass } from '../types/passenger';
import { CLASS_PRIORITY } from '../types/passenger';
import { mulberry32, pick, randInt } from '../utils/random';
import { FIRST_NAMES, LAST_NAMES } from './names';
import { genPNR } from './cabin';
import { generateFlights } from './flights';

const CLASSES: SeatClass[] = ['economy', 'economy', 'economy', 'business', 'first'];
const COLS = ['A', 'B', 'C', 'D', 'E', 'F'];

/**
 * Deterministic passenger directory keyed by PNR. Loaded into a Hash Table for
 * the O(1) PNR lookup demo.
 */
export function generatePassengers(count = 120, seed = 7): Passenger[] {
  const rng = mulberry32(seed);
  const flights = generateFlights();
  const out: Passenger[] = [];
  const seen = new Set<string>();
  for (let i = 0; i < count; i++) {
    let pnr = genPNR(rng);
    let guard = 0;
    while (seen.has(pnr) && guard < 50) {
      pnr = genPNR(rng);
      guard++;
    }
    seen.add(pnr);
    const seatClass = pick(rng, CLASSES);
    const flight = pick(rng, flights);
    out.push({
      pnr,
      name: `${pick(rng, FIRST_NAMES)} ${pick(rng, LAST_NAMES)}`,
      seat: `${randInt(rng, 1, 30)}${pick(rng, COLS)}`,
      seatClass,
      priority: CLASS_PRIORITY[seatClass],
      flightIata: flight.flightIata,
      bookingTime: Date.now() - randInt(rng, 0, 72) * 3_600_000,
      status: 'checked-in',
    });
  }
  return out;
}
