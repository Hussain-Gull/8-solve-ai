import { clsx } from 'clsx';
import { ButtonHTMLAttributes } from 'react';

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'default' | 'ghost' | 'outline';
  size?: 'sm' | 'md';
};

export function Button({ className, variant = 'default', size = 'md', ...props }: Props) {
  const base = 'inline-flex items-center justify-center rounded text-sm font-medium transition-colors focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50';
  const variants = {
    default: 'bg-blue-600 text-white hover:bg-blue-700',
    ghost: 'hover:bg-slate-100 dark:hover:bg-slate-800',
    outline: 'border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800'
  } as const;
  const sizes = { sm: 'h-8 px-3', md: 'h-9 px-4' } as const;
  return <button className={clsx(base, variants[variant], sizes[size], className)} {...props} />;
}


