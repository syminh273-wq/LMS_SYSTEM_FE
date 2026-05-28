'use client';

import { use, useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  ArrowLeft,
  BarChart3,
  Calendar,
  Download,
  FileText,
  Loader2,
  Search,
  Users,
} from 'lucide-react';
import { Button } from '@shared/components/ui/button';
import { classroomApi, examApi, Classroom, ClassroomMember, Exam, ExamSubmission } from '@/lib/api';

type SubmissionFilter = 'submitted' | 'missing';
type ExamDetailTab = 'submissions';

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
                className={`border-b-2 px-3 py-3 text-xs font-black uppercase ${activeTab === 'submissions' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-400'}`}
              >
                Danh sách bài nộp
              </button>
            </div>
          </div>

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
