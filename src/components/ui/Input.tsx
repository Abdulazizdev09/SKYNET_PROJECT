import type { InputHTMLAttributes, ReactNode } from 'react';

interface Props extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  icon?: ReactNode;
}

export function Input({ label, icon, className = '', ...rest }: Props) {
  return (
    <label className="block">
      {label && (
        <span className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-ink-600">
          {label}
        </span>
      )}
      <span className="relative flex items-center">
        {icon && <span className="pointer-events-none absolute left-3 text-ink-400">{icon}</span>}
        <input
          className={`w-full rounded-btn border border-ink-200 bg-ink-50 py-3 ${
            icon ? 'pl-10 pr-4' : 'px-4'
          } text-sm text-ink-900 outline-none transition-all duration-150 placeholder:text-ink-400 focus:border-primary focus:ring-[3px] focus:ring-[rgba(12,115,254,0.15)] ${className}`}
          {...rest}
        />
      </span>
    </label>
  );
}
