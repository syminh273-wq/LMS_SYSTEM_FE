'use client';

import * as React from 'react';
import { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  CheckCircle2,
  Circle,
  StickyNote,
  Loader2,
  Download,
  ChevronLeft,
  ChevronRight,
  MapPin,
} from 'lucide-react';
import { Button } from '@shared/components/ui/button';
import { toast } from 'sonner';
import {
  fetchMyProgress,
  markCompleted,
  createNote,
  updateNote,
  deleteNote,
  listNotes,
} from './api';
import type { ApiCtx } from './api';
import type { ClassroomDoc } from '../docs-viewer/types';
import type { DocNote, DocProgress } from './types';
import { isImageFile, isPdfFile, NOTE_COLORS } from './utils';
import { NoteEditor } from './NoteEditor';

type Props = {
  doc: ClassroomDoc;
  ctx: ApiCtx;
  open: boolean;
  onClose: () => void;
  onProgressChange?: (p: DocProgress) => void;
  t: (key: string, fallback?: string) => string;
};

type PendingNote = {
  x_pct: number;
  y_pct: number;
  page?: number | null;
};

export function DocViewerPanel({ doc, ctx, open, onClose, onProgressChange, t }: Props) {
  const [progress, setProgress] = useState<DocProgress | null>(null);
  const [notes, setNotes] = useState<DocNote[]>([]);
  const [loading, setLoading] = useState(false);
  const [noteMode, setNoteMode] = useState(false);
  const [pendingNote, setPendingNote] = useState<PendingNote | null>(null);
  const [editingNote, setEditingNote] = useState<DocNote | null>(null);
  const [imageSize, setImageSize] = useState<{ w: number; h: number } | null>(null);
  const [pdfPage, setPdfPage] = useState(1);
  const imageRef = useRef<HTMLImageElement>(null);
  const pdfWrapperRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const [editorPortal, setEditorPortal] = useState<{
    mode: 'create' | 'edit';
    x_pct: number;
    y_pct: number;
    left: number;
    top: number;
    note?: DocNote;
  } | null>(null);

  const imageable = isImageFile(doc.file_type);
  const pdfable = isPdfFile(doc.file_type);

  const onProgressChangeRef = useRef(onProgressChange);
  const ctxRef = useRef(ctx);
  const docUidRef = useRef(doc.uid);

  useEffect(() => {
    onProgressChangeRef.current = onProgressChange;
    ctxRef.current = ctx;
    docUidRef.current = doc.uid;
  });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [p, ns] = await Promise.all([fetchMyProgress(ctxRef.current, docUidRef.current, true), listNotes(ctxRef.current, docUidRef.current, true)]);
      setProgress(p);
      setNotes(ns);
      onProgressChangeRef.current?.(p);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Lỗi tải tiến trình');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!open) return;
    /* eslint-disable react-hooks/set-state-in-effect -- Open-panel sync: load data and reset local UI state. */
    void load();
    setNoteMode(false);
    setPendingNote(null);
    setEditingNote(null);
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [open, doc.uid, load]);

  const handleComplete = async () => {
    try {
      const newVal = !progress?.is_completed;
      const p = await markCompleted(ctxRef.current, docUidRef.current, newVal);
      setProgress(p);
      onProgressChangeRef.current?.(p);
      toast.success(newVal ? t('doc_viewer.completed', 'Đã đánh dấu hoàn thành') : t('doc_viewer.uncompleted', 'Đã bỏ hoàn thành'));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Lỗi');
    }
  };

  const handleImageClick = (e: React.MouseEvent<HTMLImageElement>) => {
    if (!noteMode || !imageRef.current) return;
    const rect = imageRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    if (x < 0 || x > 1 || y < 0 || y > 1) return;
    setPendingNote({ x_pct: x, y_pct: y, page: null });
    openEditorPortal('create', x, y, imageRef.current);
  };

  const handlePdfWrapperClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!noteMode || !pdfWrapperRef.current) return;
    const rect = pdfWrapperRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    if (x < 0 || x > 1 || y < 0 || y > 1) return;
    if ((e.target as HTMLElement).closest('button')) return;
    setPendingNote({ x_pct: x, y_pct: y, page: pdfPage });
    openEditorPortal('create', x, y, pdfWrapperRef.current);
  };

  const jumpToNote = (note: DocNote) => {
    if (note.page != null) {
      setPdfPage(note.page);
    }
    setEditingNote(note);
    setPendingNote(null);
    const anchor = pdfable ? pdfWrapperRef.current : imageRef.current;
    openEditorPortal('edit', note.x_pct ?? 0, note.y_pct ?? 0, anchor, note);
  };

  const openEditorPortal = (
    mode: 'create' | 'edit',
    x_pct: number,
    y_pct: number,
    anchor: HTMLElement | null,
    note?: DocNote,
  ) => {
    if (!anchor) return;
    const rect = anchor.getBoundingClientRect();
    const EDITOR_W = 288;
    const EDITOR_H = 230;
    const GAP = 8;
    const rawLeft = rect.left + x_pct * rect.width;
    const rawTop = rect.top + y_pct * rect.height;
    const left = Math.max(8, Math.min(window.innerWidth - EDITOR_W - 8, rawLeft));
    const top = Math.max(8, rawTop - EDITOR_H - GAP);
    setEditorPortal({ mode, x_pct, y_pct, left, top, note });
  };

  const closeEditorPortal = () => setEditorPortal(null);

  const handleCreateNote = async (data: { content: string; color: string }) => {
    if (!editorPortal || editorPortal.mode !== 'create') return;
    try {
      const note = await createNote(ctxRef.current, docUidRef.current, {
        content: data.content,
        x_pct: editorPortal.x_pct,
        y_pct: editorPortal.y_pct,
        page: pendingNote?.page ?? null,
        color: data.color,
      });
      setNotes((prev) => {
        const next = [note, ...prev];
        syncLocalProgress(next);
        return next;
      });
      setPendingNote(null);
      setEditorPortal(null);
      setNoteMode(false);
      toast.success(t('doc_viewer.note_saved', 'Đã lưu note'));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Lỗi lưu note');
    }
  };

  const handleEditNote = async (data: { content: string; color: string }) => {
    if (!editorPortal || editorPortal.mode !== 'edit' || !editorPortal.note) return;
    const note = editorPortal.note;
    try {
      const updated = await updateNote(ctxRef.current, docUidRef.current, note.uid, {
        content: data.content,
        color: data.color,
        x_pct: note.x_pct,
        y_pct: note.y_pct,
        page: note.page,
      });
      setNotes((prev) => {
        const next = prev.map((n) => (n.uid === updated.uid ? updated : n));
        syncLocalProgress(next);
        return next;
      });
      setEditingNote(null);
      setEditorPortal(null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Lỗi cập nhật note');
    }
  };

  const handleDeleteNote = async (note: DocNote) => {
    if (!window.confirm(t('doc_viewer.confirm_delete_note', 'Xóa note này?'))) return;
    try {
      await deleteNote(ctxRef.current, docUidRef.current, note.uid);
      setNotes((prev) => {
        const next = prev.filter((n) => n.uid !== note.uid);
        syncLocalProgress(next);
        return next;
      });
      setEditingNote(null);
      setEditorPortal(null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Lỗi xóa note');
    }
  };

  const syncLocalProgress = (nextNotes: DocNote[]) => {
    setProgress((prev: DocProgress | null) => {
      const isCompleted = prev?.is_completed ?? false;
      let maxOffset = 0;
      let maxPage = 1;
      for (const n of nextNotes) {
        const y = typeof n.y_pct === 'number' ? n.y_pct : null;
        if (y == null) continue;
        const clamped = Math.max(0, Math.min(1, y));
        const page = n.page ?? 1;
        if (page > maxPage) maxPage = page;
        const offset = (page - 1) + clamped;
        if (offset > maxOffset) maxOffset = offset;
      }
      const ratio = maxPage > 0 ? maxOffset / maxPage : 0;
      const derivedPct = Math.min(99, Math.round(ratio * 100));
      const finalPct = isCompleted ? 100 : derivedPct;
      const next: DocProgress = {
        classroom_id: doc.uid,
        student_id: prev?.student_id ?? '',
        resource_uid: doc.uid,
        read_progress: finalPct,
        is_completed: isCompleted,
        note_count: nextNotes.length,
        completed_at: prev?.completed_at ?? null,
        last_opened_at: prev?.last_opened_at ?? null,
      };
      return next;
    });
    /* Defer parent notification outside of the render cycle. */
    queueMicrotask(() => {
      setProgress((current: DocProgress | null) => {
        if (current) onProgressChangeRef.current?.(current);
        return current;
      });
    });
  };

  const progressPct = progress?.read_progress ?? 0;
  const isCompleted = progress?.is_completed ?? false;

  const notesForView = useMemo(() => {
    if (pdfable) {
      return notes.filter((n) => (n.page ?? 1) === pdfPage);
    }
    return notes;
  }, [notes, pdfable, pdfPage]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        ref={panelRef}
        className="bg-white rounded-3xl shadow-2xl w-full max-w-6xl h-[90vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top bar */}
        <div className="flex items-center gap-2 px-4 py-3 border-b border-slate-200 bg-slate-50">
          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold text-slate-900 truncate" title={doc.name}>
              {doc.name}
            </p>
            <div className="flex items-center gap-2 mt-1">
              <div className="flex-1 max-w-xs h-1.5 bg-slate-200 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all ${
                    isCompleted ? 'bg-emerald-500' : 'bg-indigo-500'
                  }`}
                  style={{ width: `${progressPct}%` }}
                />
              </div>
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                {progressPct}% · {notes.length} note
              </span>
            </div>
          </div>

          {imageable && (
            <Button
              size="sm"
              variant={noteMode ? 'default' : 'outline'}
              className="h-8 text-xs"
              onClick={() => {
                setNoteMode((v) => !v);
                setPendingNote(null);
                setEditingNote(null);
              }}
            >
              <StickyNote size={13} className="mr-1" />
              {noteMode
                ? t('doc_viewer.cancel_note', 'Huỷ Note')
                : t('doc_viewer.take_note', 'Take Note')}
            </Button>
          )}

          {pdfable && (
            <Button
              size="sm"
              variant={noteMode ? 'default' : 'outline'}
              className="h-8 text-xs"
              onClick={() => {
                setNoteMode((v) => !v);
                setPendingNote(null);
                setEditingNote(null);
              }}
            >
              <StickyNote size={13} className="mr-1" />
              {noteMode
                ? t('doc_viewer.cancel_note', 'Huỷ Note')
                : t('doc_viewer.take_note', 'Take Note')}
            </Button>
          )}

          <Button
            size="sm"
            variant={isCompleted ? 'default' : 'outline'}
            className={`h-8 text-xs ${isCompleted ? 'bg-emerald-600 hover:bg-emerald-700' : ''}`}
            onClick={handleComplete}
          >
            {isCompleted ? (
              <CheckCircle2 size={13} className="mr-1" />
            ) : (
              <Circle size={13} className="mr-1" />
            )}
            {isCompleted
              ? t('doc_viewer.done', 'Đã hoàn thành')
              : t('doc_viewer.mark_done', 'Hoàn thành')}
          </Button>

          <a
            href={doc.url}
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 rounded-md hover:bg-slate-200 text-slate-600"
            title="Mở file gốc"
          >
            <Download size={14} />
          </a>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-md hover:bg-slate-200 text-slate-600"
            title="Đóng"
          >
            <X size={16} />
          </button>
        </div>

        {noteMode && imageable && (
          <div className="px-4 py-2 bg-yellow-50 border-b border-yellow-200 text-xs text-yellow-800 font-medium">
            {t('doc_viewer.note_hint', 'Bấm vào vị trí bất kỳ trên ảnh để tạo note.')}
          </div>
        )}

        <div className="flex-1 min-h-0 flex flex-col md:flex-row">
          {/* Viewer */}
          <div className="flex-1 min-w-0 min-h-0 overflow-auto bg-slate-100 p-4 relative">
            {loading && (
              <div className="absolute inset-0 flex items-center justify-center bg-white/70 z-10">
                <Loader2 className="w-6 h-6 animate-spin text-indigo-600" />
              </div>
            )}

            {imageable && (
              <div className="relative inline-block mx-auto" style={{ maxWidth: '100%' }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  ref={imageRef}
                  src={doc.url}
                  alt={doc.name}
                  onClick={handleImageClick}
                  onLoad={(e) => {
                    const img = e.currentTarget;
                    setImageSize({ w: img.naturalWidth, h: img.naturalHeight });
                  }}
                  className={`max-w-full max-h-[70vh] object-contain shadow-lg rounded-md ${
                    noteMode ? 'cursor-crosshair' : 'cursor-default'
                  }`}
                  draggable={false}
                />
                {/* Note dots overlay */}
                {imageSize && (
                  <div className="absolute inset-0 pointer-events-none">
                    {notes.map((n) => {
                      if (n.x_pct == null || n.y_pct == null) return null;
                      const left = `${n.x_pct * 100}%`;
                      const top = `${n.y_pct * 100}%`;
                      const colorCls = NOTE_COLORS[n.color] || NOTE_COLORS.yellow;
                      return (
                        <button
                          key={n.uid}
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingNote(n);
                            setPendingNote(null);
                          }}
                          className={`absolute -translate-x-1/2 -translate-y-1/2 w-7 h-7 rounded-full ${colorCls} text-[10px] font-black shadow-lg ring-2 ring-white pointer-events-auto cursor-pointer hover:scale-110 transition`}
                          style={{ left, top }}
                          title={n.content}
                        >
                          N
                        </button>
                      );
                    })}

                    {pendingNote && null}
                  </div>
                )}

                {editingNote && (editingNote.x_pct != null) && null}
              </div>
            )}

            {pdfable && (
              <div className="flex flex-col h-full min-h-0">
                <div className="flex items-center gap-2 mb-2 text-xs text-slate-600">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setPdfPage((p) => Math.max(1, p - 1))}
                    disabled={pdfPage <= 1}
                  >
                    <ChevronLeft size={14} />
                  </Button>
                  <span>Trang {pdfPage}</span>
                  <Button size="sm" variant="ghost" onClick={() => setPdfPage((p) => p + 1)}>
                    <ChevronRight size={14} />
                  </Button>
                  {notes.length > 0 && (
                    <span className="ml-2 text-[10px] text-slate-500 font-bold">
                      {notes.length} note trên tài liệu
                    </span>
                  )}
                </div>
                <div
                  ref={pdfWrapperRef}
                  onClick={handlePdfWrapperClick}
                  className={`relative flex-1 min-h-0 bg-slate-200 rounded-md overflow-hidden ${
                    noteMode ? 'cursor-crosshair' : 'cursor-default'
                  }`}
                >
                  <iframe
                    key={pdfPage}
                    src={`${doc.url}#page=${pdfPage}&toolbar=0&navpanes=0`}
                    className="w-full h-full pointer-events-none"
                    title={doc.name}
                  />

                  {notesForView.map((n) => {
                    if (n.x_pct == null || n.y_pct == null) return null;
                    const left = `${n.x_pct * 100}%`;
                    const top = `${n.y_pct * 100}%`;
                    const colorCls = NOTE_COLORS[n.color] || NOTE_COLORS.yellow;
                    return (
                      <button
                        key={n.uid}
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          jumpToNote(n);
                        }}
                        className={`absolute -translate-x-1/2 -translate-y-1/2 w-7 h-7 rounded-full ${colorCls} text-[10px] font-black shadow-lg ring-2 ring-white pointer-events-auto cursor-pointer hover:scale-110 transition z-10`}
                        style={{ left, top }}
                        title={`Trang ${n.page ?? 1} — ${n.content}`}
                      >
                        N{n.page ?? 1}
                      </button>
                    );
                  })}

                  {null}
                </div>
              </div>
            )}

            {!imageable && !pdfable && (
              <div className="flex flex-col items-center justify-center h-full text-slate-500 text-sm">
                <p className="mb-2 font-bold">{t('doc_viewer.no_viewer', 'File này không hỗ trợ xem trực tiếp.')}</p>
                <a href={doc.url} target="_blank" rel="noopener noreferrer" className="text-indigo-600 underline">
                  {t('doc_viewer.open_raw', 'Mở file gốc')}
                </a>
              </div>
            )}
          </div>

          {/* Notes side panel (image + pdf) */}
          {(imageable || pdfable) && (
            <div className="w-full md:w-72 border-t md:border-t-0 md:border-l border-slate-200 bg-white flex flex-col max-h-[40vh] md:max-h-none">
              <div className="px-4 py-3 border-b border-slate-200 flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                  {t('doc_viewer.notes_title', 'Ghi chú của tôi')} ({notes.length})
                </span>
                {pdfable && notes.length > 0 && (
                  <span className="text-[10px] text-slate-400">
                    {new Set(notes.map((n) => n.page ?? 1)).size} trang có note
                  </span>
                )}
              </div>
              <div className="flex-1 overflow-y-auto p-3 space-y-2">
                {notes.length === 0 ? (
                  <p className="text-xs text-slate-400 text-center py-6">
                    {t('doc_viewer.no_notes', 'Chưa có ghi chú.')}
                  </p>
                ) : (
                  notes.map((n) => {
                    const colorCls = NOTE_COLORS[n.color] || NOTE_COLORS.yellow;
                    const isCurrentPage = pdfable && (n.page ?? 1) === pdfPage;
                    return (
                      <button
                        key={n.uid}
                        type="button"
                        onClick={() => jumpToNote(n)}
                        className={`w-full text-left p-2 rounded-lg border transition group ${
                          isCurrentPage
                            ? 'border-indigo-300 bg-indigo-50/40'
                            : 'border-slate-200 hover:border-indigo-300'
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`w-4 h-4 rounded-full ${colorCls}`} />
                          {pdfable && n.page != null && (
                            <span className="text-[10px] font-black text-indigo-600 flex items-center gap-0.5">
                              <MapPin size={9} />
                              Trang {n.page}
                            </span>
                          )}
                          <span className="text-[10px] font-bold text-slate-500">
                            {Math.round((n.progress_at ?? 0) * 100)}%
                          </span>
                          <span className="ml-auto text-[10px] text-slate-400">
                            {n.created_at ? new Date(n.created_at).toLocaleDateString('vi-VN') : ''}
                          </span>
                        </div>
                        <p className="text-xs text-slate-700 line-clamp-3">{n.content}</p>
                      </button>
                    );
                  })
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {editorPortal && createPortal(
        <div
          className="fixed z-[60]"
          style={{ left: editorPortal.left, top: editorPortal.top, width: 288 }}
          onClick={(e) => e.stopPropagation()}
        >
          {editorPortal.mode === 'create' ? (
            <NoteEditor
              mode="create"
              positionHint={{
                x_pct: editorPortal.x_pct,
                y_pct: editorPortal.y_pct,
                page: pendingNote?.page ?? null,
              }}
              onSubmit={handleCreateNote}
              onCancel={closeEditorPortal}
            />
          ) : (
            <NoteEditor
              mode="edit"
              existingNote={editorPortal.note}
              initialContent={editorPortal.note?.content}
              initialColor={editorPortal.note?.color ?? 'yellow'}
              positionHint={
                editorPortal.note
                  ? {
                      x_pct: editorPortal.note.x_pct ?? 0,
                      y_pct: editorPortal.note.y_pct ?? 0,
                      page: editorPortal.note.page ?? null,
                    }
                  : undefined
              }
              onSubmit={handleEditNote}
              onDelete={() => editorPortal.note && handleDeleteNote(editorPortal.note)}
              onCancel={closeEditorPortal}
            />
          )}
        </div>,
        document.body,
      )}
    </div>
  );
}
