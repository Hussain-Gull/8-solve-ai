"use client";
import { useEffect, useState } from 'react';

type Me = { id: string; email: string; name: string | null; role: string; tenantId: string };

export default function ProfilePage() {
  const [me, setMe] = useState<Me | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const accessToken = sessionStorage.getItem('accessToken');
        const res = await fetch(process.env.NEXT_PUBLIC_API_URL + '/me', { headers: { Authorization: `Bearer ${accessToken}` }, credentials: 'include' });
        if (!res.ok) throw new Error('Failed to load');
        setMe(await res.json());
      } catch (e: any) { setError(e.message); }
    })();
  }, []);

  if (error) return <div className="p-6">Error: {error}</div>;
  if (!me) return <div className="p-6">Loading...</div>;

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Profile</h1>
      <div className="rounded border p-4 text-sm">
        <div><span className="font-medium">Email:</span> {me.email}</div>
        <div><span className="font-medium">Name:</span> {me.name || '-'}</div>
        <div><span className="font-medium">Role:</span> {me.role}</div>
        <div><span className="font-medium">Tenant:</span> {me.tenantId}</div>
      </div>
    </div>
  );
}


