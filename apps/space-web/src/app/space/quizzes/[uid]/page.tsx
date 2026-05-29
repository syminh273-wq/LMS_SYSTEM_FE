'use client';

import * as React from 'react';
import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { quizApi } from '@/lib/api/quiz';
import { classroomApi } from '@/lib/api/classroom';
import type { QuizDetail, Classroom, QuizAttemptRecord, QuizAssignment } from '@/lib/api/types';
import {
  Loader2, ArrowLeft, BookOpen, CheckCircle2,
  Plus, X, Link2, BarChart2, Clock, RotateCcw, Settings,
  Shuffle, HelpCircle, Target
} from 'lucide-react';
import { Button } from '@shared/components/ui/button';
import { toast } from 'sonner';

interface Props {
  params: Promise<{ uid: string }>;
}

type Tab = 'questions' | 'attempts';

function fmtSeconds(s: number): string {
  if (!s) return '–';
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return sec ? `${m}p ${sec}s` : `${m} phút`;
}

function fmtTime(iso: string): string {
  return new Date(iso).toLocaleString('vi-VN', { dateStyle: 'short', timeStyle: 'short' });
}

export default function QuizDetailPage({ params }: Props) {
  const { uid } = use(params);
  const router = useRouter();
  const [quiz, setQuiz] = useState<QuizDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState<QuizAssignment | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>('questions');

  // attempts tab state
  const [selectedClassroomId, setSelectedClassroomId] = useState('');
  const [attempts, setAttempts] = useState<QuizAttemptRecord[]>([]);
  const [loadingAttempts, setLoadingAttempts] = useState(false);

  useEffect(() => {
    quizApi.retrieve(uid)
      .then(data => {
        setQuiz(data);
        // pre-select first assigned classroom for attempts tab
        const first = data.assigned_classrooms?.[0];
        if (first) setSelectedClassroomId(first.classroom_id);
      })
      .catch(err => toast.error(err instanceof Error ? err.message : 'Không thể tải quiz'))
      .finally(() => setLoading(false));
  }, [uid]);

  useEffect(() => {
    if (activeTab !== 'attempts' || !selectedClassroomId) return;
    setLoadingAttempts(true);
    quizApi.getAttempts(uid, selectedClassroomId)
      .then(setAttempts)
      .catch(() => toast.error('Không thể tải lượt làm'))
      .finally(() => setLoadingAttempts(false));
  }, [activeTab, selectedClassroomId, uid]);

  const handleUnassign = async (classroomId: string) => {
    if (!quiz) return;
    try {
      await quizApi.unassignFromClassroom(quiz.uid, classroomId);
      setQuiz(prev => prev ? {
        ...prev,
        assigned_classrooms: (prev.assigned_classrooms ?? []).filter(a => a.classroom_id !== classroomId),
      } : prev);
      toast.success('Đã hủy phân công');
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Lỗi hủy phân công');
    }
  };

  const handleAssigned = (assignment: QuizAssignment) => {
    setQuiz(prev => prev ? {
      ...prev,
      assigned_classrooms: [...(prev.assigned_classrooms ?? []), assignment],
    } : prev);
  };

  const handleAssignmentUpdated = (updated: QuizAssignment) => {
    setQuiz(prev => prev ? {
      ...prev,
      assigned_classrooms: (prev.assigned_classrooms ?? []).map(a =>
        a.classroom_id === updated.classroom_id ? updated : a
      ),
    } : prev);
  };

  if (loading) {
    return <div className="flex items-center justify-center py-32 text-muted-foreground"><Loader2 size={36} className="animate-spin" /></div>;
  }
  if (!quiz) return null;

  const OPTION_LABELS = { a: 'A', b: 'B', c: 'C', d: 'D' } as const;
  const assignments = quiz.assigned_classrooms ?? [];

  const TABS: { key: Tab; label: string; icon: React.ReactNode }[] = [
    { key: 'questions', label: 'Câu hỏi', icon: <BookOpen size={14} /> },
    { key: 'attempts', label: 'Lượt làm', icon: <BarChart2 size={14} /> },
  ];

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.push('/space/quizzes')}
          className="rounded-xl border border-border bg-card shadow-sm hover:bg-muted/50">
          <ArrowLeft size={18} className="text-muted-foreground" />
        </Button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <span className={`text-[10px] font-black px-2 py-0.5 rounded-full uppercase ${
              quiz.status === 'published' ? 'bg-emerald-50 text-emerald-600' :
              quiz.status === 'archived' ? 'bg-muted text-muted-foreground' : 'bg-amber-50 text-amber-600'
            }`}>{quiz.status}</span>
            <span className="text-[10px] font-bold text-muted-foreground uppercase">{quiz.questions_count} câu hỏi</span>
          </div>
          <h1 className="text-xl font-black text-foreground tracking-tight truncate">{quiz.title}</h1>
        </div>
        <Button onClick={() => setShowAssignModal(true)}
          className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl h-10 px-4 gap-2 shrink-0">
          <Link2 size={15} /> Phân công lớp
        </Button>
      </div>

      {quiz.description && (
        <div className="bg-muted/50 rounded-2xl p-4 border border-border text-sm text-muted-foreground font-medium leading-relaxed">
          {quiz.description}
        </div>
      )}

      {/* Assigned classrooms — each shows its settings + edit button */}
      {assignments.length > 0 && (
        <div className="bg-indigo-50 rounded-2xl p-4 border border-indigo-100">
          <div className="text-[10px] font-black uppercase text-indigo-500 mb-3 tracking-wider">Đã phân công cho</div>
          <div className="flex flex-wrap gap-2">
            {assignments.map(a => (
              <div key={a.classroom_id}
                className="flex items-center gap-2 bg-card rounded-xl px-3 py-2 border border-indigo-100 text-xs font-bold text-indigo-700">
                <BookOpen size={12} />
                <span className="font-mono">{a.classroom_id.slice(0, 8)}…</span>
                {a.time_limit_seconds > 0 && (
                  <span className="flex items-center gap-0.5 text-muted-foreground font-medium">
                    <Clock size={11} />{Math.round(a.time_limit_seconds / 60)}p
                  </span>
                )}
                <button type="button" onClick={() => setEditingAssignment(a)}
                  className="text-muted-foreground/60 hover:text-indigo-500 transition-colors">
                  <Settings size={12} />
                </button>
                <button type="button" onClick={() => void handleUnassign(a.classroom_id)}
                  className="text-muted-foreground/60 hover:text-rose-500 transition-colors">
                  <X size={12} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 bg-muted rounded-2xl p-1">
        {TABS.map(tab => (
          <button key={tab.key} type="button" onClick={() => setActiveTab(tab.key)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-black transition-all ${
              activeTab === tab.key ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
            }`}>
            {tab.icon}{tab.label}
          </button>
        ))}
      </div>

      {/* ── Tab: Questions ── */}
      {activeTab === 'questions' && (
        <div className="space-y-4">
          {quiz.questions.sort((a, b) => a.order - b.order).map((q, idx) => (
            <div key={q.uid} className="bg-card rounded-2xl border border-border shadow-sm p-5 space-y-4">
              <div className="flex items-start gap-3">
                <span className="w-7 h-7 rounded-lg bg-indigo-600 text-white text-xs font-black flex items-center justify-center shrink-0">
                  {idx + 1}
                </span>
                <p className="text-sm font-bold text-foreground leading-relaxed">{q.question_text}</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 pl-10">
                {(['a', 'b', 'c', 'd'] as const).map(opt => {
                  const isCorrect = q.correct_answer === opt;
                  return (
                    <div key={opt} className={`flex items-center gap-3 rounded-xl px-4 py-3 border text-sm font-medium ${
                      isCorrect ? 'border-emerald-200 bg-emerald-50 text-emerald-800' : 'border-border bg-muted/50 text-foreground'
                    }`}>
                      <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black shrink-0 ${
                        isCorrect ? 'bg-emerald-500 text-white' : 'bg-muted text-muted-foreground'
                      }`}>{OPTION_LABELS[opt]}</span>
                      {q[`option_${opt}` as keyof typeof q] as string}
                      {isCorrect && <CheckCircle2 size={15} className="ml-auto text-emerald-500 shrink-0" />}
                    </div>
                  );
                })}
              </div>
              {q.explanation && (
                <div className="pl-10 text-xs text-muted-foreground font-medium bg-amber-50 rounded-xl px-4 py-2 border border-amber-100">
                  <span className="font-black text-amber-600">Giải thích: </span>{q.explanation}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* ── Tab: Attempts ── */}
      {activeTab === 'attempts' && (
        <div className="space-y-4">
          {assignments.length > 1 && (
            <div className="flex items-center gap-3">
              <span className="text-xs font-black text-muted-foreground">Lớp học:</span>
              <div className="flex gap-2 flex-wrap">
                {assignments.map(a => (
                  <button key={a.classroom_id} type="button"
                    onClick={() => { setSelectedClassroomId(a.classroom_id); setAttempts([]); }}
                    className={`text-xs font-black rounded-xl px-3 py-1.5 transition-all ${
                      selectedClassroomId === a.classroom_id
                        ? 'bg-indigo-600 text-white'
                        : 'bg-muted text-muted-foreground hover:bg-muted'
                    }`}>
                    {a.classroom_id.slice(0, 8)}…
                  </button>
                ))}
              </div>
            </div>
          )}

          {!selectedClassroomId ? (
            <div className="bg-card rounded-2xl border border-border p-16 text-center text-muted-foreground">
              <BarChart2 size={40} className="mx-auto mb-3 opacity-30" />
              <p className="text-sm font-medium">Chọn lớp học để xem lượt làm</p>
            </div>
          ) : loadingAttempts ? (
            <div className="flex justify-center py-16"><Loader2 size={28} className="animate-spin text-muted-foreground" /></div>
          ) : attempts.length === 0 ? (
            <div className="bg-card rounded-2xl border border-border p-16 text-center text-muted-foreground">
              <BarChart2 size={40} className="mx-auto mb-3 opacity-30" />
              <p className="text-sm font-medium">Chưa có lượt làm nào</p>
            </div>
          ) : (
            <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
               <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/50">
                    {['STT', 'Sinh viên', 'Lần thứ', 'Điểm', 'Thời gian', 'Nộp lúc'].map(h => (
                      <th key={h} className="px-5 py-3 text-[10px] font-black uppercase text-muted-foreground text-center tracking-wider">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {attempts.map((a, idx) => (
                    <tr key={a.uid} className="border-b border-slate-50 hover:bg-muted/50">
                      <td className="px-5 py-3 text-muted-foreground font-bold text-center">{idx + 1}</td>
                      <td className="px-5 py-3 font-mono text-xs text-muted-foreground text-center">{a.student_id.slice(0, 8)}…</td>
                      <td className="px-5 py-3 text-center">
                        <span className="text-xs font-black text-indigo-600 bg-indigo-50 rounded-lg px-2 py-0.5">#{a.attempt_number}</span>
                      </td>
                      <td className="px-5 py-3 text-center">
                        <span className={`text-sm font-black ${a.score_pct >= 80 ? 'text-emerald-600' : a.score_pct >= 50 ? 'text-amber-600' : 'text-rose-600'}`}>
                          {a.score_pct}%
                        </span>
                      </td>
                      <td className="px-5 py-3 text-center text-xs font-bold text-muted-foreground">{fmtSeconds(a.time_taken_seconds)}</td>
                      <td className="px-5 py-3 text-center text-xs text-muted-foreground font-medium">{fmtTime(a.submitted_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {showAssignModal && (
        <AssignToClassroomModal
          quizUid={quiz.uid}
          alreadyAssigned={assignments}
          onClose={() => setShowAssignModal(false)}
          onAssigned={handleAssigned}
        />
      )}

      {editingAssignment && (
        <EditAssignmentModal
          quizUid={quiz.uid}
          assignment={editingAssignment}
          onClose={() => setEditingAssignment(null)}
          onUpdated={handleAssignmentUpdated}
        />
      )}
    </div>
  );
}

function AssignToClassroomModal({
  quizUid, alreadyAssigned, onClose, onAssigned,
}: {
  quizUid: string;
  alreadyAssigned: QuizAssignment[];
  onClose: () => void;
  onAssigned: (a: QuizAssignment) => void;
}) {
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [loading, setLoading] = useState(true);
  const [assigning, setAssigning] = useState<string | null>(null);

  // Settings
  const [timeLimitMin, setTimeLimitMin] = useState(0);
  const [maxAttempts, setMaxAttempts] = useState(0);
  const [shuffleQuestions, setShuffleQuestions] = useState(false);
  const [shuffleOptions, setShuffleOptions] = useState(false);
  const [showExplanation, setShowExplanation] = useState(true);
  const [passingScore, setPassingScore] = useState(50);

  useEffect(() => {
    classroomApi.list()
      .then(data => setClassrooms(Array.isArray(data) ? data : data.results))
      .catch(() => toast.error('Không thể tải danh sách lớp học'))
      .finally(() => setLoading(false));
  }, []);

  const handleAssign = async (classroomId: string) => {
    setAssigning(classroomId);
    try {
      const assignment = await quizApi.assignToClassroom(quizUid, classroomId, {
        time_limit_seconds: timeLimitMin * 60,
        max_attempts: maxAttempts,
        shuffle_questions: shuffleQuestions,
        shuffle_options: shuffleOptions,
        show_explanation: showExplanation,
        passing_score_pct: passingScore,
      });
      onAssigned(assignment);
      toast.success('Đã phân công quiz cho lớp học');
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Lỗi phân công');
    } finally {
      setAssigning(null);
    }
  };

  const assignedIds = new Set(alreadyAssigned.map(a => a.classroom_id));

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-card rounded-3xl shadow-2xl w-full max-w-2xl animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
        <div className="p-6 border-b border-border flex items-center justify-between">
          <h2 className="font-black text-foreground flex items-center gap-2"><Link2 size={20} className="text-indigo-600" /> Phân công cho lớp</h2>
          <Button variant="ghost" size="icon" onClick={onClose} className="rounded-xl text-muted-foreground"><X size={20} /></Button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-6">
            <h3 className="text-xs font-black text-muted-foreground uppercase tracking-wider">Cấu hình làm bài</h3>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-muted-foreground uppercase flex items-center gap-1.5"><Clock size={12} /> Thời gian (phút)</label>
                  <input type="number" min={0} value={timeLimitMin} onChange={e => setTimeLimitMin(Number(e.target.value))}
                    className="w-full rounded-xl border border-border bg-muted/50 px-3 py-2 text-sm font-black outline-none focus:ring-2 focus:ring-indigo-100" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-muted-foreground uppercase flex items-center gap-1.5"><RotateCcw size={12} /> Số lần tối đa</label>
                  <input type="number" min={0} value={maxAttempts} onChange={e => setMaxAttempts(Number(e.target.value))}
                    className="w-full rounded-xl border border-border bg-muted/50 px-3 py-2 text-sm font-black outline-none focus:ring-2 focus:ring-indigo-100" />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-muted-foreground uppercase flex items-center gap-1.5"><Target size={12} /> Điểm đạt (%)</label>
                <div className="flex items-center gap-4">
                  <input type="range" min={0} max={100} step={5} value={passingScore} onChange={e => setPassingScore(Number(e.target.value))}
                    className="flex-1 accent-indigo-600" />
                  <span className="text-sm font-black text-indigo-600 w-8">{passingScore}%</span>
                </div>
              </div>

              <div className="space-y-3 pt-2">
                <label className="flex items-center gap-3 p-3 rounded-xl border border-border hover:bg-muted/50 cursor-pointer transition-colors">
                  <input type="checkbox" checked={shuffleQuestions} onChange={e => setShuffleQuestions(e.target.checked)}
                    className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500" />
                  <div className="flex-1">
                    <div className="text-xs font-black text-foreground flex items-center gap-1.5"><Shuffle size={12} /> Trộn câu hỏi</div>
                    <p className="text-[10px] text-muted-foreground font-medium">Thay đổi thứ tự câu hỏi cho mỗi lượt làm</p>
                  </div>
                </label>

                <label className="flex items-center gap-3 p-3 rounded-xl border border-border hover:bg-muted/50 cursor-pointer transition-colors">
                  <input type="checkbox" checked={shuffleOptions} onChange={e => setShuffleOptions(e.target.checked)}
                    className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500" />
                  <div className="flex-1">
                    <div className="text-xs font-black text-foreground flex items-center gap-1.5"><Shuffle size={12} /> Trộn đáp án</div>
                    <p className="text-[10px] text-muted-foreground font-medium">Thay đổi thứ tự A/B/C/D</p>
                  </div>
                </label>

                <label className="flex items-center gap-3 p-3 rounded-xl border border-border hover:bg-muted/50 cursor-pointer transition-colors">
                  <input type="checkbox" checked={showExplanation} onChange={e => setShowExplanation(e.target.checked)}
                    className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500" />
                  <div className="flex-1">
                    <div className="text-xs font-black text-foreground flex items-center gap-1.5"><HelpCircle size={12} /> Hiện giải thích</div>
                    <p className="text-[10px] text-muted-foreground font-medium">Hiển thị giải thích sau khi hoàn thành</p>
                  </div>
                </label>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-xs font-black text-muted-foreground uppercase tracking-wider">Chọn lớp học</h3>
            <div className="space-y-2">
              {loading ? (
                <div className="flex justify-center py-8"><Loader2 size={24} className="animate-spin text-muted-foreground/60" /></div>
              ) : classrooms.map(classroom => {
                const isAssigned = assignedIds.has(classroom.uid);
                return (
                  <div key={classroom.uid} className="flex items-center justify-between gap-3 p-3 rounded-xl border border-border hover:bg-muted/50 transition">
                    <div className="min-w-0">
                      <div className="text-sm font-bold text-foreground truncate">{classroom.name}</div>
                      <div className="text-[10px] font-bold text-muted-foreground font-mono uppercase">ID: {classroom.pid}</div>
                    </div>
                    {isAssigned ? (
                      <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg shrink-0">ĐÃ GIAO</span>
                    ) : (
                      <Button size="sm" onClick={() => void handleAssign(classroom.uid)} disabled={assigning === classroom.uid}
                        className="h-8 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold text-xs gap-1.5 shrink-0">
                        {assigning === classroom.uid ? <Loader2 size={12} className="animate-spin" /> : <Plus size={12} />}
                        GIAO
                      </Button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="p-6 border-t border-border bg-muted/30">
          <Button variant="outline" onClick={onClose} className="w-full rounded-xl font-bold text-xs h-11">ĐÓNG</Button>
        </div>
      </div>
    </div>
  );
}

function EditAssignmentModal({
  quizUid, assignment, onClose, onUpdated,
}: {
  quizUid: string;
  assignment: QuizAssignment;
  onClose: () => void;
  onUpdated: (a: QuizAssignment) => void;
}) {
  const [timeLimitMin, setTimeLimitMin] = useState(assignment.time_limit_seconds ? Math.round(assignment.time_limit_seconds / 60) : 0);
  const [maxAttempts, setMaxAttempts] = useState(assignment.max_attempts ?? 0);
  const [shuffleQuestions, setShuffleQuestions] = useState(assignment.shuffle_questions ?? false);
  const [shuffleOptions, setShuffleOptions] = useState(assignment.shuffle_options ?? false);
  const [showExplanation, setShowExplanation] = useState(assignment.show_explanation ?? true);
  const [passingScore, setPassingScore] = useState(assignment.passing_score_pct ?? 50);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      const updated = await quizApi.updateAssignment(quizUid, assignment.classroom_id, {
        time_limit_seconds: timeLimitMin * 60,
        max_attempts: maxAttempts,
        shuffle_questions: shuffleQuestions,
        shuffle_options: shuffleOptions,
        show_explanation: showExplanation,
        passing_score_pct: passingScore,
      });
      onUpdated(updated);
      toast.success('Đã cập nhật cài đặt');
      onClose();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Lưu thất bại');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-card rounded-3xl shadow-2xl w-full max-w-sm animate-in fade-in slide-in-from-bottom-4 duration-200 overflow-hidden">
        <div className="p-6 border-b border-border flex items-center justify-between">
          <div>
            <h2 className="font-black text-foreground">Cài đặt lớp học</h2>
            <p className="text-[10px] text-muted-foreground font-mono mt-0.5 truncate max-w-[200px]">{assignment.classroom_id}</p>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} className="rounded-xl text-muted-foreground"><X size={20} /></Button>
        </div>

        <div className="p-6 space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-muted-foreground uppercase flex items-center gap-1.5"><Clock size={12} /> Thời gian</label>
              <input type="number" min={0} value={timeLimitMin} onChange={e => setTimeLimitMin(Number(e.target.value))}
                className="w-full rounded-xl border border-border bg-muted/50 px-3 py-2 text-sm font-black outline-none focus:ring-2 focus:ring-indigo-100" />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-muted-foreground uppercase flex items-center gap-1.5"><RotateCcw size={12} /> Lần thử</label>
              <input type="number" min={0} value={maxAttempts} onChange={e => setMaxAttempts(Number(e.target.value))}
                className="w-full rounded-xl border border-border bg-muted/50 px-3 py-2 text-sm font-black outline-none focus:ring-2 focus:ring-indigo-100" />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-muted-foreground uppercase flex items-center gap-1.5"><Target size={12} /> Điểm đạt: {passingScore}%</label>
            <input type="range" min={0} max={100} step={5} value={passingScore} onChange={e => setPassingScore(Number(e.target.value))}
              className="w-full accent-indigo-600" />
          </div>

          <div className="space-y-3">
            {[
              { label: 'Trộn câu hỏi', icon: Shuffle, val: shuffleQuestions, set: setShuffleQuestions },
              { label: 'Trộn đáp án', icon: Shuffle, val: shuffleOptions, set: setShuffleOptions },
              { label: 'Hiện giải thích', icon: HelpCircle, val: showExplanation, set: setShowExplanation },
            ].map(item => (
              <label key={item.label} className="flex items-center justify-between p-3 rounded-xl border border-slate-50 hover:bg-muted/50 cursor-pointer">
                <div className="flex items-center gap-2 text-xs font-bold text-foreground">
                  <item.icon size={14} className="text-muted-foreground" /> {item.label}
                </div>
                <input type="checkbox" checked={item.val} onChange={e => item.set(e.target.checked)}
                  className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500" />
              </label>
            ))}
          </div>
        </div>

        <div className="p-6 pt-0 flex gap-3">
          <Button variant="outline" onClick={onClose} className="flex-1 rounded-xl font-bold text-xs h-11">HỦY</Button>
          <Button onClick={() => void handleSave()} disabled={saving}
            className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs h-11 gap-2">
            {saving ? <Loader2 size={14} className="animate-spin" /> : 'LƯU'}
          </Button>
        </div>
      </div>
    </div>
  );
}
