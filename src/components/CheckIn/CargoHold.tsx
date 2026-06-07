import { Luggage, Plus, Minus } from 'lucide-react';
import type { LuggageItem } from '../../types/passenger';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';

interface Props {
  items: LuggageItem[];
  onLoad: () => void;
  onUnload: () => void;
}

const COLORS = ['#0C73FE', '#FF6D00', '#00C176', '#FAAD14', '#5A6478', '#D4AF37'];

export function CargoHold({ items, onLoad, onUnload }: Props) {
  // items is bottom→top; render reversed so the LIFO top sits at the visual top.
  const topDown = [...items].reverse();
  return (
    <Card className="flex flex-col gap-3 p-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Luggage size={18} className="text-primary" />
          <h3 className="text-sm font-bold text-ink-900">Cargo Hold · LIFO Stack</h3>
        </div>
        <Badge tone="blue">{items.length} loaded</Badge>
      </div>

      <div className="flex min-h-[160px] flex-col justify-end gap-1.5 rounded-card bg-ink-50 p-3">
        {topDown.length === 0 ? (
          <div className="flex h-full items-center justify-center text-xs text-ink-400">
            Hold empty — load luggage to push onto the stack
          </div>
        ) : (
          topDown.map((item, i) => (
            <div
              key={item.id}
              className="flex animate-fade-in items-center justify-between rounded-chip px-3 py-2 text-white shadow-sm"
              style={{ background: COLORS[(topDown.length - 1 - i) % COLORS.length] }}
            >
              <div className="flex items-center gap-2">
                <Luggage size={14} />
                <span className="text-xs font-bold">{item.tag}</span>
                {i === 0 && (
                  <span className="rounded-full bg-white/25 px-1.5 text-[9px] font-bold">TOP</span>
                )}
              </div>
              <span className="text-[10px] opacity-90">{item.weightKg} kg</span>
            </div>
          ))
        )}
      </div>

      <div className="grid grid-cols-2 gap-2">
        <Button icon={<Plus size={15} />} className="!py-2.5" onClick={onLoad}>
          Load
        </Button>
        <Button
          variant="ghost"
          icon={<Minus size={15} />}
          className="!py-2.5"
          onClick={onUnload}
          disabled={items.length === 0}
        >
          Unload
        </Button>
      </div>
    </Card>
  );
}
