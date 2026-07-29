import type { ClassroomDoc, DocsTreeResponse, SortField, SortDir } from './types';

export type ApiCtx = {
  apiBase: string;
  accessToken: string | null;
  classroomUid: string;
};

const authHeaders = (token: string | null): Record<string, string> => {
  const h: Record<string, string> = {};
  if (token) h['Authorization'] = `Bearer ${token}`;
  return h;
};

export async function fetchDocsTree(ctx: ApiCtx): Promise<DocsTreeResponse> {
  const res = await fetch(
    `${ctx.apiBase}/api/v1/consumer/course/classrooms/${ctx.classroomUid}/docs/tree/`,
    { headers: authHeaders(ctx.accessToken) },
  );
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return (await res.json()) as DocsTreeResponse;
}

export function sortDocs(docs: ClassroomDoc[], field: SortField, dir: SortDir): ClassroomDoc[] {
  const sign = dir === 'asc' ? 1 : -1;
  return [...docs].sort((a, b) => {
    const av = (a[field] ?? '') as string | number;
    const bv = (b[field] ?? '') as string | number;
    if (av < bv) return -1 * sign;
    if (av > bv) return 1 * sign;
    return 0;
  });
}
