import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { API_BASE_URL } from '@/lib/api';

// Proxy the game fetch so we can attach server-side auth (from cookies) and force no-store.
export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  
  if (!API_BASE_URL) {
    return NextResponse.json({ error: 'API base URL not configured' }, { status: 500 });
  }

  const cookieStore = await cookies();
  const authToken = cookieStore.get('authToken')?.value;

  const upstreamUrl = `${API_BASE_URL}/api/gameplay/games/${id}/`;

  try {
    const res = await fetch(upstreamUrl, {
      headers: authToken ? { Authorization: `Token ${authToken}` } : undefined,
      cache: 'no-store',
    });

    if (!res.ok) {
      return NextResponse.json({ error: 'Upstream fetch failed', status: res.status }, { status: res.status });
    }

    const data = await res.json();
    return NextResponse.json(data, { status: 200 });
  } catch (err) {
    return NextResponse.json({ error: 'Proxy error', detail: (err as Error).message }, { status: 500 });
  }
}
