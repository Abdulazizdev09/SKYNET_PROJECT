import { ArrowRight, Crown, PlayCircle, Users } from 'lucide-react';
import type { Passenger, SeatClass } from '../../types/passenger';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';

interface Props {
  heap: Passenger[];
  gate: Passenger[];
  nowBoarding: Passenger | null;
  boardedCount: number;
  onCallNext: () => void;
  onBoardFront: () => void;
}

function classColor(c: SeatClass): string {
  return c === 'first' ? '#D4AF37' : c === 'business' ? '#0C73FE' : '#9BA3B2';
}
function classLabel(c: SeatClass): string {
  return c === 'first' ? 'First' : c === 'business' ? 'Business' : 'Economy';
}
function initials(name: string): string {
  return name
    .split(' ')
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

/** SVG binary-tree visualisation of the MaxHeap (root = next to board). */
function HeapTree({ nodes }: { nodes: Passenger[] }) {
  if (nodes.length === 0) {
    return (
      <div className="flex h-32 items-center justify-center rounded-chip bg-ink-50 text-xs text-ink-400">
        Heap empty — book passengers to populate the priority queue
      </div>
    );
  }
  const count = Math.min(nodes.length, 31);
  const depth = Math.floor(Math.log2(count)) + 1;
  const width = 360;
  const levelH = 62;
  const r = 17;
  const height = depth * levelH + 8;

  const pos = (i: number): { x: number; y: number } => {
    const d = Math.floor(Math.log2(i + 1));
    const slots = 2 ** d;
    const idx = i - (slots - 1);
    return { x: ((idx + 0.5) / slots) * width, y: d * levelH + r + 4 };
  };

  return (
    <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} className="overflow-visible">
      {/* edges */}
      {Array.from({ length: count }, (_, i) => i)
        .filter((i) => i > 0)
        .map((i) => {
          const p = pos(Math.floor((i - 1) / 2));
          const c = pos(i);
          return <line key={`e${i}`} x1={p.x} y1={p.y} x2={c.x} y2={c.y} stroke="#D9DCE3" strokeWidth={1.5} />;
        })}
      {/* nodes */}
      {Array.from({ length: count }, (_, i) => i).map((i) => {
        const { x, y } = pos(i);
        const p = nodes[i];
        return (
          <g key={`n${i}`}>
            <circle cx={x} cy={y} r={r} fill={i === 0 ? classColor(p.seatClass) : '#fff'} stroke={classColor(p.seatClass)} strokeWidth={2} />
            <text x={x} y={y + 3.5} textAnchor="middle" fontSize={10} fontWeight={700} fill={i === 0 ? '#fff' : '#1A1E27'}>
              {initials(p.name)}
            </text>
            <text x={x} y={y + r + 11} textAnchor="middle" fontSize={8} fontWeight={600} fill="#5A6478">
              P{p.priority}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

export function BoardingQueue({ heap, gate, nowBoarding, boardedCount, onCallNext, onBoardFront }: Props) {
  return (
    <Card className="flex flex-col gap-4 p-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Crown size={18} className="text-primary" />
          <h3 className="text-sm font-bold text-ink-900">Priority Boarding · MaxHeap</h3>
        </div>
        <Badge tone="blue">{heap.length} waiting</Badge>
      </div>

      <HeapTree nodes={heap} />

      <Button
        icon={<PlayCircle size={16} />}
        className="w-full"
        onClick={onCallNext}
        disabled={heap.length === 0}
      >
        Call Next Passenger
      </Button>

      {/* Now boarding */}
      {nowBoarding && (
        <div
          key={nowBoarding.pnr}
          className="animate-slide-out-top rounded-card border border-primary/30 bg-primary-light p-3"
        >
          <div className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-primary">
            Now boarding
          </div>
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-bold text-ink-900">{nowBoarding.name}</div>
              <div className="text-xs text-ink-600">
                Seat {nowBoarding.seat} · {classLabel(nowBoarding.seatClass)}
              </div>
            </div>
            <span
              className="rounded-full px-2 py-1 text-[10px] font-bold text-white"
              style={{ background: classColor(nowBoarding.seatClass) }}
            >
              PRIORITY {nowBoarding.priority}
            </span>
          </div>
        </div>
      )}

      {/* FIFO gate queue */}
      <div>
        <div className="mb-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users size={15} className="text-ink-600" />
            <span className="text-xs font-semibold uppercase tracking-wide text-ink-600">
              Gate Queue · FIFO
            </span>
          </div>
          <span className="text-xs text-ink-400">{boardedCount} boarded</span>
        </div>
        {gate.length === 0 ? (
          <div className="rounded-chip bg-ink-50 px-3 py-3 text-center text-xs text-ink-400">
            No passengers at the gate yet
          </div>
        ) : (
          <div className="flex items-stretch gap-2 overflow-x-auto pb-1">
            {gate.map((p, i) => (
              <div
                key={p.pnr}
                className="flex min-w-[110px] shrink-0 flex-col rounded-chip border border-ink-100 bg-white px-3 py-2"
              >
                <span className="text-[10px] font-medium text-ink-400">
                  {i === 0 ? 'FRONT →' : `#${i + 1}`}
                </span>
                <span className="truncate text-xs font-bold text-ink-900">{p.name}</span>
                <span className="text-[10px] text-ink-600">
                  {p.seat} · {classLabel(p.seatClass)}
                </span>
              </div>
            ))}
          </div>
        )}
        <Button
          variant="ghost"
          icon={<ArrowRight size={14} />}
          className="mt-2 w-full !py-2"
          onClick={onBoardFront}
          disabled={gate.length === 0}
        >
          Board Front of Queue
        </Button>
      </div>
    </Card>
  );
}
