"use client";
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { Input } from '../../components/ui/input';
import { Button } from '../../components/ui/button';

const schema = z.object({ email: z.string().email(), password: z.string().min(8), totp: z.string().optional() });
type Form = z.infer<typeof schema>;

export default function LoginPage() {
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<Form>({ resolver: zodResolver(schema) });
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (data: Form) => {
    setError(null);
    try {
      const res = await fetch(process.env.NEXT_PUBLIC_API_URL + '/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Login failed');
      const json = await res.json();
      sessionStorage.setItem('accessToken', json.accessToken);
      // Set short-lived cookie for middleware-based protection
      document.cookie = `aat=${json.accessToken}; Path=/; SameSite=Lax`;
      window.location.href = '/dashboard';
    } catch (e: any) {
      setError(e.message);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center p-4">
      <form onSubmit={handleSubmit(onSubmit)} className="w-full max-w-sm space-y-4">
        <h1 className="text-2xl font-semibold">Login</h1>
        {error && <p className="text-red-600">{error}</p>}
        <div className="space-y-1">
          <label className="block text-sm">Email</label>
          <Input type="email" {...register('email')} />
          {errors.email && <span className="text-xs text-red-600">{errors.email.message}</span>}
        </div>
        <div className="space-y-1">
          <label className="block text-sm">Password</label>
          <Input type="password" {...register('password')} />
          {errors.password && <span className="text-xs text-red-600">{errors.password.message}</span>}
        </div>
        <div className="space-y-1">
          <label className="block text-sm">TOTP (if 2FA enabled)</label>
          <Input type="text" placeholder="123456" {...register('totp')} />
        </div>
        <Button disabled={isSubmitting} className="w-full">
          {isSubmitting ? 'Signing in...' : 'Sign in'}
        </Button>
        <div className="text-center text-sm">
          <a className="text-blue-600 underline" href="/forgot-password">Forgot password?</a>
        </div>
      </form>
    </main>
  );
}


