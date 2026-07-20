import type { ClassroomDoc, ClassroomFolder } from './types';

type Ctx = {
  apiBase: string;
  accessToken: string | null;
  classroomUid: string;
};

function authHeaders(ctx: Ctx): Record<string, string> {
  const h: Record<string, string> = {};
  if (ctx.accessToken) h['Authorization'] = `Bearer ${ctx.accessToken}`;
  return h;
}

function base(ctx: Ctx, path: string): string {
  return `${ctx.apiBase}/api/v1/space/course/classrooms/${ctx.classroomUid}/docs${path}`;
}

export async function fetchDocsTree(ctx: Ctx): Promise<{ folders: ClassroomFolder[]; docs_root: ClassroomDoc[] }> {
  const res = await fetch(base(ctx, '/?tree=1'), { headers: authHeaders(ctx) });
  if (!res.ok) throw new Error('Failed to fetch docs tree');
  return res.json();
}

export async function fetchDocsInFolder(ctx: Ctx, folderId: string): Promise<ClassroomDoc[]> {
  const res = await fetch(base(ctx, `/?folder_id=${encodeURIComponent(folderId)}`), { headers: authHeaders(ctx) });
  if (!res.ok) return [];
  const data = await res.json();
  return Array.isArray(data) ? data : data.results ?? [];
}

export async function createFolder(ctx: Ctx, data: { name: string; parent_folder_id?: string | null }): Promise<ClassroomFolder> {
  const res = await fetch(base(ctx, '/folders/'), {
    method: 'POST',
    headers: { ...authHeaders(ctx), 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to create folder');
  return res.json();
}

export async function updateFolder(ctx: Ctx, uid: string, data: { name: string }): Promise<ClassroomFolder> {
  const res = await fetch(base(ctx, `/folders/${uid}/`), {
    method: 'PATCH',
    headers: { ...authHeaders(ctx), 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to update folder');
  return res.json();
}

export async function deleteFolder(ctx: Ctx, uid: string): Promise<void> {
  const res = await fetch(base(ctx, `/folders/${uid}/`), {
    method: 'DELETE',
    headers: authHeaders(ctx),
  });
  if (!res.ok) throw new Error('Failed to delete folder');
}

export async function reorderDocs(ctx: Ctx, items: { uid: string; folder_id: string | null; order_index: number }[]): Promise<void> {
  const res = await fetch(base(ctx, '/reorder/'), {
    method: 'POST',
    headers: { ...authHeaders(ctx), 'Content-Type': 'application/json' },
    body: JSON.stringify({ items }),
  });
  if (!res.ok) throw new Error('Failed to reorder');
}

export async function uploadDoc(ctx: Ctx, file: File, meta: { section?: string; folder_id?: string | null }): Promise<ClassroomDoc> {
  const fd = new FormData();
  fd.append('file', file);
  if (meta.section) fd.append('section', meta.section);
  if (meta.folder_id) fd.append('folder_id', meta.folder_id);
  const res = await fetch(base(ctx, '/upload/'), {
    method: 'POST',
    headers: authHeaders(ctx),
    body: fd,
  });
  if (!res.ok) throw new Error('Failed to upload');
  return res.json();
}

export async function deleteDoc(ctx: Ctx, uid: string): Promise<void> {
  const res = await fetch(base(ctx, `/${uid}/`), {
    method: 'DELETE',
    headers: authHeaders(ctx),
  });
  if (!res.ok) throw new Error('Failed to delete doc');
}

export function sortDocs(docs: ClassroomDoc[], field: string, dir: string): ClassroomDoc[] {
  const sorted = [...docs].sort((a, b) => {
    const av = (a as any)[field];
    const bv = (b as any)[field];
    if (av == null && bv == null) return 0;
    if (av == null) return 1;
    if (bv == null) return -1;
    if (typeof av === 'string') return av.localeCompare(bv);
    return av - bv;
  });
  return dir === 'desc' ? sorted.reverse() : sorted;
}
