import type { FlightStatus } from '../../types/flight';
import { Badge, type BadgeTone } from './Badge';

const MAP: Record<FlightStatus, { tone: BadgeTone; label: string }> = {
  'on-time': { tone: 'green', label: 'On time' },
  scheduled: { tone: 'blue', label: 'Scheduled' },
  boarding: { tone: 'orange', label: 'Boarding' },
  delayed: { tone: 'red', label: 'Delayed' },
  cancelled: { tone: 'gray', label: 'Cancelled' },
};

export function StatusBadge({ status }: { status: FlightStatus }) {
  const { tone, label } = MAP[status];
  return <Badge tone={tone}>{label}</Badge>;
}
