import type { NextRequest } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const UA =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';

function pickMeta(html: string, names: string[]): string | null {
  for (const name of names) {
    const re = new RegExp(
      `<meta[^>]+(?:name|property)=["']${name}["'][^>]*content=["']([^"']+)["']`,
      'i',
    );
    const m = html.match(re);
    if (m && m[1]) return m[1];
    const re2 = new RegExp(
      `<meta[^>]+content=["']([^"']+)["'][^>]*(?:name|property)=["']${name}["']`,
      'i',
    );
    const m2 = html.match(re2);
    if (m2 && m2[1]) return m2[1];
  }
  return null;
}

function absolutize(raw: string, base: string): string {
  try {
    return new URL(raw, base).toString();
  } catch {
    return raw;
  }
}

export async function GET(req: NextRequest) {
  const target = req.nextUrl.searchParams.get('url');
  if (!target) {
    return Response.json({ image: null }, { status: 400 });
  }
  let parsed: URL;
  try {
    parsed = new URL(target);
    if (!/^https?:$/.test(parsed.protocol)) throw new Error('bad protocol');
  } catch {
    return Response.json({ image: null }, { status: 400 });
  }

  try {
    const res = await fetch(parsed.toString(), {
      headers: {
        'User-Agent': UA,
        Accept: 'text/html,application/xhtml+xml',
      },
      redirect: 'follow',
      signal: AbortSignal.timeout(6000),
    });
    if (!res.ok) return Response.json({ image: null });
    const html = await res.text();

    const raw = pickMeta(html, [
      'og:image',
      'og:image:url',
      'og:image:secure_url',
      'twitter:image',
      'twitter:image:src',
    ]);
    if (!raw) return Response.json({ image: null });
    return Response.json({ image: absolutize(raw, parsed.toString()) });
  } catch {
    return Response.json({ image: null });
  }
}
