import type { ClassroomDoc, ClassroomFolder, DocsTreeResponse, SortField, SortDir } from './types';

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
    `${ctx.apiBase}/api/v1/space/course/classrooms/${ctx.classroomUid}/docs/tree/`,
    { headers: authHeaders(ctx.accessToken) },
  );
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return (await res.json()) as DocsTreeResponse;
}

export async function fetchDocsInFolder(
  ctx: ApiCtx,
  folderId: string | null,
): Promise<ClassroomDoc[]> {
  const q = folderId ? `?folder_id=${encodeURIComponent(folderId)}` : '?folder_id=';
  const res = await fetch(
    `${ctx.apiBase}/api/v1/space/course/classrooms/${ctx.classroomUid}/docs/${q}`,
    { headers: authHeaders(ctx.accessToken) },
  );
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return (await res.json()) as ClassroomDoc[];
}

export async function createFolder(
  ctx: ApiCtx,
  payload: { name: string; parent_folder_id?: string | null; color?: string | null; is_preview_only?: boolean },
): Promise<ClassroomFolder> {
  const res = await fetch(
    `${ctx.apiBase}/api/v1/space/course/classrooms/${ctx.classroomUid}/folders/`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders(ctx.accessToken) },
      body: JSON.stringify(payload),
    },
  );
  if (!res.ok) {
    const err = (await res.json().catch(() => ({}))) as Record<string, unknown>;
    throw new Error((err.message as string) || `HTTP ${res.status}`);
  }
  return (await res.json()) as ClassroomFolder;
}

export async function updateFolder(
  ctx: ApiCtx,
  folderUid: string,
  payload: Partial<{ name: string; parent_folder_id: string | null; order_index: number; color: string | null; is_preview_only: boolean }>,
): Promise<ClassroomFolder> {
  const res = await fetch(
    `${ctx.apiBase}/api/v1/space/course/classrooms/${ctx.classroomUid}/folders/${folderUid}/`,
    {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', ...authHeaders(ctx.accessToken) },
      body: JSON.stringify(payload),
    },
  );
  if (!res.ok) {
    const err = (await res.json().catch(() => ({}))) as Record<string, unknown>;
    throw new Error((err.message as string) || `HTTP ${res.status}`);
  }
  return (await res.json()) as ClassroomFolder;
}

export async function deleteFolder(ctx: ApiCtx, folderUid: string): Promise<void> {
  const res = await fetch(
    `${ctx.apiBase}/api/v1/space/course/classrooms/${ctx.classroomUid}/folders/${folderUid}/`,
    { method: 'DELETE', headers: authHeaders(ctx.accessToken) },
  );
  if (!res.ok && res.status !== 204) throw new Error(`HTTP ${res.status}`);
}

export async function reorderDocs(
  ctx: ApiCtx,
  items: Array<{ uid: string; folder_id?: string | null; order_index: number }>,
): Promise<void> {
  const res = await fetch(
    `${ctx.apiBase}/api/v1/space/course/classrooms/${ctx.classroomUid}/docs/reorder/`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders(ctx.accessToken) },
      body: JSON.stringify({ items }),
    },
  );
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
}

export async function uploadDoc(
  ctx: ApiCtx,
  file: File,
  options: { section?: string; folder_id?: string | null },
): Promise<ClassroomDoc> {
  const form = new FormData();
  form.append('file', file);
  if (options.section) form.append('section', options.section);
  if (options.folder_id) form.append('folder_id', options.folder_id);
  const res = await fetch(
    `${ctx.apiBase}/api/v1/space/course/classrooms/${ctx.classroomUid}/docs/`,
    {
      method: 'POST',
      headers: authHeaders(ctx.accessToken),
      body: form,
    },
  );
  if (!res.ok) {
    const err = (await res.json().catch(() => ({}))) as Record<string, unknown>;
    throw new Error((err.message as string) || `HTTP ${res.status}`);
  }
  return (await res.json()) as ClassroomDoc;
}

export async function deleteDoc(ctx: ApiCtx, docUid: string): Promise<void> {
  const res = await fetch(
    `${ctx.apiBase}/api/v1/space/course/classrooms/${ctx.classroomUid}/docs/${docUid}/`,
    { method: 'DELETE', headers: authHeaders(ctx.accessToken) },
  );
  if (!res.ok && res.status !== 204) throw new Error(`HTTP ${res.status}`);
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
