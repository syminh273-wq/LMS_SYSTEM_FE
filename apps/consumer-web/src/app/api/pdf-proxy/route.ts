import type { NextRequest } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Range, Content-Type',
    'Access-Control-Expose-Headers': 'Content-Length, Content-Range, Accept-Ranges, Content-Type',
    'Access-Control-Max-Age': '86400',
  } as const;
}

export function OPTIONS() {
  return new Response(null, { status: 204, headers: corsHeaders() });
}

export async function GET(req: NextRequest) {
  const target = req.nextUrl.searchParams.get('url');
  if (!target) {
    return new Response('Missing url', { status: 400, headers: corsHeaders() });
  }
  let parsed: URL;
  try {
    parsed = new URL(target);
    if (!/^https?:$/.test(parsed.protocol)) throw new Error('bad protocol');
  } catch {
    return new Response('Invalid url', { status: 400, headers: corsHeaders() });
  }

  const range = req.headers.get('range') ?? undefined;
  try {
    const upstream = await fetch(parsed.toString(), {
      headers: range ? { Range: range } : {},
      redirect: 'follow',
    });
    if (!upstream.ok && upstream.status !== 206) {
      return new Response(`Upstream ${upstream.status}`, {
        status: upstream.status,
        headers: corsHeaders(),
      });
    }

    const headers = new Headers(corsHeaders());
    headers.set('Content-Type', upstream.headers.get('content-type') ?? 'application/pdf');
    const len = upstream.headers.get('content-length');
    if (len) headers.set('Content-Length', len);
    const contentRange = upstream.headers.get('content-range');
    if (contentRange) headers.set('Content-Range', contentRange);
    headers.set('Accept-Ranges', upstream.headers.get('accept-ranges') ?? 'bytes');
    headers.set('Cache-Control', 'public, max-age=3600');

    return new Response(upstream.body, {
      status: upstream.status,
      headers,
    });
  } catch (err) {
    return new Response(
      `Proxy error: ${err instanceof Error ? err.message : String(err)}`,
      { status: 502, headers: corsHeaders() },
    );
  }
}
