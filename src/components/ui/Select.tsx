import type { ReactNode, SelectHTMLAttributes } from 'react';

interface Props extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  children: ReactNode;
}

export function Select({ label, children, className = '', ...rest }: Props) {
  return (
    <label className="block">
      {label && (
        <span className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-ink-600">
          {label}
        </span>
      )}
      <select
        className={`w-full cursor-pointer rounded-btn border border-ink-200 bg-ink-50 px-4 py-3 text-sm text-ink-900 outline-none transition-all duration-150 focus:border-primary focus:ring-[3px] focus:ring-[rgba(12,115,254,0.15)] ${className}`}
        {...rest}
      >
        {children}
      </select>
    </label>
  );
}
