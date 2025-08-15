"use client";
import { useEffect, useState } from 'react';

type User = { id: string; email: string; name: string | null; role: string };

export default function TeamPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const accessToken = sessionStorage.getItem('accessToken');
        const res = await fetch(process.env.NEXT_PUBLIC_API_URL + '/users/team', { headers: { Authorization: `Bearer ${accessToken}` }, credentials: 'include' });
        if (!res.ok) throw new Error('Failed to load');
        setUsers(await res.json());
      } catch (e: any) { setError(e.message); }
    })();
  }, []);

  if (error) return <div className="p-6">Error: {error}</div>;

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Team</h1>
      <ul className="space-y-1 text-sm">
        {users.map(u => <li key={u.id}>{u.name || u.email} – {u.role}</li>)}
      </ul>
    </div>
  );
}


