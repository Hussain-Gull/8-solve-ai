"use client";
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Input } from '../../components/ui/input';
import { Button } from '../../components/ui/button';
import { useSearchParams } from 'next/navigation';

const schema = z.object({ newPassword: z.string().min(8) });
type Form = z.infer<typeof schema>;

export default function ResetPasswordPage() {
  const search = useSearchParams();
  const token = search.get('token') || '';
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<Form>({ resolver: zodResolver(schema) });
  return (
    <main className="mx-auto max-w-sm p-6">
      <h1 className="mb-4 text-xl font-semibold">Reset Password</h1>
      <form onSubmit={handleSubmit(async (data) => {
        await fetch(process.env.NEXT_PUBLIC_API_URL + '/auth/reset-password', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ token, ...data }) });
        window.location.href = '/login';
      })} className="space-y-3">
        <div>
          <label className="block text-sm">New Password</label>
          <Input type="password" {...register('newPassword')} />
          {errors.newPassword && <div className="text-xs text-red-600">{errors.newPassword.message}</div>}
        </div>
        <Button disabled={isSubmitting}>Update password</Button>
      </form>
    </main>
  );
}


