import { SelectHTMLAttributes, forwardRef } from 'react';
import { clsx } from 'clsx';

type Props = SelectHTMLAttributes<HTMLSelectElement>;

export const Select = forwardRef<HTMLSelectElement, Props>(function Select({ className, ...props }, ref) {
  return (
    <select ref={ref} className={clsx('flex h-9 w-full rounded border border-slate-300 bg-white px-3 py-1 text-sm ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:bg-slate-950 dark:ring-offset-slate-950', className)} {...props} />
  );
});


