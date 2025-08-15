export async function authFetch(path: string, init?: RequestInit): Promise<Response> {
  const api = process.env.NEXT_PUBLIC_API_URL as string;
  const token = typeof window !== 'undefined' ? sessionStorage.getItem('accessToken') : undefined;
  const res = await fetch(api + path, {
    ...(init || {}),
    headers: { ...(init?.headers || {}), ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    credentials: 'include',
  });
  if (res.status !== 401) return res;
  const rr = await fetch(api + '/auth/refresh', { method: 'POST', credentials: 'include' });
  if (!rr.ok) {
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('accessToken');
      document.cookie = 'aat=; Max-Age=0; Path=/;';
      window.location.href = '/login';
    }
    throw new Error('Unauthorized');
  }
  const json = await rr.json();
  if (typeof window !== 'undefined') {
    sessionStorage.setItem('accessToken', json.accessToken);
    document.cookie = `aat=${json.accessToken}; Path=/; SameSite=Lax`;
  }
  return fetch(api + path, {
    ...(init || {}),
    headers: { ...(init?.headers || {}), Authorization: `Bearer ${json.accessToken}` },
    credentials: 'include',
  });
}


