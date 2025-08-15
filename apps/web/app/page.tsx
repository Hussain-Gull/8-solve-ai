import Link from 'next/link';

export default function HomePage() {
  return (
    <main className="flex min-h-screen items-center justify-center">
      <div className="space-y-4 text-center">
        <h1 className="text-3xl font-bold">AI SaaS Admin</h1>
        <p>Go to the dashboard</p>
        <Link className="text-blue-600 underline" href="/login">Login</Link>
      </div>
    </main>
  );
}


