import { InputHTMLAttributes, forwardRef } from 'react';
import { clsx } from 'clsx';

type Props = InputHTMLAttributes<HTMLInputElement>;

export const Input = forwardRef<HTMLInputElement, Props>(function Input({ className, ...props }, ref) {
  return (
    <input ref={ref} className={clsx('flex h-9 w-full rounded border border-slate-300 bg-white px-3 py-1 text-sm ring-offset-white placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:bg-slate-950 dark:ring-offset-slate-950 dark:placeholder:text-slate-400', className)} {...props} />
  );
});


