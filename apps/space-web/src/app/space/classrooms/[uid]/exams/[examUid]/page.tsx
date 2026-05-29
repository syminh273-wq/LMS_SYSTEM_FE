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
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <Loader2 className="h-10 w-10 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (error || !exam) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 p-6">
        <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-sm">
          <h1 className="text-lg font-black text-slate-900">Không thể tải dữ liệu</h1>
          <p className="mt-2 text-sm font-bold text-slate-500">{error || 'Không tìm thấy bài kiểm tra'}</p>
          <Button onClick={() => router.push(`/space/classrooms/${uid}/details?tab=exams`)} className="mt-5 w-full rounded-xl bg-indigo-600">
            Quay lại lớp học
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-slate-200 bg-white px-6">
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
            <p className="truncate text-[10px] font-black uppercase tracking-widest text-indigo-500">
              {classroom?.name || 'Lớp học'}
            </p>
            <h1 className="truncate text-lg font-black text-slate-900">{exam.title}</h1>
          </div>
        </div>
        <span className={`rounded-full px-2.5 py-1 text-[10px] font-black uppercase ${getExamStatusClass(exam.status)}`}>
          {exam.status}
        </span>
      </header>

      <main className="mx-auto grid w-full max-w-7xl grid-cols-1 gap-6 p-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        <section className="min-w-0 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 p-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
              <div className="min-w-0">
                <div className="text-[10px] font-black uppercase tracking-widest text-indigo-500">Chi tiết bài kiểm tra</div>
                <h2 className="mt-1 text-2xl font-black tracking-tight text-slate-900">{exam.title}</h2>
                <p className="mt-2 text-sm font-medium leading-relaxed text-slate-500">{exam.description || 'Không có mô tả'}</p>
              </div>
              <div className="shrink-0 rounded-xl border border-slate-100 bg-slate-50 px-4 py-3 text-right">
                <div className="flex items-center justify-end gap-1.5 text-[10px] font-black uppercase text-slate-400">
                  <Calendar size={13} />
                  Due date
                </div>
                <div className="mt-1 text-xs font-black text-slate-800">{formatDateTime(exam.due_date)}</div>
              </div>
            </div>
          </div>

          <div className="border-b border-slate-100 px-6 pt-4">
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => router.push(`/space/classrooms/${uid}/exams/${examUid}?tab=submissions`)}
                className={`border-b-2 px-3 py-3 text-xs font-black uppercase ${activeTab === 'submissions' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
              >
                Danh sách bài nộp
              </button>
              {exam.exam_mode === 'online' && (
                <button
                  type="button"
                  onClick={() => router.push(`/space/classrooms/${uid}/exams/${examUid}?tab=online`)}
                  className={`flex items-center gap-1.5 border-b-2 px-3 py-3 text-xs font-black uppercase ${activeTab === 'online' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
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
                <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 py-12 text-center">
                  <Monitor size={32} className="mx-auto mb-3 text-slate-300" />
                  <p className="text-sm font-bold text-slate-400">Bài kiểm tra này không phải hình thức online</p>
                </div>
              ) : (
                <>
                  {/* ── Inline settings card ── */}
                  <div className="rounded-2xl border border-slate-200 bg-slate-50">
                    <div className="flex items-center gap-2 border-b border-slate-200 px-5 py-3">
                      <Monitor size={14} className="text-indigo-500" />
                      <span className="text-[11px] font-black uppercase tracking-widest text-slate-700">Cài đặt phiên thi</span>
                      <span className="ml-auto text-[10px] font-bold text-slate-400">Áp dụng khi nhấn "Mở phiên thi"</span>
                    </div>

                    <div className="grid grid-cols-1 gap-0 divide-y divide-slate-200 sm:grid-cols-3 sm:divide-x sm:divide-y-0">
                      {/* Duration */}
                      <div className="flex flex-col gap-2 px-5 py-4">
                        <div className="flex items-center gap-1.5">
                          <Timer size={13} className="text-indigo-500" />
                          <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">Thời gian làm bài</span>
                          <span className="text-rose-500 text-[10px] font-black">*</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            min={1}
                            max={360}
                            value={openSettings.duration_minutes}
                            onChange={e => setOpenSettings(s => ({ ...s, duration_minutes: Math.max(1, Number(e.target.value)) }))}
                            className="h-9 w-20 rounded-lg border border-slate-200 bg-white px-2 text-sm font-black text-slate-900 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/10"
                          />
                          <span className="text-xs font-bold text-slate-500">phút</span>
                        </div>
                        <p className="text-[10px] text-slate-400">Tính từ lúc học sinh bắt đầu</p>
                      </div>

                      {/* Late threshold */}
                      <div className="flex flex-col gap-2 px-5 py-4">
                        <div className="flex items-center gap-1.5">
                          <Clock size={13} className="text-amber-500" />
                          <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">Cho phép vào muộn</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            min={0}
                            max={60}
                            value={openSettings.late_threshold_minutes}
                            onChange={e => setOpenSettings(s => ({ ...s, late_threshold_minutes: Math.max(0, Number(e.target.value)) }))}
                            className="h-9 w-20 rounded-lg border border-slate-200 bg-white px-2 text-sm font-black text-slate-900 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/10"
                          />
                          <span className="text-xs font-bold text-slate-500">phút</span>
                        </div>
                        <p className="text-[10px] text-slate-400">0 = không cho vào sau khi mở</p>
                      </div>

                      {/* Camera */}
                      <div className="flex flex-col gap-2 px-5 py-4">
                        <div className="flex items-center gap-1.5">
                          <Camera size={13} className="text-emerald-500" />
                          <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">Yêu cầu camera</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setOpenSettings(s => ({ ...s, camera_required: !s.camera_required }))}
                          className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors ${openSettings.camera_required ? 'bg-indigo-600' : 'bg-slate-200'}`}
                        >
                          <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${openSettings.camera_required ? 'translate-x-6' : 'translate-x-1'}`} />
                        </button>
                        <p className="text-[10px] text-slate-400">
                          {openSettings.camera_required ? 'Bắt buộc nhận diện khuôn mặt' : 'Không bắt buộc camera'}
                        </p>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-between border-t border-slate-200 px-5 py-3">
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
                          className="rounded-xl gap-1.5 bg-indigo-600 text-xs font-bold hover:bg-indigo-700"
                        >
                          {sessionAction ? <Loader2 size={13} className="animate-spin" /> : <Wifi size={13} />}
                          Mở phiên thi
                        </Button>
                      </div>
                    </div>
                  </div>

                  <div className="overflow-hidden rounded-2xl border border-slate-100">
                    {sessionLoading ? (
                      <div className="py-12 text-center"><Loader2 size={24} className="mx-auto animate-spin text-indigo-400" /></div>
                    ) : sessions.length === 0 ? (
                      <div className="py-12 text-center text-sm font-bold text-slate-400">Chưa có phiên thi nào. Nhấn "Mở phiên thi" để bắt đầu.</div>
                    ) : (
                      <table className="w-full min-w-[640px] text-left">
                        <thead className="bg-slate-50">
                          <tr className="text-[10px] font-black uppercase tracking-wider text-slate-400">
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
                            <tr key={s.uid} className="border-t border-slate-100">
                              <td className="px-4 py-3 text-xs font-bold text-slate-600">{s.student_id.slice(0, 8)}…</td>
                              <td className="px-4 py-3">
                                <code className="rounded bg-slate-100 px-1.5 py-0.5 text-[11px] font-bold text-slate-700">{s.token.slice(0, 8)}…</code>
                              </td>
                              <td className="px-4 py-3">
                                <span className={`rounded-full px-2.5 py-1 text-[10px] font-black uppercase ${getSessionStatusClass(s.token_status)}`}>
                                  {getSessionStatusLabel(s.token_status)}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-xs font-bold text-slate-500">{formatDateTime(s.token_expires_at)}</td>
                              <td className="px-4 py-3 text-xs font-bold text-slate-500">{formatDateTime(s.started_at)}</td>
                              <td className="px-4 py-3 text-xs font-bold text-slate-500">{formatDateTime(s.ends_at)}</td>
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
              <div className="inline-flex w-fit rounded-xl border border-slate-200 bg-slate-50 p-1">
                <FilterButton active={filter === 'submitted'} onClick={() => setFilter('submitted')}>
                  Đã nộp ({submissions.length})
                </FilterButton>
                <FilterButton active={filter === 'missing'} onClick={() => setFilter('missing')}>
                  Chưa nộp ({missingRows.length})
                </FilterButton>
              </div>

              <label className="relative w-full md:w-72">
                <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  value={query}
                  onChange={event => setQuery(event.target.value)}
                  placeholder="Tìm học sinh..."
                  className="h-10 w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3 text-sm font-bold text-slate-800 outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/10"
                />
              </label>
            </div>

            <div className="overflow-hidden rounded-2xl border border-slate-100">
              <table className="w-full min-w-[780px] text-left">
                <thead className="bg-slate-50">
                  <tr className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                    <th className="px-4 py-3">Học sinh</th>
                    <th className="px-4 py-3">Trạng thái</th>
                    <th className="px-4 py-3">Nộp lúc</th>
                    <th className="px-4 py-3">Điểm</th>
                    <th className="px-4 py-3 text-right">File</th>
                  </tr>
                </thead>
                <tbody>
                  {visibleRows.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-12 text-center text-sm font-bold text-slate-400">
                        Không có dữ liệu phù hợp
                      </td>
                    </tr>
                  ) : (
                    visibleRows.map(row => (
                      <tr key={row.kind === 'submitted' ? row.submission.uid : row.member.member_id} className="border-t border-slate-100">
                        <td className="px-4 py-3">
                          <div className="text-sm font-black text-slate-900">
                            {row.member?.member_name || (row.kind === 'submitted' ? row.submission.student_id : row.member.member_id)}
                          </div>
                          <div className="text-xs font-medium text-slate-400">
                            {row.kind === 'submitted' ? row.submission.student_id : row.member.member_id}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`rounded-full px-2.5 py-1 text-[10px] font-black uppercase ${row.kind === 'submitted' ? getSubmissionStatusClass(row.submission.status) : 'bg-rose-50 text-rose-600 border border-rose-100'}`}>
                            {row.kind === 'submitted' ? getSubmissionStatusLabel(row.submission.status) : 'chưa nộp'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-xs font-bold text-slate-500">
                          {row.kind === 'submitted' ? formatDateTime(row.submission.submitted_at) : '--'}
                        </td>
                        <td className="px-4 py-3 text-sm font-black text-slate-800">
                          {row.kind === 'submitted' && typeof row.submission.grade === 'number' ? row.submission.grade : '--'}
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
                            <span className="text-xs font-bold text-slate-300">--</span>
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
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-2">
              <BarChart3 size={18} className="text-indigo-600" />
              <h3 className="text-sm font-black uppercase text-slate-900">Dashboard</h3>
            </div>

            <div className="mt-5 grid grid-cols-2 gap-3">
              <Metric label="Đã nộp" value={`${analytics.submitted}/${analytics.totalStudents}`} />
              <Metric label="Chưa nộp" value={String(analytics.missing)} />
              <Metric label="Điểm TB" value={analytics.averageLabel} />
              <Metric label="Đã chấm" value={String(analytics.graded)} />
            </div>

            <div className="mt-5">
              <div className="mb-2 flex items-center justify-between text-xs font-black text-slate-700">
                <span>Tỉ lệ nộp bài</span>
                <span>{analytics.submitRate}%</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                <div className="h-full rounded-full bg-indigo-600" style={{ width: `${analytics.submitRate}%` }} />
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center gap-2">
              <Users size={18} className="text-indigo-600" />
              <h3 className="text-sm font-black uppercase text-slate-900">Cột điểm</h3>
            </div>
            <div className="space-y-3">
              {analytics.scoreBuckets.map(bucket => (
                <div key={bucket.label}>
                  <div className="mb-1 flex items-center justify-between text-xs font-bold text-slate-500">
                    <span>{bucket.label}</span>
                    <span>{bucket.count}</span>
                  </div>
                  <div className="h-8 overflow-hidden rounded-lg bg-slate-100">
                    <div
                      className="flex h-full items-center justify-end rounded-lg bg-indigo-500 px-2 text-[10px] font-black text-white"
                      style={{ width: `${Math.max(bucket.percent, bucket.count > 0 ? 10 : 0)}%` }}
                    >
                      {bucket.count > 0 ? bucket.count : ''}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            {analytics.graded === 0 && (
              <div className="mt-4 rounded-xl border border-dashed border-slate-200 bg-slate-50 p-4 text-center">
                <FileText size={24} className="mx-auto mb-2 text-slate-300" />
                <p className="text-xs font-bold text-slate-400">Chưa có điểm để phân tích</p>
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
      className={`h-8 rounded-lg px-3 text-xs font-black uppercase transition-colors ${active ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-900'}`}
    >
      {children}
    </button>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-slate-100 bg-slate-50 p-3">
      <div className="text-[10px] font-black uppercase text-slate-400">{label}</div>
      <div className="mt-1 text-lg font-black text-slate-900">{value}</div>
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

  return {
    totalStudents,
    submitted,
    missing,
    graded: grades.length,
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
  if (status === 'completed') return 'bg-indigo-50 text-indigo-600 border border-indigo-100';
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
  return 'bg-slate-100 text-slate-600 border border-slate-200';
}

function getSubmissionStatusClass(status: string) {
  const normalized = status.toLowerCase();
  if (normalized === 'graded' || normalized === 'returned') {
    return 'bg-indigo-50 text-indigo-600 border border-indigo-100';
  }
  return 'bg-emerald-50 text-emerald-600 border border-emerald-100';
}

function getSubmissionStatusLabel(status: string) {
  const normalized = status.toLowerCase();
  if (normalized === 'graded' || normalized === 'returned') return 'Đã chấm';
  return 'Đã nộp';
}

function formatDateTime(value: string | null) {
  if (!value) return '--';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString('vi-VN');
}
