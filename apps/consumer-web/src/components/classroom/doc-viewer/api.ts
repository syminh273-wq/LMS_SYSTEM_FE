import type { DocNote, DocProgress, CreateNotePayload, UpdateNotePayload } from './types';

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

export async function fetchMyProgress(ctx: ApiCtx, resourceUid: string): Promise<DocProgress> {
  const res = await fetch(
    `${ctx.apiBase}/api/v1/consumer/course/classrooms/${ctx.classroomUid}/docs/${resourceUid}/progress/`,
    { headers: authHeaders(ctx.accessToken) },
  );
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return (await res.json()) as DocProgress;
}

export async function markCompleted(ctx: ApiCtx, resourceUid: string, is_completed = true): Promise<DocProgress> {
  const res = await fetch(
    `${ctx.apiBase}/api/v1/consumer/course/classrooms/${ctx.classroomUid}/docs/${resourceUid}/complete/`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders(ctx.accessToken) },
      body: JSON.stringify({ is_completed }),
    },
  );
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return (await res.json()) as DocProgress;
}

export async function listNotes(ctx: ApiCtx, resourceUid: string, onlyMine = true): Promise<DocNote[]> {
  const q = onlyMine ? '?only_mine=1' : '';
  const res = await fetch(
    `${ctx.apiBase}/api/v1/consumer/course/classrooms/${ctx.classroomUid}/docs/${resourceUid}/notes/${q}`,
    { headers: authHeaders(ctx.accessToken) },
  );
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return (await res.json()) as DocNote[];
}

export async function createNote(
  ctx: ApiCtx,
  resourceUid: string,
  payload: CreateNotePayload,
): Promise<DocNote> {
  const res = await fetch(
    `${ctx.apiBase}/api/v1/consumer/course/classrooms/${ctx.classroomUid}/docs/${resourceUid}/notes/`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders(ctx.accessToken) },
      body: JSON.stringify(payload),
    },
  );
  if (!res.ok) {
    const err = (await res.json().catch(() => ({}))) as Record<string, unknown>;
    throw new Error((err.error as string) || (err.message as string) || `HTTP ${res.status}`);
  }
  return (await res.json()) as DocNote;
}

export async function updateNote(
  ctx: ApiCtx,
  resourceUid: string,
  noteUid: string,
  payload: UpdateNotePayload,
): Promise<DocNote> {
  const res = await fetch(
    `${ctx.apiBase}/api/v1/consumer/course/classrooms/${ctx.classroomUid}/docs/${resourceUid}/notes/${noteUid}/`,
    {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', ...authHeaders(ctx.accessToken) },
      body: JSON.stringify(payload),
    },
  );
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return (await res.json()) as DocNote;
}

export async function deleteNote(ctx: ApiCtx, resourceUid: string, noteUid: string): Promise<void> {
  const res = await fetch(
    `${ctx.apiBase}/api/v1/consumer/course/classrooms/${ctx.classroomUid}/docs/${resourceUid}/notes/${noteUid}/`,
    { method: 'DELETE', headers: authHeaders(ctx.accessToken) },
  );
  if (!res.ok && res.status !== 204) throw new Error(`HTTP ${res.status}`);
}
