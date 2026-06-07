import { useState } from 'react';
import { ArrowDown, Boxes, CheckCircle2, Hash, KeyRound, XCircle } from 'lucide-react';
import type { HashTable } from '../../dsa/HashTable';
import type { Passenger } from '../../types/passenger';
import { Card } from '../ui/Card';
import { Input } from '../ui/Input';
import { Badge } from '../ui/Badge';

interface Props {
  table: HashTable<Passenger>;
  samples: string[];
}

interface Probe {
  key: string;
  hash: number;
  index: number;
  bucketSize: number;
  found: Passenger | null;
}

export function PnrLookup({ table, samples }: Props) {
  const [query, setQuery] = useState('');
  const [probe, setProbe] = useState<Probe | null>(null);

  function run(value: string): void {
    const key = value.trim().toUpperCase();
    setQuery(key);
    if (!key) {
      setProbe(null);
      return;
    }
    const result = table.probe(key);
    setProbe({ key, hash: result.hash, index: result.index, bucketSize: result.bucket.length, found: result.found });
  }

  return (
    <Card className="flex flex-col gap-4 p-5">
      <div className="flex items-center gap-2">
        <KeyRound size={18} className="text-primary" />
        <h3 className="text-sm font-bold text-ink-900">PNR Lookup · Hash Table O(1)</h3>
      </div>

      <Input
        label="Enter PNR code"
        icon={<Hash size={15} />}
        placeholder="e.g. SKY7Q2"
        value={query}
        onChange={(e) => run(e.target.value)}
      />

      <div className="flex flex-wrap gap-1.5">
        <span className="text-[11px] text-ink-400">Try:</span>
        {samples.map((s) => (
          <button
            key={s}
            onClick={() => run(s)}
            className="rounded-full bg-ink-50 px-2 py-0.5 text-[11px] font-semibold tracking-wider text-primary transition-colors hover:bg-primary-light"
          >
            {s}
          </button>
        ))}
      </div>

      {probe && (
        <div className="animate-fade-in space-y-2">
          {/* Hash computation steps */}
          <Step label="Input key" value={probe.key} mono />
          <Arrow text="hash(key)" />
          <Step label="Hash value" value={probe.hash.toLocaleString()} />
          <Arrow text={`mod ${table.getCapacity()}`} />
          <Step label="Bucket index" value={`#${probe.index}`} accent />
          <Arrow text={`bucket has ${probe.bucketSize} ${probe.bucketSize === 1 ? 'entry' : 'entries'}`} icon />

          {probe.found ? (
            <div className="rounded-card border border-success/30 bg-success-light p-4">
              <div className="mb-2 flex items-center gap-2 text-success">
                <CheckCircle2 size={16} />
                <span className="text-xs font-bold uppercase tracking-wide">Match found</span>
              </div>
              <div className="text-base font-bold text-ink-900">{probe.found.name}</div>
              <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
                <Field label="Seat" value={probe.found.seat} />
                <Field label="Class" value={probe.found.seatClass} />
                <Field label="Flight" value={probe.found.flightIata} />
                <Field label="Priority" value={`${probe.found.priority}`} />
              </div>
              <div className="mt-2">
                <Badge tone="green">{probe.found.status}</Badge>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2 rounded-card border border-danger/30 bg-danger-light p-4 text-sm text-danger">
              <XCircle size={16} /> No passenger with PNR “{probe.key}”
            </div>
          )}
        </div>
      )}
    </Card>
  );
}

function Step({ label, value, accent = false, mono = false }: { label: string; value: string; accent?: boolean; mono?: boolean }) {
  return (
    <div className="flex items-center justify-between rounded-chip bg-ink-50 px-3 py-2">
      <span className="text-[11px] font-medium uppercase tracking-wide text-ink-600">{label}</span>
      <span className={`text-sm font-bold ${accent ? 'text-primary' : 'text-ink-900'} ${mono ? 'tracking-[0.15em]' : ''}`}>
        {value}
      </span>
    </div>
  );
}

function Arrow({ text, icon = false }: { text: string; icon?: boolean }) {
  return (
    <div className="flex items-center justify-center gap-1 text-[10px] text-ink-400">
      {icon ? <Boxes size={11} /> : <ArrowDown size={11} />} {text}
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <span className="text-ink-400">{label}: </span>
      <span className="font-semibold text-ink-900">{value}</span>
    </div>
  );
}
