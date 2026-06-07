import type { ReactNode } from 'react';

export type BadgeTone = 'blue' | 'orange' | 'green' | 'red' | 'yellow' | 'gray';

interface Props {
  children: ReactNode;
  tone?: BadgeTone;
  className?: string;
}

const TONES: Record<BadgeTone, string> = {
  blue: 'bg-primary-light text-primary',
  orange: 'bg-orange-light text-orange',
  green: 'bg-success-light text-success',
  red: 'bg-danger-light text-danger',
  yellow: 'bg-[#FFFBE6] text-warning',
  gray: 'bg-ink-50 text-ink-600',
};

export function Badge({ children, tone = 'gray', className = '' }: Props) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium ${TONES[tone]} ${className}`}
    >
      {children}
    </span>
  );
}
