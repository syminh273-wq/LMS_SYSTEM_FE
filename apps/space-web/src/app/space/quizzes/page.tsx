'use client';

import * as React from 'react';
import { useState, useEffect } from 'react';
import { quizApi } from '@/lib/api/quiz';
import { classroomApi } from '@/lib/api/classroom';
import type { Quiz, QuizDetail, Classroom, QuizAssignment, QuizQuestion } from '@/lib/api/types';
import {
  Loader2, Plus, Trash2, BookOpen, Wand2,
  ChevronDown, ChevronUp, Link2, Clock, RotateCcw, Settings,
  Shuffle, HelpCircle, Target, X, CheckCircle2,
} from 'lucide-react';
import { Button } from '@shared/components/ui/button';
import { toast } from 'sonner';
import { useTranslation } from '@shared/components/LocaleProvider';
import { useSelector } from 'react-redux';
import type { RootState } from '@/lib/redux/store';
import GenerateQuizModal from '@/components/quiz/GenerateQuizModal';

export default function QuizLibraryPage() {
  const { t } = useTranslation();
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [loading, setLoading] = useState(true);
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [expandedUid, setExpandedUid] = useState<string | null>(null);
  const [detailsByUid, setDetailsByUid] = useState<Record<string, QuizDetail | undefined>>({});
  const [loadingDetailUid, setLoadingDetailUid] = useState<string | null>(null);

  const activeTaskCount = useSelector((s: RootState) => {
    const ids = s.quizTasks.ids;
    let n = 0;
    for (const id of ids) {
      const t = s.quizTasks.byId[id];
      if (t && (t.status === 'completed') && t.quiz_uid && !quizzes.find(q => q.uid === t.quiz_uid)) {
        n += 1;
      }
    }
    return n;
  });

  const loadQuizzes = React.useCallback(async () => {
    setLoading(true);
    try {
      const data = await quizApi.list();
      setQuizzes(data);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : t('quiz.load_error'));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    const handle = setTimeout(() => { void loadQuizzes(); }, 0);
    return () => clearTimeout(handle);
  }, [loadQuizzes]);

  useEffect(() => {
    if (activeTaskCount === 0) return;
    const id = setTimeout(() => { void loadQuizzes(); }, 0);
    return () => clearTimeout(id);
  }, [activeTaskCount, loadQuizzes]);

  const handleDelete = async (quiz: Quiz) => {
    if (!window.confirm(t('quiz.delete_confirm', undefined, { title: quiz.title }))) return;
    try {
      await quizApi.deleteQuiz(quiz.uid);
      setQuizzes(prev => prev.filter(q => q.uid !== quiz.uid));
      setDetailsByUid(prev => {
        const next = { ...prev };
        delete next[quiz.uid];
        return next;
      });
      if (expandedUid === quiz.uid) setExpandedUid(null);
      toast.success(t('quiz.delete_success'));
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : t('quiz.delete_error'));
    }
  };

  const handleToggleExpand = async (quiz: Quiz) => {
    if (expandedUid === quiz.uid) {
      setExpandedUid(null);
      return;
    }
    setExpandedUid(quiz.uid);
    if (detailsByUid[quiz.uid]) return;
    setLoadingDetailUid(quiz.uid);
    try {
      const data = await quizApi.retrieve(quiz.uid);
      setDetailsByUid(prev => ({ ...prev, [quiz.uid]: data }));
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : t('quiz.load_error'));
    } finally {
      setLoadingDetailUid(null);
    }
  };

  const STATUS_LABEL_KEY: Record<string, string> = {
    draft: 'quiz.status.draft',
    published: 'quiz.status.published',
    archived: 'quiz.status.archived',
  };

  return (
    <div className="max-w-5xl mx-auto py-8 px-4 space-y-6 animate-in fade-in duration-300">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-foreground tracking-tight">{t('quiz.title')}</h1>
          <p className="text-sm text-muted-foreground font-medium mt-1">
            {t('quiz.subtitle')}
          </p>
        </div>
        <Button
          onClick={() => setShowGenerateModal(true)}
          className="bg-primary-brand hover:bg-primary-brand-dark text-white font-bold text-xs rounded-xl h-10 px-5 gap-2 shadow-lg shadow-primary-brand/20"
        >
          <Wand2 size={16} />
          {t('quiz.create_btn')}
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-32 text-muted-foreground">
          <Loader2 size={36} className="animate-spin" />
        </div>
      ) : quizzes.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-32 text-muted-foreground border-2 border-dashed border-border rounded-3xl">
          <BookOpen size={48} className="mb-4 opacity-30" />
          <p className="text-sm font-medium">{t('quiz.empty')}</p>
          <p className="text-xs mt-1 mb-6">{t('quiz.empty_hint')}</p>
          <Button onClick={() => setShowGenerateModal(true)} variant="outline" className="rounded-xl gap-2 font-bold text-xs">
            <Plus size={16} /> {t('quiz.create_first_btn')}
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {quizzes.map(quiz => {
            const isExpanded = expandedUid === quiz.uid;
            const detail = detailsByUid[quiz.uid];
            const isLoadingDetail = loadingDetailUid === quiz.uid;
            return (
              <div
                key={quiz.uid}
                className={`bg-card border rounded-2xl shadow-sm transition-all overflow-hidden ${
                  isExpanded ? 'border-primary-brand/40 shadow-md' : 'border-border hover:border-primary-brand/30'
                }`}
              >
                <div className="p-5 flex flex-col gap-4">
                  <div className="flex items-start justify-between gap-3">
                    <button
                      type="button"
                      onClick={() => void handleToggleExpand(quiz)}
                      className="flex items-start gap-3 flex-1 min-w-0 text-left cursor-pointer"
                    >
                      <div className="w-10 h-10 rounded-xl bg-primary-brand/10 flex items-center justify-center text-primary-brand shrink-0">
                        <BookOpen size={20} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full border ${
                            quiz.status === 'published'
                              ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                              : quiz.status === 'archived'
                              ? 'bg-muted text-muted-foreground border-border'
                              : 'bg-amber-500/10 text-amber-500 border-amber-500/20'
                          }`}>
                            {t(STATUS_LABEL_KEY[quiz.status] ?? 'quiz.status.draft')}
                          </span>
                          <span className="text-[10px] font-bold text-muted-foreground uppercase">
                            {t('quiz.library.card_questions_count', undefined, { count: quiz.questions_count })}
                          </span>
                        </div>
                        <h3 className="font-black text-foreground text-sm leading-snug truncate">{quiz.title}</h3>
                        {quiz.description && (
                          <p className="text-xs text-muted-foreground font-medium mt-1 line-clamp-1">{quiz.description}</p>
                        )}
                      </div>
                      <div className="shrink-0 text-muted-foreground">
                        {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                      </div>
                    </button>
                  </div>

                  <div className="flex items-center justify-end pt-2 border-t border-border">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => void handleDelete(quiz)}
                      className="h-8 w-8 rounded-lg text-muted-foreground hover:text-rose-500 hover:bg-rose-500/10"
                      title={t('quiz.delete_success')}
                    >
                      <Trash2 size={15} />
                    </Button>
                  </div>
                </div>

                {isExpanded && (
                  <div className="border-t border-border bg-muted/30 p-5 space-y-5 animate-in slide-in-from-top-2 duration-200">
                    {isLoadingDetail ? (
                      <div className="flex items-center justify-center py-8 text-muted-foreground">
                        <Loader2 size={24} className="animate-spin" />
                      </div>
                    ) : detail ? (
                      <QuizExpandedPanel
                        detail={detail}
                        onAssignedUpdate={(assignment) => {
                          setDetailsByUid(prev => {
                            const cur = prev[quiz.uid];
                            if (!cur) return prev;
                            const list = (cur.assigned_classrooms ?? []).filter(a => a.classroom_id !== assignment.classroom_id);
                            return {
                              ...prev,
                              [quiz.uid]: { ...cur, assigned_classrooms: [...list, assignment] },
                            };
                          });
                        }}
                        onUnassigned={(classroomId) => {
                          setDetailsByUid(prev => {
                            const cur = prev[quiz.uid];
                            if (!cur) return prev;
                            return {
                              ...prev,
                              [quiz.uid]: {
                                ...cur,
                                assigned_classrooms: (cur.assigned_classrooms ?? []).filter(a => a.classroom_id !== classroomId),
                              },
                            };
                          });
                        }}
                      />
                    ) : null}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {showGenerateModal && (
        <GenerateQuizModal onClose={() => setShowGenerateModal(false)} />
      )}
    </div>
  );
}

function QuizExpandedPanel({
  detail, onAssignedUpdate, onUnassigned,
}: {
  detail: QuizDetail;
  onAssignedUpdate: (a: QuizAssignment) => void;
  onUnassigned: (classroomId: string) => void;
}) {
  const { t } = useTranslation();
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState<QuizAssignment | null>(null);

  const questions = (detail.questions ?? []).slice().sort((a, b) => a.order - b.order);
  const assignments = detail.assigned_classrooms ?? [];
  const totalQuestions = detail.questions_count || questions.length || 0;
  const generatedCount = questions.length;
  const progressPct = totalQuestions > 0 ? Math.min(100, Math.round((generatedCount / totalQuestions) * 100)) : 0;

  return (
    <>
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="text-[10px] font-black uppercase text-muted-foreground tracking-wider">
            {t('quiz.progress_label')}
          </div>
          <div className="text-[10px] font-black text-primary-brand">
            {t('quiz.progress_done', undefined, { done: generatedCount, total: totalQuestions })} · {progressPct}%
          </div>
        </div>
        <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-primary-brand rounded-full transition-all duration-500"
            style={{ width: `${progressPct}%` }}
          />
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div className="text-[10px] font-black uppercase text-muted-foreground tracking-wider">
          {t('quiz.questions_list_title')}
        </div>
        <Button
          size="sm"
          onClick={() => setShowAssignModal(true)}
          className="h-8 bg-primary-brand hover:bg-primary-brand-dark text-white rounded-lg font-bold text-xs gap-1.5"
        >
          <Link2 size={13} />
          {assignments.length > 0 ? 'Phân công thêm' : 'Phân công lớp'}
        </Button>
      </div>

      {questions.length === 0 ? (
        <div className="bg-card border border-dashed border-border rounded-xl py-8 text-center text-muted-foreground text-xs font-medium">
          {t('quiz.questions_list_empty')}
        </div>
      ) : (
        <ol className="space-y-1.5">
          {questions.map((q, idx) => (
            <QuestionRow key={q.uid} index={idx + 1} question={q} />
          ))}
        </ol>
      )}

      {assignments.length > 0 && (
        <div className="bg-primary-brand-light rounded-2xl p-4 border border-primary-brand-light">
          <div className="text-[10px] font-black uppercase text-primary-brand mb-2 tracking-wider">Đã phân công cho</div>
          <div className="flex flex-wrap gap-2">
            {assignments.map(a => (
              <div key={a.classroom_id}
                className="flex items-center gap-2 bg-card rounded-xl px-3 py-2 border border-primary-brand-light text-xs font-bold text-primary-brand-dark">
                <BookOpen size={12} />
                <span className="font-mono">{a.classroom_id.slice(0, 8)}…</span>
                {a.time_limit_seconds > 0 && (
                  <span className="flex items-center gap-0.5 text-muted-foreground font-medium">
                    <Clock size={11} />{Math.round(a.time_limit_seconds / 60)}p
                  </span>
                )}
                <button type="button" onClick={() => setEditingAssignment(a)}
                  className="text-muted-foreground/60 hover:text-primary-brand transition-colors">
                  <Settings size={12} />
                </button>
                <button type="button" onClick={() => void handleUnassignInline(a.classroom_id, detail.uid, onUnassigned)}
                  className="text-muted-foreground/60 hover:text-rose-500 transition-colors">
                  <X size={12} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {showAssignModal && (
        <AssignToClassroomModal
          quizUid={detail.uid}
          alreadyAssigned={assignments}
          onClose={() => setShowAssignModal(false)}
          onAssigned={(a) => {
            onAssignedUpdate(a);
            setShowAssignModal(false);
          }}
        />
      )}

      {editingAssignment && (
        <EditAssignmentModal
          quizUid={detail.uid}
          assignment={editingAssignment}
          onClose={() => setEditingAssignment(null)}
          onUpdated={(updated) => {
            onAssignedUpdate(updated);
            setEditingAssignment(null);
          }}
        />
      )}
    </>
  );
}

async function handleUnassignInline(classroomId: string, quizUid: string, onUnassigned: (id: string) => void) {
  try {
    await quizApi.unassignFromClassroom(quizUid, classroomId);
    onUnassigned(classroomId);
    toast.success('Đã hủy phân công');
  } catch (err: unknown) {
    toast.error(err instanceof Error ? err.message : 'Lỗi hủy phân công');
  }
}

function QuestionRow({ index, question }: { index: number; question: QuizQuestion }) {
  const { t } = useTranslation();
  return (
    <li className="flex items-start gap-3 bg-card border border-border rounded-xl px-4 py-3">
      <span className="w-6 h-6 rounded-lg bg-primary-brand/10 text-primary-brand text-[10px] font-black flex items-center justify-center shrink-0">
        {index}
      </span>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-bold text-foreground leading-relaxed line-clamp-2">{question.question_text}</p>
        <div className="mt-1.5 flex items-center gap-3 text-[10px] font-bold text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <CheckCircle2 size={11} className="text-emerald-500" />
            {question[`option_${question.correct_answer}` as 'option_a' | 'option_b' | 'option_c' | 'option_d']}
          </span>
        </div>
      </div>
    </li>
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
      toast.success('Đã phân công cho lớp học');
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
          <h2 className="font-black text-foreground flex items-center gap-2"><Link2 size={20} className="text-primary-brand" /> Phân công cho lớp</h2>
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
                    className="w-full rounded-xl border border-border bg-muted/50 px-3 py-2 text-sm font-black outline-none focus:ring-2 focus:ring-primary-brand-light" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-muted-foreground uppercase flex items-center gap-1.5"><RotateCcw size={12} /> Số lần tối đa</label>
                  <input type="number" min={0} value={maxAttempts} onChange={e => setMaxAttempts(Number(e.target.value))}
                    className="w-full rounded-xl border border-border bg-muted/50 px-3 py-2 text-sm font-black outline-none focus:ring-2 focus:ring-primary-brand-light" />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-muted-foreground uppercase flex items-center gap-1.5"><Target size={12} /> Điểm đạt (%)</label>
                <div className="flex items-center gap-4">
                  <input type="range" min={0} max={100} step={5} value={passingScore} onChange={e => setPassingScore(Number(e.target.value))}
                    className="flex-1 accent-primary-brand" />
                  <span className="text-sm font-black text-primary-brand w-8">{passingScore}%</span>
                </div>
              </div>

              <div className="space-y-3 pt-2">
                <label className="flex items-center gap-3 p-3 rounded-xl border border-border hover:bg-muted/50 cursor-pointer transition-colors">
                  <input type="checkbox" checked={shuffleQuestions} onChange={e => setShuffleQuestions(e.target.checked)}
                    className="w-4 h-4 rounded text-primary-brand focus:ring-primary-brand" />
                  <div className="flex-1">
                    <div className="text-xs font-black text-foreground flex items-center gap-1.5"><Shuffle size={12} /> Trộn câu hỏi</div>
                    <p className="text-[10px] text-muted-foreground font-medium">Thay đổi thứ tự câu hỏi cho mỗi lượt làm</p>
                  </div>
                </label>

                <label className="flex items-center gap-3 p-3 rounded-xl border border-border hover:bg-muted/50 cursor-pointer transition-colors">
                  <input type="checkbox" checked={shuffleOptions} onChange={e => setShuffleOptions(e.target.checked)}
                    className="w-4 h-4 rounded text-primary-brand focus:ring-primary-brand" />
                  <div className="flex-1">
                    <div className="text-xs font-black text-foreground flex items-center gap-1.5"><Shuffle size={12} /> Trộn đáp án</div>
                    <p className="text-[10px] text-muted-foreground font-medium">Thay đổi thứ tự A/B/C/D</p>
                  </div>
                </label>

                <label className="flex items-center gap-3 p-3 rounded-xl border border-border hover:bg-muted/50 cursor-pointer transition-colors">
                  <input type="checkbox" checked={showExplanation} onChange={e => setShowExplanation(e.target.checked)}
                    className="w-4 h-4 rounded text-primary-brand focus:ring-primary-brand" />
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
                        className="h-8 bg-primary-brand hover:bg-primary-brand-dark text-white rounded-lg font-bold text-xs gap-1.5 shrink-0">
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
                className="w-full rounded-xl border border-border bg-muted/50 px-3 py-2 text-sm font-black outline-none focus:ring-2 focus:ring-primary-brand-light" />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-muted-foreground uppercase flex items-center gap-1.5"><RotateCcw size={12} /> Lần thử</label>
              <input type="number" min={0} value={maxAttempts} onChange={e => setMaxAttempts(Number(e.target.value))}
                className="w-full rounded-xl border border-border bg-muted/50 px-3 py-2 text-sm font-black outline-none focus:ring-2 focus:ring-primary-brand-light" />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-muted-foreground uppercase flex items-center gap-1.5"><Target size={12} /> Điểm đạt: {passingScore}%</label>
            <input type="range" min={0} max={100} step={5} value={passingScore} onChange={e => setPassingScore(Number(e.target.value))}
              className="w-full accent-primary-brand" />
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
                  className="w-4 h-4 rounded text-primary-brand focus:ring-primary-brand" />
              </label>
            ))}
          </div>
        </div>

        <div className="p-6 pt-0 flex gap-3">
          <Button variant="outline" onClick={onClose} className="flex-1 rounded-xl font-bold text-xs h-11">HỦY</Button>
          <Button onClick={() => void handleSave()} disabled={saving}
            className="flex-1 bg-primary-brand hover:bg-primary-brand-dark text-white rounded-xl font-bold text-xs h-11 gap-2">
            {saving ? <Loader2 size={14} className="animate-spin" /> : 'LƯU'}
          </Button>
        </div>
      </div>
    </div>
  );
}
