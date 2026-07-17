'use client';

import { use, useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  ArrowLeft,
  BarChart3,
  Calendar,
  Camera,
  Clock,
  Download,
  FileText,
  Loader2,
  Monitor,
  Search,
  ShieldAlert,
  Timer,
  Users,
  Wifi,
  WifiOff,
} from 'lucide-react';
import { Button } from '@shared/components/ui/button';
import { classroomApi, examApi, Classroom, ClassroomMember, Exam, ExamSession, ExamSubmission } from '@/lib/api';

type SubmissionFilter = 'submitted' | 'missing';
type ExamDetailTab = 'submissions' | 'online';

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
  const [classroom, setClassroom] = useState<Classroom | null>(null);
  const [exam, setExam] = useState<Exam | null>(null);
  const [members, setMembers] = useState<ClassroomMember[]>([]);
  const [submissions, setSubmissions] = useState<ExamSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState<SubmissionFilter>('submitted');
  const [query, setQuery] = useState('');
  const [sessions, setSessions] = useState<ExamSession[]>([]);
  const [sessionLoading, setSessionLoading] = useState(false);
  const [sessionError, setSessionError] = useState('');
  const [sessionAction, setSessionAction] = useState(false);
  const [openSettings, setOpenSettings] = useState<OpenExamSettings>({
    camera_required: false,
    duration_minutes: 60,
    late_threshold_minutes: 5,
    max_face_warnings: 3,
  });
  const activeTab = (searchParams.get('tab') as ExamDetailTab) || 'submissions';

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError('');
        const [classroomData, examData, memberData, submissionData] = await Promise.all([
          classroomApi.retrieve(uid),
          examApi.retrieve(examUid),
          classroomApi.members(uid),
          examApi.listSubmissions(examUid),
        ]);
        setClassroom(classroomData);
        setExam(examData);
        setMembers(memberData.filter(member => member.role === 'student' && member.member_type === 'consumer'));
        setSubmissions(submissionData);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Không thể tải chi tiết bài kiểm tra');
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, [examUid, uid]);

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
    const loadSessions = async () => {
      try {
        setSessionLoading(true);
        setSessionError('');
        const data = await examApi.listOnlineSessions(examUid);
        setSessions(data);
      } catch (err: unknown) {
        setSessionError(err instanceof Error ? err.message : 'Không thể tải phiên thi');
      } finally {
        setSessionLoading(false);
      }
    };
    void loadSessions();
  }, [activeTab, examUid]);

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

  const submittedStudentIds = useMemo(
    () => new Set(submissions.map(submission => submission.student_id)),
    [submissions]
  );

  const submittedRows = useMemo(() => {
    return submissions.map(submission => ({
      kind: 'submitted' as const,
      submission,
      member: members.find(member => member.member_id === submission.student_id) || null,
    }));
  }, [members, submissions]);

  const missingRows = useMemo(() => {
    return members
      .filter(member => !submittedStudentIds.has(member.member_id))
      .map(member => ({ kind: 'missing' as const, member }));
  }, [members, submittedStudentIds]);

  const visibleRows = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    const rows = filter === 'submitted' ? submittedRows : missingRows;
    if (!normalizedQuery) return rows;

    return rows.filter(row => {
      const name = row.member?.member_name || (row.kind === 'submitted' ? row.submission.student_id : row.member.member_id);
      return name.toLowerCase().includes(normalizedQuery);
    });
  }, [filter, missingRows, query, submittedRows]);

  const analytics = useMemo(() => buildAnalytics(members, submissions), [members, submissions]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-muted/50">
        <Loader2 className="h-10 w-10 animate-spin text-primary-brand" />
      </div>
    );
  }

  if (error || !exam) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-muted/50 p-6">
        <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 text-center shadow-sm">
          <h1 className="text-lg font-black text-foreground">Không thể tải dữ liệu</h1>
          <p className="mt-2 text-sm font-bold text-muted-foreground">{error || 'Không tìm thấy bài kiểm tra'}</p>
          <Button onClick={() => router.push(`/space/classrooms/${uid}/details?tab=exams`)} className="mt-5 w-full rounded-xl bg-primary-brand">
            Quay lại lớp học
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/50">
      <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-border bg-card px-6">
        <div className="flex min-w-0 items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push(`/space/classrooms/${uid}/details?tab=exams`)}
            className="shrink-0 rounded-full"
          >
            <ArrowLeft size={20} />
          </Button>
          <div className="min-w-0">
            <p className="truncate text-[10px] font-black uppercase tracking-widest text-primary-brand">
              {classroom?.name || 'Lớp học'}
            </p>
            <h1 className="truncate text-lg font-black text-foreground">{exam.title}</h1>
          </div>
        </div>
        <span className={`rounded-full px-2.5 py-1 text-[10px] font-black uppercase ${getExamStatusClass(exam.status)}`}>
          {exam.status}
        </span>
      </header>

      <main className="mx-auto grid w-full max-w-7xl grid-cols-1 gap-6 p-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        <section className="min-w-0 overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
          <div className="border-b border-border p-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
              <div className="min-w-0">
                <div className="text-[10px] font-black uppercase tracking-widest text-primary-brand">Chi tiết bài kiểm tra</div>
                <h2 className="mt-1 text-2xl font-black tracking-tight text-foreground">{exam.title}</h2>
                <p className="mt-2 text-sm font-medium leading-relaxed text-muted-foreground">{exam.description || 'Không có mô tả'}</p>
              </div>
              <div className="shrink-0 rounded-xl border border-border bg-muted/50 px-4 py-3 text-right">
                <div className="flex items-center justify-end gap-1.5 text-[10px] font-black uppercase text-muted-foreground">
                  <Calendar size={13} />
                  Due date
                </div>
                <div className="mt-1 text-xs font-black text-foreground">{formatDateTime(exam.due_date)}</div>
              </div>
            </div>
          </div>

          <div className="border-b border-border px-6 pt-4">
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => router.push(`/space/classrooms/${uid}/exams/${examUid}?tab=submissions`)}
                className={`border-b-2 px-3 py-3 text-xs font-black uppercase ${activeTab === 'submissions' ? 'border-primary-brand text-primary-brand' : 'border-transparent text-muted-foreground hover:text-muted-foreground'}`}
              >
                Danh sách bài nộp
              </button>
              {exam.exam_mode === 'online' && (
                <button
                  type="button"
                  onClick={() => router.push(`/space/classrooms/${uid}/exams/${examUid}?tab=online`)}
                  className={`flex items-center gap-1.5 border-b-2 px-3 py-3 text-xs font-black uppercase ${activeTab === 'online' ? 'border-primary-brand text-primary-brand' : 'border-transparent text-muted-foreground hover:text-muted-foreground'}`}
                >
                  <Monitor size={13} />
                  Thi trực tuyến
                </button>
              )}
            </div>
          </div>

          {activeTab === 'online' ? (
            <div className="space-y-5 p-6">
              {exam.exam_mode !== 'online' ? (
                <div className="rounded-2xl border border-dashed border-border bg-muted/50 py-12 text-center">
                  <Monitor size={32} className="mx-auto mb-3 text-muted-foreground/60" />
                  <p className="text-sm font-bold text-muted-foreground">Bài kiểm tra này không phải hình thức online</p>
                </div>
              ) : (
                <>
                  {/* ── Inline settings card ── */}
                  <div className="rounded-2xl border border-border bg-muted/50">
                    <div className="flex items-center gap-2 border-b border-border px-5 py-3">
                      <Monitor size={14} className="text-primary-brand" />
                      <span className="text-[11px] font-black uppercase tracking-widest text-foreground">Cài đặt phiên thi</span>
                      <span className="ml-auto text-[10px] font-bold text-muted-foreground">Áp dụng khi nhấn "Mở phiên thi"</span>
                    </div>

                    <div className="grid grid-cols-1 gap-0 divide-y divide-slate-200 sm:grid-cols-2 lg:grid-cols-4 sm:divide-x sm:divide-y-0">
                      {/* Duration */}
                      <div className="flex flex-col gap-2 px-5 py-4">
                        <div className="flex items-center gap-1.5">
                          <Timer size={13} className="text-primary-brand" />
                          <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">Thời gian làm bài</span>
                          <span className="text-rose-500 text-[10px] font-black">*</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            min={1}
                            max={360}
                            value={openSettings.duration_minutes}
                            onChange={e => setOpenSettings(s => ({ ...s, duration_minutes: Math.max(1, Number(e.target.value)) }))}
                            className="h-9 w-20 rounded-lg border border-border bg-card px-2 text-sm font-black text-foreground outline-none focus:border-primary-brand focus:ring-2 focus:ring-primary-brand/10"
                          />
                          <span className="text-xs font-bold text-muted-foreground">phút</span>
                        </div>
                        <p className="text-[10px] text-muted-foreground">Tính từ lúc học sinh bắt đầu</p>
                      </div>

                      {/* Late threshold */}
                      <div className="flex flex-col gap-2 px-5 py-4">
                        <div className="flex items-center gap-1.5">
                          <Clock size={13} className="text-amber-500" />
                          <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">Cho phép vào muộn</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            min={0}
                            max={60}
                            value={openSettings.late_threshold_minutes}
                            onChange={e => setOpenSettings(s => ({ ...s, late_threshold_minutes: Math.max(0, Number(e.target.value)) }))}
                            className="h-9 w-20 rounded-lg border border-border bg-card px-2 text-sm font-black text-foreground outline-none focus:border-primary-brand focus:ring-2 focus:ring-primary-brand/10"
                          />
                          <span className="text-xs font-bold text-muted-foreground">phút</span>
                        </div>
                        <p className="text-[10px] text-muted-foreground">0 = không cho vào sau khi mở</p>
                      </div>

                      {/* Camera */}
                      <div className="flex flex-col gap-2 px-5 py-4">
                        <div className="flex items-center gap-1.5">
                          <Camera size={13} className="text-emerald-500" />
                          <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">Yêu cầu camera</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setOpenSettings(s => ({ ...s, camera_required: !s.camera_required }))}
                          className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors ${openSettings.camera_required ? 'bg-primary-brand' : 'bg-muted'}`}
                        >
                          <span className={`inline-block h-5 w-5 transform rounded-full bg-card shadow transition-transform ${openSettings.camera_required ? 'translate-x-6' : 'translate-x-1'}`} />
                        </button>
                        <p className="text-[10px] text-muted-foreground">
                          {openSettings.camera_required ? 'Bắt buộc nhận diện khuôn mặt' : 'Không bắt buộc camera'}
                        </p>
                      </div>

                      {/* Max face warnings */}
                      <div className="flex flex-col gap-2 px-5 py-4">
                        <div className="flex items-center gap-1.5">
                          <ShieldAlert size={13} className="text-rose-500" />
                          <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">Số lần nhận diện</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            min={0}
                            max={20}
                            value={openSettings.max_face_warnings}
                            onChange={e => setOpenSettings(s => ({ ...s, max_face_warnings: Math.max(0, Number(e.target.value)) }))}
                            className="h-9 w-20 rounded-lg border border-border bg-card px-2 text-sm font-black text-foreground outline-none focus:border-primary-brand focus:ring-2 focus:ring-primary-brand/10"
                          />
                          <span className="text-xs font-bold text-muted-foreground">lần</span>
                        </div>
                        <p className="text-[10px] text-muted-foreground">0 = không giới hạn · Vượt → nộp bài bắt buộc</p>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-between border-t border-border px-5 py-3">
                      {sessionError && (
                        <p className="text-xs font-bold text-rose-600">{sessionError}</p>
                      )}
                      <div className="ml-auto flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleCloseOnline}
                          disabled={sessionAction || sessions.every(s => s.token_status !== 'pending' && s.token_status !== 'active')}
                          className="rounded-xl gap-1.5 text-xs font-bold text-rose-600 border-rose-200 hover:bg-rose-50"
                        >
                          {sessionAction ? <Loader2 size={13} className="animate-spin" /> : <WifiOff size={13} />}
                          Đóng phiên
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => void handleOpenOnline()}
                          disabled={sessionAction || openSettings.duration_minutes <= 0}
                          className="rounded-xl gap-1.5 bg-primary-brand text-xs font-bold hover:bg-primary-brand-dark"
                        >
                          {sessionAction ? <Loader2 size={13} className="animate-spin" /> : <Wifi size={13} />}
                          Mở phiên thi
                        </Button>
                      </div>
                    </div>
                  </div>

                  <div className="overflow-hidden rounded-2xl border border-border">
                    {sessionLoading ? (
                      <div className="py-12 text-center"><Loader2 size={24} className="mx-auto animate-spin text-primary-brand" /></div>
                    ) : sessions.length === 0 ? (
                      <div className="py-12 text-center text-sm font-bold text-muted-foreground">Chưa có phiên thi nào. Nhấn "Mở phiên thi" để bắt đầu.</div>
                    ) : (
                      <table className="w-full min-w-[640px] text-left">
                        <thead className="bg-muted/50">
                          <tr className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">
                            <th className="px-4 py-3">Học sinh</th>
                            <th className="px-4 py-3">Token</th>
                            <th className="px-4 py-3">Trạng thái</th>
                            <th className="px-4 py-3">Hết hạn link</th>
                            <th className="px-4 py-3">Bắt đầu</th>
                            <th className="px-4 py-3">Kết thúc</th>
                          </tr>
                        </thead>
                        <tbody>
                          {sessions.map(s => (
                            <tr key={s.uid} className="border-t border-border">
                              <td className="px-4 py-3 text-xs font-bold text-muted-foreground">{s.student_id.slice(0, 8)}…</td>
                              <td className="px-4 py-3">
                                <code className="rounded bg-muted px-1.5 py-0.5 text-[11px] font-bold text-foreground">{s.token.slice(0, 8)}…</code>
                              </td>
                              <td className="px-4 py-3">
                                <span className={`rounded-full px-2.5 py-1 text-[10px] font-black uppercase ${getSessionStatusClass(s.token_status)}`}>
                                  {getSessionStatusLabel(s.token_status)}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-xs font-bold text-muted-foreground">{formatDateTime(s.token_expires_at)}</td>
                              <td className="px-4 py-3 text-xs font-bold text-muted-foreground">{formatDateTime(s.started_at)}</td>
                              <td className="px-4 py-3 text-xs font-bold text-muted-foreground">{formatDateTime(s.ends_at)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                </>
              )}
            </div>
          ) : (
          <div className="space-y-4 p-6">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div className="inline-flex w-fit rounded-xl border border-border bg-muted/50 p-1">
                <FilterButton active={filter === 'submitted'} onClick={() => setFilter('submitted')}>
                  Đã nộp ({submissions.length})
                </FilterButton>
                <FilterButton active={filter === 'missing'} onClick={() => setFilter('missing')}>
                  Chưa nộp ({missingRows.length})
                </FilterButton>
              </div>

              <label className="relative w-full md:w-72">
                <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  value={query}
                  onChange={event => setQuery(event.target.value)}
                  placeholder="Tìm học sinh..."
                  className="h-10 w-full rounded-xl border border-border bg-card pl-9 pr-3 text-sm font-bold text-foreground outline-none focus:border-primary-brand focus:ring-4 focus:ring-primary-brand/10"
                />
              </label>
            </div>

            <div className="overflow-hidden rounded-2xl border border-border">
              <table className="w-full min-w-[780px] text-left">
                <thead className="bg-muted/50">
                  <tr className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">
                    <th className="px-4 py-3">Học sinh</th>
                    <th className="px-4 py-3">Trạng thái</th>
                    <th className="px-4 py-3">Nộp lúc</th>
                    <th className="px-4 py-3">Kết quả</th>
                    <th className="px-4 py-3">Điểm</th>
                    <th className="px-4 py-3">Đạt/Không</th>
                    <th className="px-4 py-3 text-right">File</th>
                  </tr>
                </thead>
                <tbody>
                  {visibleRows.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-4 py-12 text-center text-sm font-bold text-muted-foreground">
                        Không có dữ liệu phù hợp
                      </td>
                    </tr>
                  ) : (
                    visibleRows.map(row => (
                      <tr key={row.kind === 'submitted' ? row.submission.uid : row.member.member_id} className="border-t border-border">
                        <td className="px-4 py-3">
                          <div className="text-sm font-black text-foreground">
                            {row.member?.member_name || (row.kind === 'submitted' ? row.submission.student_id : row.member.member_id)}
                          </div>
                          <div className="text-xs font-medium text-muted-foreground">
                            {row.kind === 'submitted' ? row.submission.student_id : row.member.member_id}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`rounded-full px-2.5 py-1 text-[10px] font-black uppercase ${row.kind === 'submitted' ? getSubmissionStatusClass(row.submission.status) : 'bg-rose-50 text-rose-600 border border-rose-100'}`}>
                            {row.kind === 'submitted' ? getSubmissionStatusLabel(row.submission.status) : 'chưa nộp'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-xs font-bold text-muted-foreground">
                          {row.kind === 'submitted' ? formatDateTime(row.submission.submitted_at) : '--'}
                        </td>
                        <td className="px-4 py-3">
                          {row.kind === 'submitted' && row.submission.quiz_result ? (
                            <div className="min-w-[90px]">
                              <div className="text-xs font-black text-slate-800">
                                {row.submission.quiz_result.correct_count}/{row.submission.quiz_result.total} câu
                              </div>
                              <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                                <div
                                  className="h-full rounded-full bg-emerald-500"
                                  style={{ width: `${row.submission.quiz_result.score_pct}%` }}
                                />
                              </div>
                              <div className="mt-0.5 text-[10px] font-bold text-emerald-600">
                                {row.submission.quiz_result.score_pct}%
                              </div>
                            </div>
                          ) : (
                            <span className="text-xs font-bold text-muted-foreground/60">--</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-sm font-black text-foreground">
                          {row.kind === 'submitted' && typeof row.submission.grade === 'number' ? row.submission.grade : '--'}
                        </td>
                        <td className="px-4 py-3">
                          {row.kind === 'submitted' && row.submission.passed != null ? (
                            <span className={`rounded-full px-2.5 py-1 text-[10px] font-black uppercase ${row.submission.passed ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-rose-50 text-rose-600 border border-rose-100'}`}>
                              {row.submission.passed ? 'Đạt' : 'Không đạt'}
                            </span>
                          ) : (
                            <span className="text-xs font-bold text-muted-foreground/60">--</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right">
                          {row.kind === 'submitted' && row.submission.resource_url ? (
                            <a href={row.submission.resource_url} download target="_blank" rel="noopener noreferrer">
                              <Button variant="outline" size="sm" className="h-8 gap-1.5 rounded-lg text-xs font-bold">
                                <Download size={14} />
                                Download
                              </Button>
                            </a>
                          ) : (
                            <span className="text-xs font-bold text-muted-foreground/60">--</span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
          )}
        </section>

        <aside className="h-fit space-y-4 lg:sticky lg:top-24">
          <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
            <div className="flex items-center gap-2">
              <BarChart3 size={18} className="text-primary-brand" />
              <h3 className="text-sm font-black uppercase text-foreground">Dashboard</h3>
            </div>

            <div className="mt-5 grid grid-cols-2 gap-3">
              <Metric label="Đã nộp" value={`${analytics.submitted}/${analytics.totalStudents}`} />
              <Metric label="Chưa nộp" value={String(analytics.missing)} />
              <Metric label="Điểm TB" value={analytics.averageLabel} />
              <Metric label="Đã chấm" value={String(analytics.graded)} />
              <Metric label="Đạt" value={String(analytics.passed)} />
              <Metric label="Không đạt" value={String(analytics.failed)} />
            </div>

            <div className="mt-5">
              <div className="mb-2 flex items-center justify-between text-xs font-black text-foreground">
                <span>Tỉ lệ nộp bài</span>
                <span>{analytics.submitRate}%</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-muted">
                <div className="h-full rounded-full bg-primary-brand" style={{ width: `${analytics.submitRate}%` }} />
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
            <div className="mb-4 flex items-center gap-2">
              <Users size={18} className="text-primary-brand" />
              <h3 className="text-sm font-black uppercase text-foreground">Cột điểm</h3>
            </div>
            <div className="space-y-3">
              {analytics.scoreBuckets.map(bucket => (
                <div key={bucket.label}>
                  <div className="mb-1 flex items-center justify-between text-xs font-bold text-muted-foreground">
                    <span>{bucket.label}</span>
                    <span>{bucket.count}</span>
                  </div>
                  <div className="h-8 overflow-hidden rounded-lg bg-muted">
                    <div
                      className="flex h-full items-center justify-end rounded-lg bg-primary-brand px-2 text-[10px] font-black text-white"
                      style={{ width: `${Math.max(bucket.percent, bucket.count > 0 ? 10 : 0)}%` }}
                    >
                      {bucket.count > 0 ? bucket.count : ''}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            {analytics.graded === 0 && (
              <div className="mt-4 rounded-xl border border-dashed border-border bg-muted/50 p-4 text-center">
                <FileText size={24} className="mx-auto mb-2 text-muted-foreground/60" />
                <p className="text-xs font-bold text-muted-foreground">Chưa có điểm để phân tích</p>
              </div>
            )}
          </div>
        </aside>
      </main>

    </div>
  );
}

function FilterButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`h-8 rounded-lg px-3 text-xs font-black uppercase transition-colors ${active ? 'bg-card text-primary-brand shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
    >
      {children}
    </button>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border bg-muted/50 p-3">
      <div className="text-[10px] font-black uppercase text-muted-foreground">{label}</div>
      <div className="mt-1 text-lg font-black text-foreground">{value}</div>
    </div>
  );
}

function buildAnalytics(members: ClassroomMember[], submissions: ExamSubmission[]) {
  const totalStudents = members.length;
  const submitted = submissions.length;
  const missing = Math.max(0, totalStudents - submitted);
  const grades = submissions
    .map(submission => submission.grade)
    .filter((grade): grade is number => typeof grade === 'number' && Number.isFinite(grade));
  const average = grades.length ? grades.reduce((sum, grade) => sum + grade, 0) / grades.length : null;
  const buckets = [
    { label: '0 - 4.9', min: 0, max: 4.999 },
    { label: '5 - 6.4', min: 5, max: 6.499 },
    { label: '6.5 - 7.9', min: 6.5, max: 7.999 },
    { label: '8 - 10', min: 8, max: 10 },
  ];

  const passed = submissions.filter(s => s.passed === true).length;
  const failed = submissions.filter(s => s.passed === false).length;

  return {
    totalStudents,
    submitted,
    missing,
    graded: grades.length,
    passed,
    failed,
    submitRate: totalStudents > 0 ? Math.round((submitted / totalStudents) * 100) : 0,
    averageLabel: average === null ? '--' : average.toFixed(1),
    scoreBuckets: buckets.map(bucket => {
      const count = grades.filter(grade => grade >= bucket.min && grade <= bucket.max).length;
      return {
        label: bucket.label,
        count,
        percent: grades.length > 0 ? Math.round((count / grades.length) * 100) : 0,
      };
    }),
  };
}

function getSessionStatusClass(status: string) {
  if (status === 'pending') return 'bg-amber-50 text-amber-600 border border-amber-100';
  if (status === 'active') return 'bg-emerald-50 text-emerald-600 border border-emerald-100';
  if (status === 'completed') return 'bg-primary-brand-light text-primary-brand border border-primary-brand-muted';
  return 'bg-rose-50 text-rose-600 border border-rose-100';
}

function getSessionStatusLabel(status: string) {
  if (status === 'pending') return 'Chờ vào';
  if (status === 'active') return 'Đang thi';
  if (status === 'completed') return 'Đã nộp';
  return 'Hết hạn';
}

function getExamStatusClass(status: string) {
  const normalized = status.toLowerCase();
  if (normalized === 'active' || normalized === 'published' || normalized === 'open') {
    return 'bg-emerald-50 text-emerald-600 border border-emerald-100';
  }
  if (normalized === 'draft') {
    return 'bg-amber-50 text-amber-600 border border-amber-100';
  }
  if (normalized === 'closed' || normalized === 'expired') {
    return 'bg-rose-50 text-rose-600 border border-rose-100';
  }
  return 'bg-muted text-muted-foreground border border-border';
}

function getSubmissionStatusClass(status: string) {
  const normalized = status.toLowerCase();
  if (normalized === 'returned') return 'bg-violet-50 text-violet-600 border border-violet-100';
  if (normalized === 'graded') return 'bg-primary-brand-light text-primary-brand border border-primary-brand-muted';
  if (normalized === 'late') return 'bg-amber-50 text-amber-600 border border-amber-100';
  return 'bg-emerald-50 text-emerald-600 border border-emerald-100';
}

function getSubmissionStatusLabel(status: string) {
  const normalized = status.toLowerCase();
  if (normalized === 'returned') return 'Đã trả bài';
  if (normalized === 'graded') return 'Đã chấm';
  if (normalized === 'late') return 'Nộp trễ';
  return 'Đã nộp';
}

function formatDateTime(value: string | null) {
  if (!value) return '--';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString('vi-VN');
}
