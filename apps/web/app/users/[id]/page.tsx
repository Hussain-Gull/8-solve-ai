"use client";
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Input } from '../../../components/ui/input';
import { Select } from '../../../components/ui/select';
import { Button } from '../../../components/ui/button';

const schema = z.object({
  email: z.string().email(),
  name: z.string().min(1).nullable().optional(),
  role: z.enum(['ADMIN', 'MANAGER', 'USER']).default('USER'),
});
type Form = z.infer<typeof schema>;

export default function EditUserPage() {
  const params = useParams();
  const router = useRouter();
  const userId = params?.id as string;
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { register, handleSubmit, setValue, formState: { errors, isSubmitting } } = useForm<Form>({ resolver: zodResolver(schema) });

  useEffect(() => {
    (async () => {
      try {
        const accessToken = sessionStorage.getItem('accessToken');
        const res = await fetch(process.env.NEXT_PUBLIC_API_URL + `/users/${userId}`, {
          headers: { Authorization: `Bearer ${accessToken}` },
          credentials: 'include'
        });
        if (!res.ok) throw new Error('Failed to load user');
        const u = await res.json();
        setValue('email', u.email);
        setValue('name', u.name ?? '');
        setValue('role', u.role);
      } catch (e: any) { setError(e.message); }
      finally { setLoading(false); }
    })();
  }, [userId, setValue]);

  const onSubmit = async (data: Form) => {
    const accessToken = sessionStorage.getItem('accessToken');
    const res = await fetch(process.env.NEXT_PUBLIC_API_URL + `/users/${userId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
      credentials: 'include',
      body: JSON.stringify(data)
    });
    if (!res.ok) { alert('Update failed'); return; }
    router.push('/users');
  };

  const onDelete = async () => {
    if (!confirm('Delete this user?')) return;
    const accessToken = sessionStorage.getItem('accessToken');
    const res = await fetch(process.env.NEXT_PUBLIC_API_URL + `/users/${userId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${accessToken}` },
      credentials: 'include'
    });
    if (!res.ok) { alert('Delete failed'); return; }
    router.push('/users');
  };

  if (loading) return <div className="p-6">Loading...</div>;
  if (error) return <div className="p-6">Error: {error}</div>;

  return (
    <div className="mx-auto max-w-xl space-y-4 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Edit User</h1>
        <Button variant="outline" size="sm" onClick={() => router.push('/users')}>Back</Button>
      </div>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-3 rounded border p-4">
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
          <label className="block text-xs">Role</label>
          <Select {...register('role')}>
            <option value="USER">USER</option>
            <option value="MANAGER">MANAGER</option>
            <option value="ADMIN">ADMIN</option>
          </Select>
        </div>
        <div className="flex items-center gap-2 pt-2">
          <Button disabled={isSubmitting}>Save</Button>
          <Button type="button" variant="outline" onClick={onDelete}>Delete</Button>
        </div>
      </form>
    </div>
  );
}


