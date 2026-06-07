import { useEffect, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { Check, Crown, DollarSign, Lock, Ticket, Users, X } from 'lucide-react';
import { HashTable } from '../../dsa/HashTable';
import { MaxHeap } from '../../dsa/Heap';
import { Queue } from '../../dsa/Queue';
import { Stack } from '../../dsa/Stack';
import type { LuggageItem, Passenger, Seat, SeatClass } from '../../types/passenger';
import { CLASS_PRIORITY } from '../../types/passenger';
import { buildSeats, CABIN_SECTIONS, genName, genPNR, preBookings, rowCells } from '../../data/cabin';
import { formatNumber } from '../../utils/geo';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { BoardingQueue } from './BoardingQueue';
import { CargoHold } from './CargoHold';

const FLIGHT = 'HY312';

function classLabel(c: SeatClass): string {
  return c === 'first' ? 'First' : c === 'business' ? 'Business' : 'Economy';
}

function seatClasses(seat: Seat): string {
  switch (seat.status) {
    case 'blocked':
      return 'bg-ink-200 text-ink-400 cursor-not-allowed';
    case 'selected':
      return 'bg-success text-white ring-2 ring-success/40 animate-pulse';
    case 'booked':
      return 'bg-danger text-white hover:opacity-90';
    default:
      if (seat.seatClass === 'first') return 'bg-[#FBF1D5] text-[#8A6D1A] border border-gold/60 hover:bg-[#F6E6B8]';
      if (seat.seatClass === 'business') return 'bg-primary-light text-primary border border-primary/40 hover:bg-[#DCEAFF]';
      return 'bg-ink-50 text-ink-600 border border-ink-200 hover:bg-ink-100';
  }
}

function range(start: number, end: number): number[] {
  return Array.from({ length: end - start + 1 }, (_, i) => start + i);
}

export function CheckIn() {
  const hashRef = useRef<HashTable<Passenger> | null>(null);
  if (!hashRef.current) hashRef.current = new HashTable<Passenger>();
  const heapRef = useRef<MaxHeap<Passenger> | null>(null);
  if (!heapRef.current)
    heapRef.current = new MaxHeap<Passenger>((a, b) => a.priority - b.priority || b.bookingTime - a.bookingTime);
  const gateRef = useRef<Queue<Passenger> | null>(null);
  if (!gateRef.current) gateRef.current = new Queue<Passenger>();
  const cargoRef = useRef<Stack<LuggageItem> | null>(null);
  if (!cargoRef.current) cargoRef.current = new Stack<LuggageItem>();
  const seatPnrRef = useRef<Map<string, string>>(new Map());
  const luggageSeq = useRef(0);

  const hash = hashRef.current;
  const heap = heapRef.current;
  const gate = gateRef.current;
  const cargo = cargoRef.current;
  const seatPnr = seatPnrRef.current;

  const [seats, setSeats] = useState<Seat[]>(() => buildSeats());
  const [heapView, setHeapView] = useState<Passenger[]>([]);
  const [gateView, setGateView] = useState<Passenger[]>([]);
  const [cargoView, setCargoView] = useState<LuggageItem[]>([]);
  const [passengerCount, setPassengerCount] = useState(0);
  const [boardedCount, setBoardedCount] = useState(0);
  const [nowBoarding, setNowBoarding] = useState<Passenger | null>(null);
  const [modalSeat, setModalSeat] = useState<Seat | null>(null);
  const [pendingPnr, setPendingPnr] = useState('');
  const [nameInput, setNameInput] = useState('');
  const [infoPassenger, setInfoPassenger] = useState<Passenger | null>(null);

  const refresh = (): void => {
    setHeapView([...heap.toArray()]);
    setGateView([...gate.toArray()]);
    setCargoView([...cargo.toArray()]);
    setPassengerCount(hash.size);
  };

  useEffect(() => {
    const bookings = preBookings(buildSeats());
    setSeats((prev) =>
      prev.map((s) => (bookings.some((b) => b.seatId === s.id) ? { ...s, status: 'booked' } : s)),
    );
    for (const b of bookings) {
      const p: Passenger = {
        pnr: b.pnr,
        name: b.name,
        seat: b.seatId,
        seatClass: b.seatClass,
        priority: b.priority,
        flightIata: FLIGHT,
        bookingTime: b.bookingTime,
        status: 'checked-in',
      };
      hash.set(p.pnr, p);
      seatPnr.set(p.seat, p.pnr);
      heap.insert(p);
    }
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const stats = useMemo(() => {
    let booked = 0;
    let available = 0;
    let revenue = 0;
    for (const s of seats) {
      if (s.status === 'booked') {
        booked++;
        revenue += s.price;
      } else if (s.status === 'available' || s.status === 'selected') {
        available++;
      }
    }
    return { booked, available, revenue };
  }, [seats]);

  const rows = useMemo(() => {
    const m = new Map<number, Map<string, Seat>>();
    for (const s of seats) {
      if (!m.has(s.row)) m.set(s.row, new Map());
      m.get(s.row)!.set(s.column, s);
    }
    return m;
  }, [seats]);

  function onSeatClick(seat: Seat): void {
    if (seat.status === 'blocked') return;
    if (seat.status === 'booked') {
      const pnr = seatPnr.get(seat.id);
      const p = pnr ? hash.get(pnr) : undefined;
      if (p) {
        setInfoPassenger(p);
        setModalSeat(null);
      }
      return;
    }
    setInfoPassenger(null);
    setModalSeat(seat);
    setPendingPnr(genPNR());
    setNameInput('');
    setSeats((prev) =>
      prev.map((s) =>
        s.id === seat.id
          ? { ...s, status: 'selected' }
          : s.status === 'selected'
            ? { ...s, status: 'available' }
            : s,
      ),
    );
  }

  function cancelModal(): void {
    if (modalSeat) {
      setSeats((prev) =>
        prev.map((s) => (s.id === modalSeat.id && s.status === 'selected' ? { ...s, status: 'available' } : s)),
      );
    }
    setModalSeat(null);
  }

  function confirmBooking(): void {
    if (!modalSeat) return;
    const name = nameInput.trim() || genName();
    const p: Passenger = {
      pnr: pendingPnr,
      name,
      seat: modalSeat.id,
      seatClass: modalSeat.seatClass,
      priority: CLASS_PRIORITY[modalSeat.seatClass],
      flightIata: FLIGHT,
      bookingTime: Date.now(),
      status: 'checked-in',
    };
    hash.set(p.pnr, p);
    seatPnr.set(p.seat, p.pnr);
    heap.insert(p);
    setSeats((prev) => prev.map((s) => (s.id === modalSeat.id ? { ...s, status: 'booked' } : s)));
    setModalSeat(null);
    refresh();
  }

  function callNext(): void {
    const p = heap.extractMax();
    if (!p) return;
    setNowBoarding(p);
    gate.enqueue(p);
    refresh();
  }

  function boardFront(): void {
    const p = gate.dequeue();
    if (!p) return;
    setBoardedCount((c) => c + 1);
    if (nowBoarding && p.pnr === nowBoarding.pnr) setNowBoarding(null);
    refresh();
  }

  function loadLuggage(): void {
    luggageSeq.current += 1;
    const n = luggageSeq.current;
    cargo.push({ id: `L${n}`, tag: `BAG-${1000 + n}`, owner: genName(), weightKg: 8 + Math.round(Math.random() * 22) });
    refresh();
  }

  function unloadLuggage(): void {
    cargo.pop();
    refresh();
  }

  return (
    <div className="page-enter h-full overflow-auto p-6">
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_400px]">
        {/* ── Seat map column ─────────────────────────────────── */}
        <div className="flex flex-col gap-5">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <StatCard icon={<Ticket size={16} />} label="Booked" value={`${stats.booked}`} tone="red" />
            <StatCard icon={<Check size={16} />} label="Available" value={`${stats.available}`} tone="green" />
            <StatCard icon={<DollarSign size={16} />} label="Revenue" value={`$${formatNumber(stats.revenue)}`} tone="orange" />
            <StatCard icon={<Users size={16} />} label="Checked-in" value={`${passengerCount}`} tone="blue" />
          </div>

          <Card className="p-5">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Crown size={18} className="text-primary" />
                <h3 className="text-sm font-bold text-ink-900">Cabin · Flight {FLIGHT} (A320)</h3>
              </div>
              <div className="flex flex-wrap gap-3 text-[11px] text-ink-600">
                <Legend swatch="bg-[#FBF1D5] border border-gold/60" label="First" />
                <Legend swatch="bg-primary-light border border-primary/40" label="Business" />
                <Legend swatch="bg-ink-50 border border-ink-200" label="Economy" />
                <Legend swatch="bg-success" label="Selected" />
                <Legend swatch="bg-danger" label="Booked" />
                <Legend swatch="bg-ink-200" label="Blocked" />
              </div>
            </div>

            {/* Fuselage */}
            <div className="mx-auto max-w-[420px] rounded-t-[80px] rounded-b-3xl border border-ink-100 bg-white px-4 pb-6 pt-10">
              <div className="mb-4 text-center text-[10px] font-semibold uppercase tracking-widest text-ink-300">
                ✈ Cockpit
              </div>
              {CABIN_SECTIONS.map((sec) => (
                <div key={sec.cls} className="mb-4">
                  <div className="mb-2 flex items-center gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-wide text-ink-400">
                      {classLabel(sec.cls)} Class
                    </span>
                    <div className="h-px flex-1 bg-ink-100" />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    {range(sec.startRow, sec.endRow).map((row) => {
                      const rowSeats = rows.get(row);
                      const isExit = row === 11 || row === 20;
                      return (
                        <div
                          key={row}
                          className={`flex items-center gap-1 rounded-md ${isExit ? 'bg-success-light/60 px-1 py-0.5 ring-1 ring-success/40' : ''}`}
                        >
                          <span className="w-5 shrink-0 text-right text-[9px] font-semibold text-ink-400">
                            {row}
                          </span>
                          <div className="flex flex-1 items-center justify-center gap-1">
                            {rowCells(sec.cls).map((cell, idx) =>
                              cell === 'aisle' ? (
                                <div key={`a${idx}`} className="w-5" />
                              ) : (
                                (() => {
                                  const seat = rowSeats?.get(cell);
                                  if (!seat) return <div key={cell} className="h-7 w-7" />;
                                  return (
                                    <button
                                      key={seat.id}
                                      onClick={() => onSeatClick(seat)}
                                      title={`${seat.id} · ${classLabel(seat.seatClass)} · ${seat.position} · $${seat.price}`}
                                      className={`flex h-7 w-7 items-center justify-center rounded-md text-[10px] font-bold transition-all duration-150 ${seatClasses(seat)}`}
                                    >
                                      {seat.status === 'blocked' ? (
                                        <Lock size={11} />
                                      ) : seat.status === 'selected' ? (
                                        <Check size={12} />
                                      ) : (
                                        seat.column
                                      )}
                                    </button>
                                  );
                                })()
                              ),
                            )}
                          </div>
                          <span className="w-5 shrink-0 text-left text-[8px] font-bold text-success">
                            {isExit ? 'EXIT' : ''}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* ── Operations column ───────────────────────────────── */}
        <div className="flex flex-col gap-6">
          <BoardingQueue
            heap={heapView}
            gate={gateView}
            nowBoarding={nowBoarding}
            boardedCount={boardedCount}
            onCallNext={callNext}
            onBoardFront={boardFront}
          />
          <CargoHold items={cargoView} onLoad={loadLuggage} onUnload={unloadLuggage} />
        </div>
      </div>

      {/* ── Booking modal ───────────────────────────────────── */}
      {modalSeat && (
        <div
          className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/40 p-4"
          onClick={cancelModal}
        >
          <Card
            className="w-full max-w-sm animate-modal-in p-6"
            onClick={() => {}}
          >
            <div onClick={(e) => e.stopPropagation()}>
              <div className="mb-4 flex items-start justify-between">
                <div>
                  <h3 className="text-lg font-bold text-ink-900">Confirm booking</h3>
                  <p className="text-sm text-ink-600">
                    Seat {modalSeat.id} · {classLabel(modalSeat.seatClass)} ·{' '}
                    <span className="font-semibold text-orange">${modalSeat.price}</span>
                  </p>
                </div>
                <button onClick={cancelModal} className="text-ink-400 hover:text-ink-900" aria-label="Close">
                  <X size={18} />
                </button>
              </div>
              <Input
                label="Passenger name"
                placeholder="e.g. Aziz Karimov"
                value={nameInput}
                autoFocus
                onChange={(e) => setNameInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && confirmBooking()}
              />
              <div className="mt-4 flex items-center justify-between rounded-btn bg-ink-50 px-4 py-3">
                <span className="text-xs font-medium uppercase tracking-wide text-ink-600">PNR</span>
                <span className="text-base font-bold tracking-[0.2em] text-primary">{pendingPnr}</span>
              </div>
              <div className="mt-5 flex gap-2">
                <Button variant="ghost" className="flex-1" onClick={cancelModal}>
                  Cancel
                </Button>
                <Button className="flex-1" icon={<Check size={16} />} onClick={confirmBooking}>
                  Confirm
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* ── Passenger info (Hash Table lookup) ──────────────── */}
      {infoPassenger && (
        <div
          className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/40 p-4"
          onClick={() => setInfoPassenger(null)}
        >
          <Card className="w-full max-w-sm animate-modal-in p-6" onClick={() => {}}>
            <div onClick={(e) => e.stopPropagation()}>
              <div className="mb-3 flex items-start justify-between">
                <h3 className="text-lg font-bold text-ink-900">Passenger record</h3>
                <button onClick={() => setInfoPassenger(null)} className="text-ink-400 hover:text-ink-900" aria-label="Close">
                  <X size={18} />
                </button>
              </div>
              <div className="space-y-2 text-sm">
                <Row label="Name" value={infoPassenger.name} />
                <Row label="PNR" value={infoPassenger.pnr} mono />
                <Row label="Seat" value={`${infoPassenger.seat} · ${classLabel(infoPassenger.seatClass)}`} />
                <Row label="Flight" value={infoPassenger.flightIata} />
                <Row label="Priority" value={`${infoPassenger.priority}`} />
                <Row label="Booked" value={new Date(infoPassenger.bookingTime).toLocaleTimeString()} />
              </div>
              <div className="mt-4 flex items-center gap-2 rounded-btn bg-success-light px-3 py-2 text-xs text-success">
                <Check size={14} /> Retrieved from Hash Table in O(1)
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}

function StatCard({ icon, label, value, tone }: { icon: ReactNode; label: string; value: string; tone: 'red' | 'green' | 'orange' | 'blue' }) {
  const toneClass =
    tone === 'red' ? 'text-danger' : tone === 'green' ? 'text-success' : tone === 'orange' ? 'text-orange' : 'text-primary';
  return (
    <Card className="flex items-center gap-3 p-4">
      <span className={toneClass}>{icon}</span>
      <div>
        <div className="text-[10px] font-medium uppercase tracking-wide text-ink-400">{label}</div>
        <div className="text-lg font-bold text-ink-900">{value}</div>
      </div>
    </Card>
  );
}

function Legend({ swatch, label }: { swatch: string; label: string }) {
  return (
    <span className="flex items-center gap-1">
      <span className={`inline-block h-3 w-3 rounded ${swatch}`} />
      {label}
    </span>
  );
}

function Row({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-center justify-between border-b border-ink-100 pb-1.5">
      <span className="text-ink-600">{label}</span>
      <span className={`font-semibold text-ink-900 ${mono ? 'tracking-[0.15em]' : ''}`}>{value}</span>
    </div>
  );
}
