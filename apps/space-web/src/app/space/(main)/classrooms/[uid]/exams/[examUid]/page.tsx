'use client';

import { use, useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  AlertCircle,
  BarChart3,
  Calendar,
  Camera,
  Clock,
  Download,
  Eye,
  FileText,
  Loader2,
  Monitor,
  MoreVertical,
  Save,
  Search,
  ShieldAlert,
  Timer,
  Users,
  Wand2,
  Wifi,
  WifiOff,
  X,
} from 'lucide-react';
import { Button } from '@shared/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@shared/components/ui/card';
import { Badge } from '@shared/components/ui/badge';
import { Input } from '@shared/components/ui/input';
import { Label } from '@shared/components/ui/label';
import { Textarea } from '@shared/components/ui/textarea';
import { Progress } from '@shared/components/ui/progress';
import { Switch } from '@shared/components/ui/switch';
import { Separator } from '@shared/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@shared/components/ui/avatar';
import { Tabs, TabsList, TabsTrigger } from '@shared/components/ui/tabs';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@shared/components/ui/dropdown-menu';
import { classroomApi, examApi, type ClassroomProps, type ClassroomMemberProps, type Exam, type ExamSession, type ExamSubmission } from '@/lib/api';
import { SubmissionAuditModal } from '@/components/exam/submission-audit-modal';
import { useTranslation } from '@shared/components/LocaleProvider';
import { toast } from 'sonner';

type SubmissionFilter = 'submitted' | 'missing';
type ExamDetailTab = 'submissions' | 'online';
type GradeFilter = 'all' | 'submitted' | 'missing' | 'graded' | 'ungraded';
type GradeRow = { member: ClassroomMemberProps; submission: ExamSubmission | null };

interface OpenExamSettings {
  camera_required: boolean;
  duration_minutes: number;
  late_threshold_minutes: number;
  max_face_warnings: number;
}

