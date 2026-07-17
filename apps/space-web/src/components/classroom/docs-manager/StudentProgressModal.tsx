'use client';

import * as React from 'react';
import { useEffect, useState } from 'react';
import {
  Users,
  CheckCircle2,
  Circle,
  Loader2,
  MessageSquare,
  ChevronRight,
  X,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@shared/components/ui/dialog';
import { Button } from '@shared/components/ui/button';
import type { StudentProgress, StudentNote } from './student-progress-types';

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  classroomUid: string;
  resourceUid: string;
  resourceName: string;
  apiBase: string;
  accessToken: string | null;
};

export function StudentProgressModal({
  open,
  onOpenChange,
  classroomUid,
  resourceUid,
  resourceName,
  apiBase,
  accessToken,
}: Props) {
  const [progress, setProgress] = useState<StudentProgress[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<string | null>(null);
  const [notes, setNotes] = useState<StudentNote[]>([]);
  const [notesLoading, setNotesLoading] = useState(false);

  const authHeaders = React.useCallback((): Record<string, string> => {
    const h: Record<string, string> = {};
    if (accessToken) h['Authorization'] = `Bearer ${accessToken}`;
    return h;
  }, [accessToken]);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    /* eslint-disable react-hooks/set-state-in-effect -- Modal open: fetch progress. */
    setLoading(true);
    fetch(
      `${apiBase}/api/v1/space/course/classrooms/${classroomUid}/docs/${resourceUid}/students-progress/`,
      { headers: authHeaders() },
    )
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => {
        if (cancelled) return;
        setProgress(Array.isArray(data) ? (data as StudentProgress[]) : []);
      })
      .catch(() => {
        if (cancelled) setProgress([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    /* eslint-enable react-hooks/set-state-in-effect */
    return () => {
      cancelled = true;
    };
  }, [open, classroomUid, resourceUid, apiBase, authHeaders]);

  useEffect(() => {
    if (!selectedStudent) {
      return;
    }
    let cancelled = false;
    /* eslint-disable react-hooks/set-state-in-effect -- Selected student changed: fetch notes. */
    setNotesLoading(true);
    fetch(
      `${apiBase}/api/v1/space/course/classrooms/${classroomUid}/docs/${resourceUid}/student-notes/?student_id=${selectedStudent}`,
      { headers: authHeaders() },
    )
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => {
        if (cancelled) return;
        setNotes(Array.isArray(data) ? (data as StudentNote[]) : []);
      })
      .catch(() => {
        if (!cancelled) setNotes([]);
      })
      .finally(() => {
        if (!cancelled) setNotesLoading(false);
      });
    /* eslint-enable react-hooks/set-state-in-effect */
    return () => {
      cancelled = true;
    };
  }, [selectedStudent, classroomUid, resourceUid, apiBase, authHeaders]);

  const completedCount = progress.filter((p) => p.is_completed).length;
  const totalCount = progress.length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users size={18} className="text-indigo-600" />
            <span className="truncate">Tiến độ đọc: {resourceName}</span>
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-indigo-600" />
          </div>
        ) : (
          <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-3 min-h-0">
            {/* Student list */}
            <div className="border border-slate-200 rounded-xl overflow-hidden flex flex-col min-h-0">
              <div className="px-3 py-2 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                  Học sinh ({totalCount})
                </span>
                <span className="text-[10px] font-bold text-emerald-600">
                  {completedCount} hoàn thành
                </span>
              </div>
              <div className="flex-1 overflow-y-auto">
                {progress.length === 0 ? (
                  <p className="text-center py-8 text-xs text-slate-400">
                    Chưa có học sinh nào mở tài liệu này.
                  </p>
                ) : (
                  progress
                    .slice()
                    .sort((a, b) => (b.read_progress ?? 0) - (a.read_progress ?? 0))
                    .map((p) => {
                      const isSelected = p.student_id === selectedStudent;
                      return (
                        <button
                          type="button"
                          key={p.student_id}
                          onClick={() => setSelectedStudent(p.student_id)}
                          className={`w-full text-left px-3 py-2 border-b border-slate-100 hover:bg-indigo-50/40 transition flex items-center gap-2 ${
                            isSelected ? 'bg-indigo-50' : ''
                          }`}
                        >
                          {p.is_completed ? (
                            <CheckCircle2 size={14} className="text-emerald-500 shrink-0" />
                          ) : (
                            <Circle size={14} className="text-slate-300 shrink-0" />
                          )}
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-bold text-slate-800 truncate">
                              {p.student_id.slice(0, 8)}…
                            </p>
                            <div className="flex items-center gap-2 mt-1">
                              <div className="flex-1 h-1 bg-slate-100 rounded-full overflow-hidden">
                                <div
                                  className={`h-full ${p.is_completed ? 'bg-emerald-500' : 'bg-indigo-500'}`}
                                  style={{ width: `${p.read_progress ?? 0}%` }}
                                />
                              </div>
                              <span className="text-[10px] font-bold text-slate-500 w-10 text-right">
                                {p.read_progress ?? 0}%
                              </span>
                              <span className="text-[10px] text-slate-400 w-12 text-right">
                                {p.note_count} note
                              </span>
                            </div>
                          </div>
                          <ChevronRight size={12} className="text-slate-400 shrink-0" />
                        </button>
                      );
                    })
                )}
              </div>
            </div>

            {/* Notes for selected student */}
            <div className="border border-slate-200 rounded-xl overflow-hidden flex flex-col min-h-0">
              <div className="px-3 py-2 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                  {selectedStudent ? `Note của học sinh` : 'Chọn học sinh để xem note'}
                </span>
                {selectedStudent && (
                  <button
                    type="button"
                    onClick={() => setSelectedStudent(null)}
                    className="p-1 rounded hover:bg-slate-200"
                  >
                    <X size={12} />
                  </button>
                )}
              </div>
              <div className="flex-1 overflow-y-auto p-2">
                {!selectedStudent ? (
                  <p className="text-center py-8 text-xs text-slate-400">
                    Bấm vào học sinh bên trái để xem ghi chú.
                  </p>
                ) : notesLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-5 h-5 animate-spin text-indigo-600" />
                  </div>
                ) : notes.length === 0 ? (
                  <p className="text-center py-8 text-xs text-slate-400">
                    Học sinh chưa tạo note nào.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {notes.map((n) => (
                      <div
                        key={n.uid}
                        className="p-2 rounded-lg border border-slate-200 bg-white"
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <MessageSquare size={12} className="text-indigo-600" />
                          <span className="text-[10px] font-black text-slate-500">
                            {Math.round((n.progress_at ?? 0) * 100)}%
                          </span>
                          {n.page != null && (
                            <span className="text-[10px] text-slate-400">Trang {n.page}</span>
                          )}
                          {n.created_at && (
                            <span className="ml-auto text-[10px] text-slate-400">
                              {new Date(n.created_at).toLocaleDateString('vi-VN')}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-700 whitespace-pre-wrap">{n.content}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        <div className="flex justify-end pt-3 border-t border-slate-200">
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Đóng
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
