import './globals.css';
import type { ReactNode } from 'react';

export const metadata = {
  title: 'AI SaaS Admin',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen bg-white text-slate-900 dark:bg-slate-950 dark:text-slate-100">
        {children}
      </body>
    </html>
  );
}


