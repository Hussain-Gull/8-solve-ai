"use client";
import { useEffect, useState } from 'react';

type Me = { id: string; email: string; role: 'SUPER_ADMIN'|'ADMIN'|'MANAGER'|'USER'; tenantId: string };

export default function DashboardPage() {
  const [me, setMe] = useState<Me | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function authFetch(input: RequestInfo, init?: RequestInit) {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL as string;
    const accessToken = sessionStorage.getItem('accessToken');
    const res = await fetch(apiUrl + input, { ...(init || {}), headers: { ...(init?.headers || {}), Authorization: `Bearer ${accessToken}` }, credentials: 'include' });
    if (res.status === 401) {
      const refreshRes = await fetch(apiUrl + '/auth/refresh', { method: 'POST', credentials: 'include' });
      if (refreshRes.ok) {
        const json = await refreshRes.json();
        sessionStorage.setItem('accessToken', json.accessToken);
        return fetch(apiUrl + input, { ...(init || {}), headers: { ...(init?.headers || {}), Authorization: `Bearer ${json.accessToken}` }, credentials: 'include' });
      }
      sessionStorage.removeItem('accessToken');
      window.location.href = '/login';
      throw new Error('Unauthorized');
    }
    return res;
  }

  useEffect(() => {
    (async () => {
      try {
        const res = await authFetch('/me');
        if (!res.ok) throw new Error('Failed to load');
        setMe(await res.json());
      } catch (e: any) { setError(e.message); }
    })();
  }, []);

  if (error) return <div className="p-6">Error: {error}</div>;
  if (!me) return <div className="p-6">Loading...</div>;

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-semibold">Dashboard</h1>
      <div className="rounded border p-4">
        <div className="font-medium">Welcome, {me.email}</div>
        <div className="text-sm text-slate-600">Role: {me.role}</div>
      </div>
    </div>
  );
}


