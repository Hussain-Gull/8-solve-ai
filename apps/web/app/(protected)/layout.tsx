"use client";
import Link from 'next/link';
import { useEffect, useState } from 'react';

type Me = { id: string; email: string; role: 'SUPER_ADMIN'|'ADMIN'|'MANAGER'|'USER'; tenantId: string };

export default function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const [me, setMe] = useState<Me | null>(null);
  const [collapsed, setCollapsed] = useState<boolean>(false);
  const [theme, setTheme] = useState<'light' | 'dark'>(() => (typeof window !== 'undefined' && localStorage.getItem('theme') === 'dark') ? 'dark' : 'light');
  const [unread, setUnread] = useState<number>(0);

  // bootstrap auth + profile
  useEffect(() => {
    const token = sessionStorage.getItem('accessToken');
    if (!token) { window.location.href = '/login'; return; }
    fetch(process.env.NEXT_PUBLIC_API_URL + '/me', { headers: { Authorization: `Bearer ${token}` }, credentials: 'include' })
      .then(async (r) => {
        if (r.status === 401) {
          const rr = await fetch(process.env.NEXT_PUBLIC_API_URL + '/auth/refresh', { method: 'POST', credentials: 'include' });
          if (rr.ok) {
            const json = await rr.json();
            sessionStorage.setItem('accessToken', json.accessToken);
            document.cookie = `aat=${json.accessToken}; Path=/; SameSite=Lax`;
            const meRes = await fetch(process.env.NEXT_PUBLIC_API_URL + '/me', { headers: { Authorization: `Bearer ${json.accessToken}` }, credentials: 'include' });
            if (meRes.ok) setMe(await meRes.json()); else window.location.href = '/login';
          } else window.location.href = '/login';
        } else setMe(await r.json());
      });
  }, []);

  // sidebar state
  useEffect(() => {
    const saved = typeof window !== 'undefined' ? localStorage.getItem('sidebar:collapsed') : null;
    if (saved) setCollapsed(saved === '1');
  }, []);
  useEffect(() => {
    if (typeof window !== 'undefined') localStorage.setItem('sidebar:collapsed', collapsed ? '1' : '0');
  }, [collapsed]);

  // theme state
  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.classList.toggle('dark', theme === 'dark');
      localStorage.setItem('theme', theme);
    }
  }, [theme]);

  // notifications badge
  useEffect(() => {
    async function load() {
      const t = sessionStorage.getItem('accessToken');
      if (!t) return;
      const res = await fetch(process.env.NEXT_PUBLIC_API_URL + '/notifications', { headers: { Authorization: `Bearer ${t}` }, credentials: 'include' });
      if (res.ok) {
        const items: Array<{ read: boolean }> = await res.json();
        setUnread(items.filter(i => !i.read).length);
      }
    }
    load();
  }, [me?.id]);

  if (!me) return <div className="p-6">Loading...</div>;

  const nav = [
    { href: '/dashboard', label: 'Dashboard', roles: ['SUPER_ADMIN','ADMIN','MANAGER','USER'] },
    { href: '/users', label: 'Users', roles: ['ADMIN'] },
    { href: '/team', label: 'Team', roles: ['ADMIN','MANAGER'] },
    { href: '/notifications', label: 'Notifications', roles: ['SUPER_ADMIN','ADMIN','MANAGER','USER'] },
    { href: '/profile', label: 'Profile', roles: ['SUPER_ADMIN','ADMIN','MANAGER','USER'] },
  ];

  const items = nav.filter(n => n.roles.includes(me.role));

  return (
    <div className="min-h-screen">
      <header className="flex items-center justify-between border-b p-4">
        <div className="flex items-center gap-3">
          <button aria-label="Toggle sidebar" onClick={() => setCollapsed((v) => !v)} className="rounded border px-2 py-1 text-sm">{collapsed ? 'Expand' : 'Collapse'}</button>
          <div className="font-semibold">AI SaaS Admin</div>
        </div>
        <div className="flex items-center gap-4 text-sm">
          <button onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} className="rounded border px-2 py-1">{theme === 'dark' ? 'Light' : 'Dark'}</button>
          <Link href="/notifications" className="relative rounded border px-3 py-1">
            Notifications
            {unread > 0 && (
              <span className="absolute -right-2 -top-2 inline-flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-red-600 px-1 text-xs text-white">{unread}</span>
            )}
          </Link>
          <span>{me.email}</span>
          <button onClick={async () => {
            await fetch(process.env.NEXT_PUBLIC_API_URL + '/auth/logout', { method: 'POST', headers: { Authorization: `Bearer ${sessionStorage.getItem('accessToken')}` }, credentials: 'include' });
            sessionStorage.removeItem('accessToken');
            document.cookie = 'aat=; Max-Age=0; Path=/;';
            window.location.href = '/login';
          }} className="rounded border px-3 py-1">Logout</button>
        </div>
      </header>
      <div className="flex">
        <aside className={`${collapsed ? 'w-14' : 'w-56'} transition-all duration-200 shrink-0 border-r p-4`}> 
          <nav className="flex flex-col gap-2">
            {items.map(i => <Link key={i.href} href={i.href} className="text-sm hover:underline">{i.label}</Link>)}
          </nav>
        </aside>
        <main className="flex-1 p-4">{children}</main>
      </div>
    </div>
  );
}


