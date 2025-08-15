"use client";
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Input } from '../../components/ui/input';
import { Button } from '../../components/ui/button';
import { useState } from 'react';

const schema = z.object({ email: z.string().email() });
type Form = z.infer<typeof schema>;

export default function ForgotPasswordPage() {
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<Form>({ resolver: zodResolver(schema) });
  const [token, setToken] = useState<string | null>(null);
  return (
    <main className="mx-auto max-w-sm p-6">
      <h1 className="mb-4 text-xl font-semibold">Forgot Password</h1>
      <form onSubmit={handleSubmit(async (data) => {
        const res = await fetch(process.env.NEXT_PUBLIC_API_URL + '/auth/request-password-reset', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
        if (res.ok) { const j = await res.json(); setToken(j.token); }
      })} className="space-y-3">
        <div>
          <label className="block text-sm">Email</label>
          <Input {...register('email')} />
          {errors.email && <div className="text-xs text-red-600">{errors.email.message}</div>}
        </div>
        <Button disabled={isSubmitting}>Send reset link</Button>
      </form>
      {token && (
        <div className="mt-4 rounded border p-3 text-sm">
          Dev token (demo): {token}. Go to <a className="text-blue-600 underline" href={`/reset-password?token=${encodeURIComponent(token)}`}>reset page</a>.
        </div>
      )}
    </main>
  );
}


