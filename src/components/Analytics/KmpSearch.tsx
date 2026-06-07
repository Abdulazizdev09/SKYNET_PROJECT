import { useMemo, useState } from 'react';
import { ListChecks, Search as SearchIcon } from 'lucide-react';
import { KMP } from '../../dsa/KMP';
import { generateManifest } from '../../data/names';
import { Card } from '../ui/Card';
import { Input } from '../ui/Input';
import { Badge } from '../ui/Badge';

interface Segment {
  text: string;
  match: boolean;
}

export function KmpSearch() {
  const manifest = useMemo(() => generateManifest(500), []);
  const text = useMemo(() => manifest.join('\n'), [manifest]);
  const lower = useMemo(() => text.toLowerCase(), [text]);
  const [pattern, setPattern] = useState('Ali');
  const trimmed = pattern.trim();

  const result = useMemo(
    () =>
      trimmed.length > 0
        ? KMP.searchWithStats(lower, trimmed.toLowerCase())
        : { matches: [] as number[], failureTable: [] as number[], comparisons: 0 },
    [lower, trimmed],
  );

  const segments = useMemo<Segment[]>(() => {
    if (trimmed.length === 0 || result.matches.length === 0) return [{ text, match: false }];
    const L = trimmed.length;
    const segs: Segment[] = [];
    let last = 0;
    for (const pos of result.matches) {
      if (pos > last) segs.push({ text: text.slice(last, pos), match: false });
      segs.push({ text: text.slice(pos, pos + L), match: true });
      last = pos + L;
    }
    if (last < text.length) segs.push({ text: text.slice(last), match: false });
    return segs;
  }, [text, trimmed, result.matches]);

  return (
    <Card className="p-5">
      <div className="mb-4 flex items-center gap-2">
        <ListChecks size={18} className="text-primary" />
        <h3 className="text-sm font-bold text-ink-900">KMP Manifest Search</h3>
        <span className="text-xs text-ink-400">· {manifest.length} passengers · O(n + m)</span>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[320px_1fr]">
        <div className="flex flex-col gap-4">
          <Input
            label="Name pattern"
            icon={<SearchIcon size={15} />}
            placeholder="e.g. Ali"
            value={pattern}
            onChange={(e) => setPattern(e.target.value)}
          />

          <div className="flex flex-wrap gap-2">
            <Badge tone="green">{result.matches.length} matches</Badge>
            <Badge tone="blue">{result.comparisons} comparisons</Badge>
          </div>

          {/* Failure (LPS) table */}
          <div>
            <div className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-ink-600">
              Failure function (LPS)
            </div>
            {trimmed.length === 0 ? (
              <div className="rounded-chip bg-ink-50 px-3 py-3 text-xs text-ink-400">
                Type a pattern to build its LPS table
              </div>
            ) : (
              <div className="flex flex-wrap gap-1">
                {trimmed.split('').map((ch, i) => (
                  <div key={i} className="overflow-hidden rounded-chip border border-ink-200 text-center">
                    <div className="bg-ink-50 px-2 py-1 text-sm font-bold text-ink-900">{ch === ' ' ? '␣' : ch}</div>
                    <div className="px-2 py-0.5 text-xs font-semibold text-primary">{result.failureTable[i] ?? 0}</div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {result.matches.length > 0 && (
            <div className="text-[11px] text-ink-500">
              First positions:{' '}
              <span className="text-ink-700">
                {result.matches.slice(0, 12).join(', ')}
                {result.matches.length > 12 ? '…' : ''}
              </span>
            </div>
          )}
        </div>

        {/* Manifest with highlights */}
        <div className="h-80 overflow-auto whitespace-pre-wrap rounded-card border border-ink-100 bg-ink-50 p-4 text-sm leading-7 text-ink-700">
          {segments.map((seg, i) =>
            seg.match ? (
              <mark key={i} className="rounded bg-orange-light px-0.5 font-bold text-orange">
                {seg.text}
              </mark>
            ) : (
              <span key={i}>{seg.text}</span>
            ),
          )}
        </div>
      </div>
    </Card>
  );
}
