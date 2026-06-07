import type { ButtonHTMLAttributes, ReactNode } from 'react';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  icon?: ReactNode;
}

const VARIANTS: Record<ButtonVariant, string> = {
  primary: 'bg-primary text-white hover:bg-primary-hover hover:shadow-btn',
  secondary: 'bg-primary-light text-primary hover:bg-[#D7E7FF]',
  ghost: 'bg-transparent border border-ink-200 text-ink-600 hover:bg-ink-50',
  danger: 'bg-danger text-white hover:opacity-90',
};

export function Button({ variant = 'primary', icon, children, className = '', ...rest }: Props) {
  return (
    <button
      className={`inline-flex items-center justify-center gap-2 rounded-btn px-5 py-3 text-sm font-semibold transition-all duration-150 disabled:cursor-not-allowed disabled:opacity-50 ${VARIANTS[variant]} ${className}`}
      {...rest}
    >
      {icon}
      {children}
    </button>
  );
}
