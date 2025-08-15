"use client";
import { useEffect, useState } from 'react';

type Notification = { id: string; title: string; body?: string; read: boolean; createdAt: string };

export default function NotificationsPage() {
  const [items, setItems] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchItems = async () => {
    const accessToken = sessionStorage.getItem('accessToken');
    const res = await fetch(process.env.NEXT_PUBLIC_API_URL + '/notifications', {
      headers: { Authorization: `Bearer ${accessToken}` },
      credentials: 'include',
    });
    if (res.ok) setItems(await res.json());
    setLoading(false);
  };

  useEffect(() => { fetchItems(); }, []);

  const markRead = async (id: string) => {
    const accessToken = sessionStorage.getItem('accessToken');
    const res = await fetch(process.env.NEXT_PUBLIC_API_URL + `/notifications/${id}/read`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${accessToken}` },
      credentials: 'include',
    });
    if (res.ok) fetchItems();
  };

  if (loading) return <div className="p-6">Loading...</div>;

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Notifications</h1>
      <ul className="space-y-2">
        {items.map(n => (
          <li key={n.id} className="rounded border p-3">
            <div className="flex items-center justify-between">
              <div className="font-medium">{n.title}</div>
              {!n.read && <button onClick={() => markRead(n.id)} className="text-sm text-blue-600 underline">Mark read</button>}
            </div>
            {n.body && <div className="text-sm text-slate-600">{n.body}</div>}
            <div className="text-xs text-slate-500">{new Date(n.createdAt).toLocaleString()}</div>
          </li>
        ))}
      </ul>
    </div>
  );
}


