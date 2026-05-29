import { redirect } from 'next/navigation';

// Giữ nguyên query params khi redirect (access, refresh, error tokens)
export default function Page({
  searchParams,
}: {
  searchParams: Record<string, string>;
}) {
  const query = new URLSearchParams(searchParams).toString();
  redirect(`/consumer/auth/callback${query ? `?${query}` : ''}`);
}