export default function SpaceExamDetailPage({ params }: { params: Promise<{ uid: string; examUid: string }> }) {
  const { uid, examUid } = use(params);
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t, formatDateTime } = useTranslation();
  const [classroom, setClassroom] = useState<ClassroomProps | null>(null);
  const [exam, setExam] = useState<Exam | null>(null);
  const [members, setMembers] = useState<ClassroomMemberProps[]>([]);
  const [submissions, setSubmissions] = useState<ExamSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState<GradeFilter>('all');
  const [query, setQuery] = useState('');
  const [sessions, setSessions] = useState<ExamSession[]>([]);
  const [auditSubmission, setAuditSubmission] = useState<ExamSubmission | null>(null);
  const [sessionLoading, setSessionLoading] = useState(false);
  const [sessionError, setSessionError] = useState('');
  const [sessionAction, setSessionAction] = useState(false);
  const [openSettings, setOpenSettings] = useState<OpenExamSettings>({
    camera_required: false,
    duration_minutes: 60,
    late_threshold_minutes: 5,
    max_face_warnings: 3,
  });

  // Grade table state (moved from modal)
  const [gradeTableLoading, setGradeTableLoading] = useState(false);
  const membersRef = useRef<ClassroomMemberProps[]>([]);
  const [gradeTableError, setGradeTableError] = useState('');
  const [activeStudentId, setActiveStudentId] = useState<string | null>(null);
  const [grade, setGrade] = useState('');
  const [feedback, setFeedback] = useState('');
  const [saving, setSaving] = useState(false);
  const [aiGradingTarget, setAiGradingTarget] = useState<string | null>(null);

  const activeTab = (searchParams.get('tab') as ExamDetailTab) || 'submissions';

  const loadGradeTable = useCallback(async () => {
    setGradeTableLoading(true);
    setGradeTableError('');
    try {
      const [memberData, submissionData] = await Promise.all([
        classroomApi.getClassroomMembers(uid),
        examApi.listSubmissions(examUid),
      ]);
      const studentsOnly = memberData.filter(member => member.role === 'student' && member.status === 'approved');
      setMembers(studentsOnly);
      membersRef.current = studentsOnly;
      setSubmissions(submissionData);
    } catch (err: unknown) {
      setGradeTableError(err instanceof Error ? err.message : t('classroom.ui.score_load_error'));
    } finally {
      setGradeTableLoading(false);
    }
  }, [uid, examUid, t]);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError('');
        const [classroomData, examData] = await Promise.all([
          classroomApi.getClassroom(uid),
          examApi.retrieve(examUid),
        ]);
        setClassroom(classroomData);
        setExam(examData);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Không thể tải chi tiết bài kiểm tra');
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, [examUid, uid]);

  useEffect(() => {
    if (activeTab !== 'submissions') return;
    void loadGradeTable();
  }, [activeTab, loadGradeTable]);

  // Pre-fill modal settings from exam data
  useEffect(() => {
    if (!exam) return;
    setOpenSettings({
      camera_required: exam.camera_required ?? false,
      duration_minutes: exam.duration_seconds ? Math.round(exam.duration_seconds / 60) : 60,
      late_threshold_minutes: exam.late_threshold_seconds ? Math.round(exam.late_threshold_seconds / 60) : 5,
      max_face_warnings: typeof exam.max_face_warnings === 'number' ? exam.max_face_warnings : 3,
    });
  }, [exam]);

  useEffect(() => {
    if (activeTab !== 'online') return;
    let cancelled = false;
    const loadSessions = async () => {
      try {
        setSessionLoading(true);
        setSessionError('');
        if (membersRef.current.length === 0) {
          const memberData = await classroomApi.getClassroomMembers(uid);
          if (cancelled) return;
          const studentsOnly = memberData.filter((m: ClassroomMemberProps) => m.role === 'student' && m.status === 'approved');
          setMembers(studentsOnly);
          membersRef.current = studentsOnly;
        }
        const data = await examApi.listOnlineSessions(examUid);
        if (cancelled) return;
        setSessions(data);
      } catch (err: unknown) {
        if (!cancelled) {
          setSessionError(err instanceof Error ? err.message : 'Không thể tải phiên thi');
        }
      } finally {
        if (!cancelled) setSessionLoading(false);
      }
    };
    void loadSessions();
    return () => {
      cancelled = true;
    };
  }, [activeTab, examUid, uid]);

  const handleOpenOnline = async () => {
    try {
      setSessionAction(true);
      setSessionError('');
      const result = await examApi.openOnline(examUid, {
        camera_required: openSettings.camera_required,
        duration_seconds: openSettings.duration_minutes * 60,
        late_threshold_seconds: openSettings.late_threshold_minutes * 60,
        max_face_warnings: openSettings.max_face_warnings,
      });
      setSessions(result.sessions);
    } catch (err: unknown) {
      setSessionError(err instanceof Error ? err.message : 'Không thể mở phiên thi');
    } finally {
      setSessionAction(false);
    }
  };

  const handleCloseOnline = async () => {
    try {
      setSessionAction(true);
      setSessionError('');
      await examApi.closeOnline(examUid);
      const data = await examApi.listOnlineSessions(examUid);
      setSessions(data);
    } catch (err: unknown) {
      setSessionError(err instanceof Error ? err.message : 'Không thể đóng phiên thi');
    } finally {
      setSessionAction(false);
    }
  };

  const subMap = useMemo(() => new Map(submissions.map(s => [s.student_id, s])), [submissions]);
  const rows = useMemo<GradeRow[]>(
    () => members.map(member => ({ member, submission: subMap.get(member.member_id) || null })),
    [members, subMap]
  );
  const activeRow = rows.find(row => row.member.member_id === activeStudentId) || null;

  const submitted = rows.filter(row => row.submission).length;
  const missing = Math.max(0, members.length - submitted);
  const gradedSubmissions = rows.map(r => r.submission).filter((s): s is ExamSubmission => s?.grade != null);
  const graded = gradedSubmissions.length;
  const submissionRate = members.length > 0 ? Math.round((submitted / members.length) * 100) : 0;
  const gradingRate = submitted > 0 ? Math.round((graded / submitted) * 100) : 0;
  const averageScore = graded > 0
    ? gradedSubmissions.reduce((acc, s) => acc + (s.grade ?? 0), 0) / graded
    : null;
  const avg = averageScore != null ? averageScore.toFixed(1) : '--';
  const averageRate = averageScore != null ? Math.round(averageScore * 10) : 0;

  const normalizedQuery = query.trim().toLowerCase();
  const visibleRows = rows.filter(row => {
    const submission = row.submission;
    const searchable = `${row.member.member_name} ${row.member.member_id}`.toLowerCase();
    if (normalizedQuery && !searchable.includes(normalizedQuery)) return false;
    if (filter === 'submitted') return Boolean(submission);
    if (filter === 'missing') return !submission;
    if (filter === 'graded') return submission?.grade != null;
    if (filter === 'ungraded') return Boolean(submission) && submission?.grade == null;
    return true;
  });

  const filters: { value: GradeFilter; label: string; count: number }[] = [
    { value: 'all', label: t('classroom.ui.grade_table_filter_all'), count: rows.length },
    { value: 'submitted', label: t('classroom.ui.grade_table_filter_submitted'), count: submitted },
    { value: 'missing', label: t('classroom.ui.grade_table_filter_missing'), count: missing },
    { value: 'graded', label: t('classroom.ui.grade_table_filter_graded'), count: graded },
    { value: 'ungraded', label: t('classroom.ui.grade_table_filter_ungraded'), count: Math.max(0, submitted - graded) },
  ];

  const openSubmission = (row: GradeRow) => {
    setActiveStudentId(row.member.member_id);
    setGrade(row.submission?.grade != null ? String(row.submission.grade) : '');
    setFeedback(row.submission?.feedback || '');
  };

  const handleSaveGrade = async () => {
    if (!activeRow?.submission) return;
    const score = Number(grade);
    if (grade.trim() === '' || !Number.isFinite(score) || score < 0 || score > 10) {
      toast.error(t('classroom.ui.score_range_error'));
      return;
    }
    try {
      setSaving(true);
      const updated = await examApi.gradeSubmission(activeRow.submission.uid, {
        grade: score,
        feedback: feedback.trim(),
      });
      setSubmissions(prev => prev.map(s => s.uid === updated.uid ? updated : s));
      toast.success(t('classroom.ui.score_save_success'));
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : t('classroom.ui.score_save_error'));
    } finally {
      setSaving(false);
    }
  };

  const buildAIGradeRequest = (defaultOverwrite: boolean) => {
    const rubric = window.prompt(
      t('classroom.ui.ai_grading_prompt_hint'),
      t('classroom.ui.ai_grading_prompt_default')
    );
    if (rubric === null) return null;
    return {
      rubric: rubric.trim(),
      max_grade: 10,
      overwrite: defaultOverwrite,
      top_k: 5,
    };
  };

  const handleAIGradeSubmission = async (row: GradeRow) => {
    if (!row.submission || aiGradingTarget) return;
    const request = buildAIGradeRequest(row.submission.grade != null);
    if (!request) return;

    setAiGradingTarget(row.submission.uid);
    try {
      const updated = await examApi.aiGradeSubmission(row.submission.uid, request);
      setSubmissions(prev => prev.map(s => s.uid === updated.uid ? updated : s));
      if (activeStudentId === row.member.member_id) {
        setGrade(updated.grade != null ? String(updated.grade) : '');
        setFeedback(updated.feedback || '');
      }
      toast.success(t('classroom.ui.ai_graded_one', undefined, { name: row.member.member_name }));
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : t('classroom.ui.ai_cannot_grade'));
    } finally {
      setAiGradingTarget(null);
    }
  };

  const handleAIGradeAll = async () => {
    if (aiGradingTarget) return;
    const ungradedCount = rows.filter(row => row.submission && row.submission.grade == null).length;
    if (ungradedCount === 0) {
      const overwrite = window.confirm(t('classroom.ui.ai_grade_confirm_overwrite'));
      if (!overwrite) return;
    }
    const request = buildAIGradeRequest(ungradedCount === 0);
    if (!request) return;

    setAiGradingTarget('all');
    try {
      const result = await examApi.aiGradeExamSubmissions(examUid, request);
      const updatedByUid = new Map(result.results.map(item => [item.submission.uid, item.submission]));
      setSubmissions(prev => prev.map(s => updatedByUid.get(s.uid) || s));
      toast.success(t('classroom.ui.ai_graded_summary', undefined, { graded: result.graded, total: result.total }));
      if (result.failed > 0) {
        toast.warning(t('classroom.ui.ai_grade_partial_failure', undefined, { count: result.failed }));
      }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : t('classroom.ui.score_ai_regrade_failed'));
    } finally {
      setAiGradingTarget(null);
    }
  };

  // Keyboard: ESC closes drawer
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && activeStudentId) {
        setActiveStudentId(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeStudentId]);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !exam) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center p-4">
        <Card className="w-full max-w-md rounded-2xl text-center">
          <CardHeader>
            <CardTitle className="text-base font-semibold">Không thể tải dữ liệu</CardTitle>
            <CardDescription className="font-medium">{error || 'Không tìm thấy bài kiểm tra'}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              onClick={() => router.push(`/space/classrooms/${uid}/details?tab=exams`)}
              className="w-full"
            >
              Quay lại lớp học
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <main className="mx-auto w-full max-w-7xl space-y-4 p-4">
        <Card className="min-w-0 overflow-hidden rounded-2xl gap-0">
          <div className="border-b border-border p-4">
            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
              <div className="min-w-0">
                <div className="text-[10px] font-semibold uppercase tracking-widest text-primary">Chi tiết bài kiểm tra</div>
                <h2 className="mt-1 text-xl font-semibold tracking-tight text-foreground">{exam.title}</h2>
                <p className="mt-1.5 text-sm font-medium leading-relaxed text-muted-foreground">{exam.description || 'Không có mô tả'}</p>
              </div>
              <div className="flex shrink-0 flex-col items-end gap-2">
                <Button asChild variant="outline" size="sm" className="rounded-xl text-[11px] font-semibold uppercase tracking-wider text-primary">
                  <a href={`/space/classrooms/${uid}/exams/${examUid}/analytics`} target="_blank" rel="noopener noreferrer">
                    <BarChart3 />
                    Xem Dashboard
                  </a>
                </Button>
                <div className="rounded-xl border border-border bg-muted/40 px-4 py-3 text-right">
                  <div className="flex items-center justify-end gap-1.5 text-[10px] font-semibold uppercase text-muted-foreground">
                    <Calendar />
                    Due date
                  </div>
                  <div className="mt-1 text-xs font-semibold text-foreground">{formatDateTime(exam.due_date)}</div>
                </div>
              </div>
            </div>
          </div>

          <div className="border-b border-border px-4 pt-3 pb-1">
            <Tabs
              value={activeTab}
              onValueChange={(value) => {
                const next = (value as ExamDetailTab) || 'submissions';
                router.push(`/space/classrooms/${uid}/exams/${examUid}?tab=${next}`);
              }}
            >
              <TabsList>
                <TabsTrigger value="submissions">Danh sách bài nộp</TabsTrigger>
                {exam.exam_mode === 'online' && (
                  <TabsTrigger value="online">
                    <Monitor />
                    Thi trực tuyến
                  </TabsTrigger>
                )}
              </TabsList>
            </Tabs>
          </div>

          {activeTab === 'online' ? (
            <div className="space-y-4 p-4">
              {exam.exam_mode !== 'online' ? (
                <div className="rounded-2xl border border-dashed border-border bg-muted/50 py-12 text-center">
                  <Monitor size={32} className="mx-auto mb-3 text-muted-foreground/60" />
                  <p className="text-sm font-bold text-muted-foreground">Bài kiểm tra này không phải hình thức online</p>
                </div>
              ) : (
                <>
                  <Card className="rounded-2xl gap-0">
                    <div className="flex items-center gap-2 border-b border-border px-4 py-3">
                      <Monitor className="size-3.5 text-primary" />
                      <span className="text-[11px] font-semibold uppercase tracking-widest text-foreground">Cài đặt phiên thi</span>
                      <span className="ml-auto text-[10px] font-medium text-muted-foreground">Áp dụng khi nhấn "Mở phiên thi"</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
                      <div className="flex flex-col gap-2 px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          <Timer className="size-3 text-primary" />
                          <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Thời gian làm bài</span>
                          <span className="text-destructive text-[10px] font-semibold">*</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Input
                            type="number"
                            min={1}
                            max={360}
                            value={openSettings.duration_minutes}
                            onChange={e => setOpenSettings(s => ({ ...s, duration_minutes: Math.max(1, Number(e.target.value)) }))}
                            className="h-9 w-20 px-2 text-sm font-semibold"
                          />
                          <span className="text-xs font-medium text-muted-foreground">phút</span>
                        </div>
                        <p className="text-[10px] text-muted-foreground">Tính từ lúc học sinh bắt đầu</p>
                      </div>

                      <div className="flex flex-col gap-2 px-4 py-3 sm:border-l border-border">
                        <div className="flex items-center gap-1.5">
                          <Clock className="size-3 text-amber-500" />
                          <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Cho phép vào muộn</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Input
                            type="number"
                            min={0}
                            max={60}
                            value={openSettings.late_threshold_minutes}
                            onChange={e => setOpenSettings(s => ({ ...s, late_threshold_minutes: Math.max(0, Number(e.target.value)) }))}
                            className="h-9 w-20 px-2 text-sm font-semibold"
                          />
                          <span className="text-xs font-medium text-muted-foreground">phút</span>
                        </div>
                        <p className="text-[10px] text-muted-foreground">0 = không cho vào sau khi mở</p>
                      </div>

                      <div className="flex flex-col gap-2 px-4 py-3 sm:border-l border-border">
                        <div className="flex items-center gap-1.5">
                          <Camera className="size-3 text-emerald-500" />
                          <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Yêu cầu camera</span>
                        </div>
                        <Switch
                          checked={openSettings.camera_required}
                          onCheckedChange={(checked) => setOpenSettings(s => ({ ...s, camera_required: checked }))}
                        />
                        <p className="text-[10px] text-muted-foreground">
                          {openSettings.camera_required ? 'Bắt buộc nhận diện khuôn mặt' : 'Không bắt buộc camera'}
                        </p>
                      </div>

                      <div className="flex flex-col gap-2 px-4 py-3 sm:border-l border-border">
                        <div className="flex items-center gap-1.5">
                          <ShieldAlert className="size-3 text-destructive" />
                          <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Số lần nhận diện</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Input
                            type="number"
                            min={0}
                            max={20}
                            value={openSettings.max_face_warnings}
                            onChange={e => setOpenSettings(s => ({ ...s, max_face_warnings: Math.max(0, Number(e.target.value)) }))}
                            className="h-9 w-20 px-2 text-sm font-semibold"
                          />
                          <span className="text-xs font-medium text-muted-foreground">lần</span>
                        </div>
                        <p className="text-[10px] text-muted-foreground">0 = không giới hạn · Vượt → nộp bài bắt buộc</p>
                      </div>
                    </div>

                    <Separator />

                    <div className="flex items-center justify-between px-4 py-3">
                      {sessionError && (
                        <p className="text-xs font-medium text-destructive">{sessionError}</p>
                      )}
                      <div className="ml-auto flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleCloseOnline}
                          disabled={sessionAction || sessions.every(s => s.token_status !== 'pending' && s.token_status !== 'active')}
                          className="rounded-xl text-destructive border-destructive/30 hover:bg-destructive/10"
                        >
                          {sessionAction ? <Loader2 className="animate-spin" /> : <WifiOff />}
                          Đóng phiên
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => void handleOpenOnline()}
                          disabled={sessionAction || openSettings.duration_minutes <= 0}
                        >
                          {sessionAction ? <Loader2 className="animate-spin" /> : <Wifi />}
                          Mở phiên thi
                        </Button>
                      </div>
                    </div>
                  </Card>

                  <Card className="overflow-hidden rounded-2xl gap-0 p-0">
                    {sessionLoading ? (
                      <div className="py-10 text-center"><Loader2 className="mx-auto animate-spin text-primary" /></div>
                    ) : sessions.length === 0 ? (
                      <div className="py-10 text-center text-sm font-medium text-muted-foreground">Chưa có phiên thi nào. Nhấn "Mở phiên thi" để bắt đầu.</div>
                    ) : (
                      <div className="overflow-auto">
                        <table className="w-full min-w-[640px] text-left text-sm">
                          <thead className="bg-muted/50">
                            <tr className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                              <th className="px-4 py-3">Học sinh</th>
                              <th className="px-4 py-3">Token</th>
                              <th className="px-4 py-3">Trạng thái</th>
                              <th className="px-4 py-3">Hết hạn link</th>
                              <th className="px-4 py-3">Bắt đầu</th>
                              <th className="px-4 py-3">Kết thúc</th>
                            </tr>
                          </thead>
                          <tbody>
                            {sessions.map(s => {
                              const sessionStudent = members.find(m => m.member_id === s.student_id);
                              return (
                              <tr key={s.uid} className="border-t border-border">
                                <td className="px-4 py-3 text-xs font-medium text-muted-foreground">{sessionStudent?.member_name || '--'}</td>
                                <td className="px-4 py-3">
                                  <code className="rounded bg-muted px-1.5 py-0.5 text-[11px] font-medium text-foreground">{s.token}</code>
                                </td>
                                <td className="px-4 py-3">
                                  <Badge variant={getSessionStatusVariant(s.token_status)}>
                                    {getSessionStatusLabel(s.token_status)}
                                  </Badge>
                                </td>
                                <td className="px-4 py-3 text-xs font-medium text-muted-foreground">{s.token_expires_at ? formatDateTime(s.token_expires_at) : '--'}</td>
                                <td className="px-4 py-3 text-xs font-medium text-muted-foreground">{s.started_at ? formatDateTime(s.started_at) : '--'}</td>
                                <td className="px-4 py-3 text-xs font-medium text-muted-foreground">{s.ends_at ? formatDateTime(s.ends_at) : '--'}</td>
                              </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </Card>
                </>
              )}
            </div>
          ) : (
            <div className="space-y-4 p-4">
              <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                <Card className="rounded-xl border-primary/30 bg-primary/5 p-3 gap-0">
                  <div className="flex items-start justify-between">
                    <p className="text-[11px] font-medium text-muted-foreground">{t('classroom.ui.grade_table_submission_rate')}</p>
                    <span className="text-lg font-semibold tracking-tight text-primary">{gradeTableLoading ? '--' : `${submissionRate}%`}</span>
                  </div>
                  <p className="mt-1 text-[11px] text-muted-foreground">{gradeTableLoading ? t('classroom.ui.students_loading') : t('classroom.ui.grade_table_submission_rate_detail', undefined, { submitted, total: members.length })}</p>
                  <Progress value={submissionRate} className="mt-3 h-1.5" />
                </Card>
                <Card className="rounded-xl border-emerald-200 bg-emerald-50/50 p-3 gap-0">
                  <div className="flex items-start justify-between">
                    <p className="text-[11px] font-medium text-muted-foreground">{t('classroom.ui.grade_table_avg_score')}</p>
                    <span className="text-lg font-semibold tracking-tight text-emerald-700">{gradeTableLoading ? '--' : avg}</span>
                  </div>
                  <p className="mt-1 text-[11px] text-muted-foreground">{graded > 0 ? t('classroom.ui.grade_table_avg_score_detail', undefined, { count: graded }) : t('classroom.ui.grade_table_avg_score_empty')}</p>
                  <Progress value={averageRate} className="mt-3 h-1.5 [&>div>div]:bg-emerald-500" />
                </Card>
                <Card className="rounded-xl p-3 gap-0">
                  <p className="text-[11px] font-medium text-muted-foreground">{t('classroom.ui.grade_table_pending_grading')}</p>
                  <p className="mt-1 text-xl font-semibold tracking-tight text-primary">{gradeTableLoading ? '--' : Math.max(0, submitted - graded)}</p>
                  <p className="mt-1 text-[11px] text-muted-foreground">{t('classroom.ui.grade_table_pending_detail', undefined, { rate: gradingRate })}</p>
                </Card>
                <Card className="rounded-xl border-destructive/30 bg-destructive/10 p-3 gap-0">
                  <p className="text-[11px] font-medium text-muted-foreground">{t('classroom.ui.grade_table_missing_label')}</p>
                  <p className="mt-1 text-xl font-semibold tracking-tight text-destructive">{gradeTableLoading ? '--' : missing}</p>
                  <p className="mt-1 text-[11px] text-muted-foreground">{t('classroom.ui.grade_table_missing_detail')}</p>
                </Card>
              </div>

              <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div className="relative w-full xl:max-w-sm">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
                  <Input
                    value={query}
                    onChange={event => setQuery(event.target.value)}
                    placeholder={t('classroom.ui.grade_table_search_placeholder')}
                    className="h-10 pl-10 pr-4"
                  />
                </div>
                <div className="flex gap-1.5 overflow-x-auto pb-1">
                  {filters.map(option => (
                    <Button
                      key={option.value}
                      type="button"
                      variant={filter === option.value ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setFilter(option.value)}
                      className="h-9 shrink-0 rounded-lg gap-2 px-3 text-xs font-medium"
                    >
                      {option.label}
                      <Badge variant={filter === option.value ? 'secondary' : 'outline'} className="rounded px-1.5 py-0 text-[10px]">
                        {gradeTableLoading ? '--' : option.count}
                      </Badge>
                    </Button>
                  ))}
                </div>
                <Button
                  type="button"
                  onClick={() => void handleAIGradeAll()}
                  disabled={gradeTableLoading || aiGradingTarget !== null || submitted === 0}
                  size="sm"
                  className="h-9 shrink-0 rounded-lg px-3 text-xs"
                >
                  {aiGradingTarget === 'all' ? <Loader2 className="animate-spin" /> : <Wand2 />}
                  {t('classroom.ui.grade_table_ai_grade_all')}
                </Button>
              </div>

              {gradeTableLoading ? (
                <div className="flex min-h-56 items-center justify-center rounded-2xl border border-border bg-card text-muted-foreground">
                  <Loader2 className="size-8 animate-spin text-primary" />
                  <p className="ml-3 text-sm font-medium">{t('classroom.ui.grade_table_loading')}</p>
                </div>
              ) : gradeTableError ? (
                <div className="flex min-h-56 flex-col items-center justify-center rounded-2xl border border-destructive/30 bg-card p-6 text-center">
                  <AlertCircle className="size-8 mb-3 text-destructive" />
                  <p className="text-sm font-semibold text-foreground">{t('classroom.ui.score_load_error')}</p>
                  <p className="mt-1 max-w-md text-xs font-medium text-muted-foreground">{gradeTableError}</p>
                  <Button onClick={() => void loadGradeTable()} className="mt-4 rounded-xl">
                    {t('classroom.ui.grade_table_retry')}
                  </Button>
                </div>
              ) : members.length === 0 ? (
                <GradeTableEmptyState
                  title={t('classroom.ui.grade_table_empty_no_students_title')}
                  description={t('classroom.ui.grade_table_empty_no_students_desc')}
                />
              ) : visibleRows.length === 0 ? (
                <GradeTableEmptyState
                  title={t('classroom.ui.grade_table_empty_no_match_title')}
                  description={t('classroom.ui.grade_table_empty_no_match_desc')}
                />
              ) : (
                <Card className="overflow-auto rounded-xl p-0 gap-0">
                  <table className="w-full min-w-[850px] text-left text-sm">
                    <thead className="sticky top-0 z-[1] border-b border-border bg-muted/50 backdrop-blur">
                      <tr className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                        <th className="px-4 py-3">{t('classroom.ui.grade_table_col_student')}</th>
                        <th className="px-4 py-3">{t('classroom.ui.grade_table_col_submission')}</th>
                        <th className="px-4 py-3">{t('classroom.ui.grade_table_col_submitted_at')}</th>
                        <th className="px-4 py-3">{t('classroom.ui.grade_table_col_grade')}</th>
                        <th className="px-4 py-3">{t('classroom.ui.grade_table_col_grading')}</th>
                        <th className="px-4 py-3 text-right">{t('classroom.ui.grade_table_col_actions')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {visibleRows.map(row => {
                        const submission = row.submission;
                        return (
                          <tr key={row.member.member_id} className="border-b border-border last:border-b-0 transition-colors hover:bg-muted/40">
                            <td className="px-4 py-3">
                              <StudentIdentity member={row.member} />
                            </td>
                            <td className="px-4 py-3">
                              <SubmissionBadge submission={submission} />
                            </td>
                            <td className="px-4 py-3 text-xs font-medium text-muted-foreground">
                              {submission?.submitted_at ? formatDateTime(submission.submitted_at) : '--'}
                            </td>
                            <td className="px-4 py-3">
                              {submission?.grade != null ? (
                                <span className={`text-sm font-semibold ${submission.grade >= 5 ? 'text-emerald-700' : 'text-destructive'}`}>
                                  {submission.grade.toFixed(1)}
                                </span>
                              ) : <span className="text-sm font-medium text-muted-foreground/60">--</span>}
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex flex-wrap items-center gap-1.5">
                                <GradingBadge submission={submission} />
                                {submission?.grading_method === 'ai' && (
                                  <Badge variant="secondary" className="rounded-full px-2.5 py-1 text-[10px] font-semibold bg-primary/10 text-primary border-primary/20">
                                    {t('classroom.ui.grade_table_ai_graded_badge')}
                                  </Badge>
                                )}
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex justify-end gap-1.5">
                                {submission ? (
                                  <>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      disabled={aiGradingTarget !== null}
                                      className="h-8 rounded-lg text-primary border-primary/30 hover:bg-primary/10"
                                      onClick={() => void handleAIGradeSubmission(row)}
                                    >
                                      {aiGradingTarget === submission.uid ? <Loader2 className="animate-spin" /> : <Wand2 />}
                                      {t('classroom.ui.grade_table_ai_grade_single')}
                                    </Button>
                                    <Button size="sm" className="h-8 rounded-lg" onClick={() => openSubmission(row)}>
                                      {submission.grade == null ? t('classroom.ui.grade_table_action_grade') : t('classroom.ui.grade_table_action_view_grade')}
                                    </Button>
                                    <DropdownMenu>
                                      <DropdownMenuTrigger asChild>
                                        <Button variant="outline" size="icon" className="h-8 w-8 rounded-lg">
                                          <MoreVertical />
                                        </Button>
                                      </DropdownMenuTrigger>
                                      <DropdownMenuContent align="end" className="w-44">
                                        <DropdownMenuItem onClick={() => openSubmission(row)} className="gap-2">
                                          <Eye /> {t('classroom.ui.grade_table_action_view')}
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => setAuditSubmission(submission)} className="gap-2">
                                          <Eye /> Audit log
                                        </DropdownMenuItem>
                                        {submission.resource_url && (
                                          <DropdownMenuItem
                                            onClick={() => window.open(submission.resource_url!, '_blank', 'noopener,noreferrer')}
                                            className="gap-2"
                                          >
                                            <Download /> {t('classroom.ui.grade_table_action_open_file')}
                                          </DropdownMenuItem>
                                        )}
                                      </DropdownMenuContent>
                                    </DropdownMenu>
                                  </>
                                ) : (
                                  <span className="text-xs font-medium text-muted-foreground">{t('classroom.ui.grade_table_no_submission')}</span>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </Card>
              )}
            </div>
          )}
        </Card>

      </main>

      {auditSubmission && exam && (
        <SubmissionAuditModal
          open={!!auditSubmission}
          onOpenChange={(open) => !open && setAuditSubmission(null)}
          submission={auditSubmission}
          exam={{ uid: exam.uid, title: exam.title }}
        />
      )}

      {activeRow?.submission && (
        <SubmissionGradingDrawer
          row={{ member: activeRow.member, submission: activeRow.submission }}
          grade={grade}
          feedback={feedback}
          saving={saving}
          aiGrading={aiGradingTarget === activeRow.submission.uid}
          onGradeChange={setGrade}
          onFeedbackChange={setFeedback}
          onSave={() => void handleSaveGrade()}
          onAIGrade={() => void handleAIGradeSubmission(activeRow)}
          onClose={() => setActiveStudentId(null)}
        />
      )}
    </div>
  );
}

function GradeTableEmptyState({ title, description }: { title: string; description: string }) {
  return (
    <div className="flex min-h-48 flex-col items-center justify-center rounded-xl border border-dashed border-border bg-card p-6 text-center text-muted-foreground">
      <span className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-muted/50">
        <Users className="size-5 text-muted-foreground" />
      </span>
      <p className="text-sm font-semibold text-foreground">{title}</p>
      <p className="mt-1 text-xs font-medium">{description}</p>
    </div>
  );
}

function StudentIdentity({ member }: { member: ClassroomMemberProps }) {
  return (
    <div className="flex items-center gap-2.5">
      <Avatar className="size-8 rounded-lg">
        {member.member_avatar ? (
          <AvatarImage src={member.member_avatar} alt={member.member_name} className="rounded-lg" />
        ) : null}
        <AvatarFallback className="rounded-lg bg-primary/10 text-primary text-xs font-semibold">
          {member.member_name.charAt(0).toUpperCase()}
        </AvatarFallback>
      </Avatar>
      <div className="min-w-0">
        <p className="truncate text-sm font-medium text-foreground">{member.member_name}</p>
      </div>
    </div>
  );
}

function SubmissionBadge({ submission }: { submission: ExamSubmission | null }) {
  const { t } = useTranslation();
  if (!submission) {
    return <Badge variant="outline" className="rounded-full px-2.5 py-1 text-[10px] font-semibold">{t('classroom.ui.score_status_not_submitted')}</Badge>;
  }
  return <Badge variant="secondary" className="rounded-full px-2.5 py-1 text-[10px] font-semibold bg-primary/10 text-primary border-primary/20">{t('classroom.ui.score_status_submitted')}</Badge>;
}

function GradingBadge({ submission }: { submission: ExamSubmission | null }) {
  const { t } = useTranslation();
  if (!submission) return <span className="text-xs font-medium text-muted-foreground/60">--</span>;
  if (submission.grade != null) {
    return <Badge variant="secondary" className="rounded-full px-2.5 py-1 text-[10px] font-semibold bg-emerald-50 text-emerald-700 border-emerald-200">{t('classroom.ui.score_status_graded')}</Badge>;
  }
  return <Badge variant="secondary" className="rounded-full px-2.5 py-1 text-[10px] font-semibold bg-orange-50 text-orange-700 border-orange-200">{t('classroom.ui.score_status_pending')}</Badge>;
}

function SubmissionGradingDrawer({
  row,
  grade,
  feedback,
  saving,
  aiGrading,
  onGradeChange,
  onFeedbackChange,
  onSave,
  onAIGrade,
  onClose,
}: {
  row: { member: ClassroomMemberProps; submission: ExamSubmission };
  grade: string;
  feedback: string;
  saving: boolean;
  aiGrading: boolean;
  onGradeChange: (value: string) => void;
  onFeedbackChange: (value: string) => void;
  onSave: () => void;
  onAIGrade: () => void;
  onClose: () => void;
}) {
  const { t, formatDateTime } = useTranslation();
  const { member, submission } = row;
  const isEssay = submission.submission_type === 'essay';
  const resourceUrl = submission.resource_url || (!isEssay ? submission.content : '');

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-foreground/30">
      <Button type="button" aria-label={t('classroom.ui.close_submission_detail')} className="absolute inset-0" onClick={onClose} />
      <aside className="relative flex h-full w-full max-w-[480px] flex-col bg-card shadow-2xl animate-in slide-in-from-right duration-200">
        <div className="flex items-start justify-between gap-4 border-b border-border p-4">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-primary">{t('classroom.ui.submission_detail_title')}</p>
            <div className="mt-3"><StudentIdentity member={member} /></div>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} aria-label={t('classroom.ui.close_submission_detail')}>
            <X />
          </Button>
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto p-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-lg border border-border bg-muted/40 p-3">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">{t('classroom.ui.submission_field_submitted_at')}</p>
              <p className="mt-1 text-xs font-medium text-foreground">{submission.submitted_at ? formatDateTime(submission.submitted_at) : '--'}</p>
            </div>
            <div className="rounded-lg border border-border bg-muted/40 p-3">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">{t('classroom.ui.submission_field_status')}</p>
              <p className="mt-1 text-xs font-medium text-foreground">{submission.grade != null ? t('classroom.ui.score_status_graded') : t('classroom.ui.score_status_pending')}</p>
            </div>
          </div>

          <section>
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">{t('classroom.ui.submission_content_title')}</h3>
            {isEssay && submission.content ? (
              <div className="max-h-44 overflow-y-auto whitespace-pre-wrap rounded-lg border border-border bg-muted/40 p-3.5 text-sm font-medium leading-relaxed text-foreground">
                {submission.content}
              </div>
            ) : (
              <p className="rounded-lg border border-dashed border-border p-3.5 text-sm font-medium text-muted-foreground">
                {t('classroom.ui.submission_content_empty')}
              </p>
            )}
            {resourceUrl && (
              <a href={resourceUrl} target="_blank" rel="noopener noreferrer" className="mt-3 flex items-center justify-between rounded-lg border border-primary/30 bg-primary/5 p-3 text-sm font-medium text-primary transition hover:border-primary/50 hover:bg-primary/10">
                <span className="flex items-center gap-2"><FileText className="size-4" /> {submission.resource_name || t('classroom.ui.submission_attach_default')}</span>
                <Download className="size-4" />
              </a>
            )}
          </section>

          <Separator />

          <section className="space-y-3">
            {submission.grading_method === 'ai' && (
              <div className="rounded-xl border border-primary/20 bg-primary/5 p-3.5">
                <div className="mb-2 flex items-center justify-between gap-3">
                  <Badge variant="secondary" className="rounded-full px-2.5 py-1 text-[10px] font-semibold bg-card text-primary border-primary/20">
                    <Wand2 />
                    {t('classroom.ui.ai_graded_badge')}
                  </Badge>
                  {submission.ai_confidence != null && (
                    <span className="text-[11px] font-medium text-primary">
                      {t('classroom.ui.ai_confidence_label', undefined, { value: (submission.ai_confidence * 100).toFixed(0) })}
                    </span>
                  )}
                </div>
                {submission.ai_reason && (
                  <p className="text-xs font-medium leading-relaxed text-foreground">{submission.ai_reason}</p>
                )}
                {submission.ai_breakdown && submission.ai_breakdown.length > 0 && (
                  <div className="mt-3 space-y-2">
                    {submission.ai_breakdown.map((item, index) => (
                      <div key={`${item.question}-${index}`} className="rounded-lg border border-primary/20 bg-card p-2.5">
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-xs font-semibold text-foreground">{item.question || `Ý ${index + 1}`}</p>
                          <span className="shrink-0 text-xs font-semibold text-primary">{item.score}/{item.max_score}</span>
                        </div>
                        <p className="mt-1 text-[11px] font-medium leading-relaxed text-muted-foreground">{item.reason}</p>
                      </div>
                    ))}
                  </div>
                )}
                {submission.ai_sources && submission.ai_sources.length > 0 && (
                  <div className="mt-3 border-t border-primary/20 pt-2">
                    <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wide text-primary">{t('classroom.ui.ai_sources_label')}</p>
                    <div className="space-y-1">
                      {submission.ai_sources.slice(0, 3).map((source, index) => (
                        <div key={`${source.resource_uid || source.doc_name}-${index}`} className="flex items-center justify-between gap-2 text-[11px] font-medium text-muted-foreground">
                          <span className="truncate">{source.doc_name || source.resource_uid || t('classroom.ui.ai_source_default')}</span>
                          {typeof source.score === 'number' && <span>{(source.score * 100).toFixed(0)}%</span>}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
            <div className="space-y-2">
              <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{t('classroom.ui.score_field_label')}</Label>
              <Input
                value={grade}
                onChange={event => onGradeChange(event.target.value)}
                type="number"
                min="0"
                max="10"
                step="0.1"
                placeholder={t('classroom.ui.score_enter_placeholder')}
                className="h-11 text-base font-semibold"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{t('classroom.ui.submission_feedback_label')}</Label>
              <Textarea
                value={feedback}
                onChange={event => onFeedbackChange(event.target.value)}
                rows={4}
                placeholder={t('classroom.ui.feedback_placeholder')}
                className="resize-none text-sm"
              />
            </div>
          </section>
        </div>
        <div className="border-t border-border bg-card p-4">
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            <Button onClick={onAIGrade} disabled={saving || aiGrading} variant="outline" className="h-11 rounded-lg text-primary border-primary/30 hover:bg-primary/10">
              {aiGrading ? <Loader2 className="animate-spin" /> : <Wand2 />}
              {t('classroom.ui.ai_grade_btn')}
            </Button>
            <Button onClick={onSave} disabled={saving || aiGrading} className="h-11 rounded-lg">
              {saving ? <Loader2 className="animate-spin" /> : <Save />}
              {submission.grade == null ? t('classroom.ui.score_save_btn') : t('classroom.ui.score_update_btn')}
            </Button>
          </div>
        </div>
      </aside>
    </div>
  );
}

function getSessionStatusVariant(status: string): 'default' | 'secondary' | 'destructive' | 'outline' {
  if (status === 'pending') return 'outline';
  if (status === 'active') return 'secondary';
  if (status === 'completed') return 'default';
  return 'destructive';
}

function getSessionStatusLabel(status: string) {
  if (status === 'pending') return 'Chờ vào';
  if (status === 'active') return 'Đang thi';
  if (status === 'completed') return 'Đã nộp';
  return 'Hết hạn';
}
