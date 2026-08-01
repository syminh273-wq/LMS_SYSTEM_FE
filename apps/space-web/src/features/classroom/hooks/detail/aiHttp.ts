export function getAiApiBase() {
  return process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
}

export function getAiAuthHeaders(extra?: Record<string, string>): Record<string, string> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
  const headers: Record<string, string> = { ...extra };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  return headers;
}
