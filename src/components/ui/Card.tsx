import type { ReactNode } from 'react';

interface Props {
  children: ReactNode;
  className?: string;
  hover?: boolean;
  onClick?: () => void;
}

export function Card({ children, className = '', hover = false, onClick }: Props) {
  return (
    <div
      onClick={onClick}
      className={`rounded-card border border-ink-100 bg-white shadow-card ${
        hover ? 'cursor-pointer transition-all duration-150 hover:-translate-y-0.5 hover:shadow-card-hover' : ''
      } ${className}`}
    >
      {children}
    </div>
  );
}
