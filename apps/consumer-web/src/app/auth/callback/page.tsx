import { redirect } from 'next/navigation';

// Giữ nguyên query params khi redirect (access, refresh, error tokens)
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const flat: Record<string, string> = {};
  for (const [k, v] of Object.entries(sp ?? {})) {
    if (v == null) continue;
    flat[k] = Array.isArray(v) ? v.join(',') : String(v);
  }
  const query = new URLSearchParams(flat).toString();
  redirect(`/consumer/auth/callback${query ? `?${query}` : ''}`);
}
