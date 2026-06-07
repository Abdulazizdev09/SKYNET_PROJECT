import { useEffect, useMemo, useState } from 'react';
import { Award, Play, RotateCcw, Zap } from 'lucide-react';
import { Sorting, type SortFrame, type SortRun } from '../../dsa/Sorting';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';

interface Props {
  values: number[];
}

function barColor(i: number, frame: SortFrame): string {
  if (frame.sorted.includes(i)) return '#00C176';
  if (frame.swapping.includes(i)) return '#F5222D';
  if (frame.comparing.includes(i)) return '#FAAD14';
  return '#9BA3B2';
}

function countUpTo(frames: SortFrame[], idx: number): { comparisons: number; swaps: number } {
  let comparisons = 0;
  let swaps = 0;
  for (let i = 0; i <= idx && i < frames.length; i++) {
    if (frames[i].comparing.length > 0) comparisons++;
    if (frames[i].swapping.length > 0) swaps++;
  }
  return { comparisons, swaps };
}

export function SortRace({ values }: Props) {
  const qRun = useMemo<SortRun>(() => Sorting.quickSortSteps(values), [values]);
  const mRun = useMemo<SortRun>(() => Sorting.mergeSortSteps(values), [values]);

  const measured = useMemo(() => {
    const reps = 400;
    const cmp = (a: number, b: number): number => a - b;
    let t0 = performance.now();
    for (let i = 0; i < reps; i++) Sorting.quickSort(values, cmp);
    const q = (performance.now() - t0) / reps;
    t0 = performance.now();
    for (let i = 0; i < reps; i++) Sorting.mergeSort(values, cmp);
    const m = (performance.now() - t0) / reps;
    return { q, m };
  }, [values]);

  const [qIdx, setQIdx] = useState(0);
  const [mIdx, setMIdx] = useState(0);
  const [running, setRunning] = useState(false);
  const [started, setStarted] = useState(false);

  const lastQ = qRun.frames.length - 1;
  const lastM = mRun.frames.length - 1;

  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => {
      setQIdx((v) => Math.min(v + 1, lastQ));
      setMIdx((v) => Math.min(v + 1, lastM));
    }, 45);
    return () => clearInterval(id);
  }, [running, lastQ, lastM]);

  useEffect(() => {
    if (running && qIdx >= lastQ && mIdx >= lastM) setRunning(false);
  }, [running, qIdx, mIdx, lastQ, lastM]);

  function start(): void {
    setQIdx(0);
    setMIdx(0);
    setStarted(true);
    setRunning(true);
  }
  function reset(): void {
    setRunning(false);
    setQIdx(0);
    setMIdx(0);
    setStarted(false);
  }

  const qFrame = qRun.frames[qIdx];
  const mFrame = mRun.frames[mIdx];
  const qLive = countUpTo(qRun.frames, qIdx);
  const mLive = countUpTo(mRun.frames, mIdx);
  const done = started && !running && qIdx >= lastQ && mIdx >= lastM;
  const winner = measured.q <= measured.m ? 'QuickSort' : 'MergeSort';
  const maxVal = Math.max(...values, 1);

  return (
    <Card className="p-5">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Zap size={18} className="text-primary" />
          <h3 className="text-sm font-bold text-ink-900">Sort Race · departure time (min since midnight)</h3>
        </div>
        <div className="flex gap-2">
          <Button icon={<Play size={15} />} className="!py-2.5" onClick={start} disabled={running}>
            {running ? 'Sorting…' : 'Sort'}
          </Button>
          <Button variant="ghost" icon={<RotateCcw size={15} />} className="!py-2.5" onClick={reset}>
            Reset
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        <Panel
          title="QuickSort"
          subtitle="O(n log n) avg · in-place"
          frame={qFrame}
          maxVal={maxVal}
          steps={qIdx}
          totalSteps={lastQ}
          comparisons={qLive.comparisons}
          swaps={qLive.swaps}
          micros={measured.q}
        />
        <Panel
          title="MergeSort"
          subtitle="O(n log n) always · stable"
          frame={mFrame}
          maxVal={maxVal}
          steps={mIdx}
          totalSteps={lastM}
          comparisons={mLive.comparisons}
          swaps={mLive.swaps}
          micros={measured.m}
        />
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-ink-600">
        <LegendDot color="#9BA3B2" label="unsorted" />
        <LegendDot color="#FAAD14" label="comparing" />
        <LegendDot color="#F5222D" label="swapping" />
        <LegendDot color="#00C176" label="sorted" />
      </div>

      {done && (
        <div className="mt-4 flex items-center gap-2 rounded-card border border-success/30 bg-success-light p-3 text-sm">
          <Award size={18} className="text-success" />
          <span className="text-ink-900">
            Winner: <span className="font-bold text-success">{winner}</span> — faster on this dataset (
            {measured.q.toFixed(3)} µs vs {measured.m.toFixed(3)} µs). MergeSort did{' '}
            {mRun.stats.comparisons} comparisons, QuickSort {qRun.stats.comparisons}.
          </span>
        </div>
      )}
    </Card>
  );
}

function Panel({
  title,
  subtitle,
  frame,
  maxVal,
  steps,
  totalSteps,
  comparisons,
  swaps,
  micros,
}: {
  title: string;
  subtitle: string;
  frame: SortFrame;
  maxVal: number;
  steps: number;
  totalSteps: number;
  comparisons: number;
  swaps: number;
  micros: number;
}) {
  return (
    <div className="rounded-card border border-ink-100 p-4">
      <div className="mb-3 flex items-center justify-between">
        <div>
          <div className="text-sm font-bold text-ink-900">{title}</div>
          <div className="text-[11px] text-ink-400">{subtitle}</div>
        </div>
        <Badge tone="blue">{micros.toFixed(3)} µs</Badge>
      </div>
      <div className="flex h-44 items-end gap-[3px]">
        {frame.array.map((v, i) => (
          <div
            key={i}
            className="flex-1 rounded-t-sm transition-all duration-100"
            style={{ height: `${(v / maxVal) * 100}%`, background: barColor(i, frame) }}
            title={`${v}`}
          />
        ))}
      </div>
      <div className="mt-3 grid grid-cols-3 gap-2 text-center">
        <Metric label="Steps" value={`${steps}/${totalSteps}`} />
        <Metric label="Comparisons" value={`${comparisons}`} />
        <Metric label="Writes" value={`${swaps}`} />
      </div>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-chip bg-ink-50 py-2">
      <div className="text-sm font-bold text-ink-900">{value}</div>
      <div className="text-[10px] uppercase tracking-wide text-ink-400">{label}</div>
    </div>
  );
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <span className="flex items-center gap-1">
      <span className="inline-block h-3 w-3 rounded" style={{ background: color }} />
      {label}
    </span>
  );
}
