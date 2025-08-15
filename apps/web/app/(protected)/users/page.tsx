"use client";
import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Input } from '../../../components/ui/input';
import { Button } from '../../../components/ui/button';
import { Select } from '../../../components/ui/select';

type User = { id: string; email: string; name: string | null; role: string };

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [total, setTotal] = useState(0);
  const [q, setQ] = useState('');

  const schema = z.object({
    email: z.string().email(),
    name: z.string().min(1).optional(),
    password: z.string().min(8),
    role: z.enum(['ADMIN', 'MANAGER', 'USER']).default('USER'),
  });
  type Form = z.infer<typeof schema>;
  const { register, handleSubmit, reset, formState: { errors } } = useForm<Form>({ resolver: zodResolver(schema), defaultValues: { role: 'USER' } });

  useEffect(() => {
    (async () => {
      try {
        const accessToken = sessionStorage.getItem('accessToken');
        const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
        if (q) params.set('q', q);
        const res = await fetch(process.env.NEXT_PUBLIC_API_URL + '/users?' + params.toString(), { headers: { Authorization: `Bearer ${accessToken}` }, credentials: 'include' });
        if (!res.ok) throw new Error('Failed to load');
        const json = await res.json();
        if (json.items) { setUsers(json.items); setTotal(json.total); }
        else { setUsers(json); setTotal(json.length || 0); }
      } catch (e: any) { setError(e.message); }
    })();
  }, [page, pageSize, q]);

  if (error) return <div className="p-6">Error: {error}</div>;

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Users</h1>
      <div className="flex flex-col gap-3 rounded border p-4 md:flex-row md:items-end md:justify-between">
        <div className="w-full md:max-w-xs">
          <label className="block text-xs">Search</label>
          <Input placeholder="email or name" value={q} onChange={(e) => { setPage(1); setQ(e.target.value); }} />
        </div>
        <div className="flex items-center gap-2 text-sm">
          <span>Page size</span>
          <Select value={String(pageSize)} onChange={(e) => { setPage(1); setPageSize(Number(e.target.value)); }}>
            {[10,20,50,100].map(n => <option key={n} value={n}>{n}</option>)}
          </Select>
        </div>
      </div>
      <form onSubmit={handleSubmit(async (data) => {
        setSubmitting(true);
        try {
          const accessToken = sessionStorage.getItem('accessToken');
          const res = await fetch(process.env.NEXT_PUBLIC_API_URL + '/users', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
            credentials: 'include',
            body: JSON.stringify(data),
          });
          if (!res.ok) throw new Error('Failed to create user');
          reset();
          const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
          if (q) params.set('q', q);
          const list = await fetch(process.env.NEXT_PUBLIC_API_URL + '/users?' + params.toString(), { headers: { Authorization: `Bearer ${accessToken}` }, credentials: 'include' });
          if (list.ok) { const j = await list.json(); setUsers(j.items || j); }
        } catch (e: any) { alert(e.message); } finally { setSubmitting(false); }
      })} className="rounded border p-4">
        <div className="mb-2 font-medium">Create User</div>
        <div className="grid gap-2 md:grid-cols-4">
          <div>
            <label className="block text-xs">Email</label>
            <Input {...register('email')} />
            {errors.email && <div className="text-xs text-red-600">{errors.email.message}</div>}
          </div>
          <div>
            <label className="block text-xs">Name</label>
            <Input {...register('name')} />
          </div>
          <div>
            <label className="block text-xs">Password</label>
            <Input type="password" {...register('password')} />
            {errors.password && <div className="text-xs text-red-600">{errors.password.message}</div>}
          </div>
          <div>
            <label className="block text-xs">Role</label>
            <Select {...register('role')}>
              <option value="USER">USER</option>
              <option value="MANAGER">MANAGER</option>
              <option value="ADMIN">ADMIN</option>
            </Select>
          </div>
        </div>
        <div className="mt-3">
          <Button disabled={submitting} size="sm">{submitting ? 'Creating...' : 'Create'}</Button>
        </div>
      </form>
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left">
            <th className="border-b p-2">Email</th>
            <th className="border-b p-2">Name</th>
            <th className="border-b p-2">Role</th>
            <th className="border-b p-2"></th>
          </tr>
        </thead>
        <tbody>
          {users.map(u => (
            <tr key={u.id}>
              <td className="border-b p-2">{u.email}</td>
              <td className="border-b p-2">{u.name}</td>
              <td className="border-b p-2">{u.role}</td>
              <td className="border-b p-2 text-right"><a className="text-blue-600 underline" href={`/users/${u.id}`}>Edit</a></td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="flex items-center justify-between text-sm">
        <div>Total: {total}</div>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}>Prev</Button>
          <span>Page {page}</span>
          <Button size="sm" variant="outline" onClick={() => setPage((p) => p + 1)} disabled={page * pageSize >= total}>Next</Button>
        </div>
      </div>
    </div>
  );
}


