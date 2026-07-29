'use client';

import { use, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { BarChart3, FileText, Users } from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  LabelList,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Button } from '@shared/components/ui/button';
import { classroomApi, examApi, type Classroom, type ClassroomMember, type Exam, type ExamSubmission } from '@/lib/api';
import { useTranslation } from '@shared/components/LocaleProvider';

export default function SpaceExamAnalyticsPage({
  params,
}: {
  params: Promise<{ uid: string; examUid: string }>;
}) {
  const { uid, examUid } = use(params);
  const router = useRouter();
  const { t } = useTranslation();
  const [classroom, setClassroom] = useState<Classroom | null>(null);
  const [exam, setExam] = useState<Exam | null>(null);
  const [members, setMembers] = useState<ClassroomMember[]>([]);
  const [submissions, setSubmissions] = useState<ExamSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

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
        const studentsOnly = memberData.filter(
          member => member.role === 'student' && member.status === 'approved',
        );
        setMembers(studentsOnly);
        setSubmissions(submissionData);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : t('classroom.ui.score_load_error'));
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, [uid, examUid, t]);

  const subMap = useMemo(() => new Map(submissions.map(s => [s.student_id, s])), [submissions]);
  const rows = useMemo(
    () => members.map(member => ({ member, submission: subMap.get(member.member_id) || null })),
    [members, subMap],
  );
  const submitted = rows.filter(row => row.submission).length;
  const missing = Math.max(0, members.length - submitted);
  const gradedSubmissions = rows
    .map(r => r.submission)
    .filter((s): s is ExamSubmission => s?.grade != null);
  const graded = gradedSubmissions.length;
  const submissionRate = members.length > 0 ? Math.round((submitted / members.length) * 100) : 0;
  const averageScore =
    graded > 0 ? gradedSubmissions.reduce((acc, s) => acc + (s.grade ?? 0), 0) / graded : null;
  const avg = averageScore != null ? averageScore.toFixed(1) : '--';
  const passedCount = rows.filter(r => r.submission?.passed === true).length;
  const failedCount = rows.filter(r => r.submission?.passed === false).length;

  const scoreBuckets = useMemo(() => buildScoreBuckets(submissions), [submissions]);
  const maxBucketCount = useMemo(
    () => Math.max(1, ...scoreBuckets.map(b => b.count)),
    [scoreBuckets],
  );
  const completionRate = members.length > 0 ? Math.round((graded / members.length) * 100) : 0;
  const { sortedGrades, totalScore, averageGrade, medianGrade, modeGrade } = useMemo(
    () => buildScoreStats(submissions),
    [submissions],
  );

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-muted/50 p-6">
        <div className="flex items-center gap-3 rounded-2xl border border-border bg-card px-5 py-4 shadow-sm">
          <span className="h-2 w-2 animate-pulse rounded-full bg-primary-brand" />
          <span className="text-sm font-bold text-muted-foreground">Đang tải dashboard…</span>
        </div>
      </div>
    );
  }

  if (error || !exam) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-muted/50 p-6">
        <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 text-center shadow-sm">
          <h1 className="text-lg font-black text-foreground">Không thể tải dữ liệu</h1>
          <p className="mt-2 text-sm font-bold text-muted-foreground">
            {error || 'Không tìm thấy bài kiểm tra'}
          </p>
          <Button
            onClick={() => router.push(`/space/classrooms/${uid}/exams/${examUid}`)}
            className="mt-5 w-full"
          >
            Quay lại chi tiết bài kiểm tra
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/50">
      <main className="mx-auto w-full max-w-[1400px] space-y-6 p-6">
        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BarChart3 size={18} className="text-primary-brand" />
              <h3 className="text-sm font-black uppercase text-foreground">Dashboard</h3>
            </div>
            <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">
              Tổng quan lớp học
            </span>
          </div>

          <div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
            <Metric label="Đã nộp" value={`${submitted}/${members.length}`} />
            <Metric label="Chưa nộp" value={String(missing)} />
            <Metric label="Điểm TB" value={avg} />
            <Metric label="Đã chấm" value={String(graded)} />
            <Metric label="Đạt" value={String(passedCount)} />
            <Metric label="Không đạt" value={String(failedCount)} />
          </div>

          <div className="mt-6">
            <div className="mb-2 flex items-center justify-between text-xs font-black text-foreground">
              <span>Tỉ lệ nộp bài</span>
              <span>{submissionRate}%</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-primary-brand transition-all duration-500"
                style={{ width: `${submissionRate}%` }}
              />
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users size={18} className="text-primary-brand" />
              <h3 className="text-sm font-black uppercase text-foreground">Phổ điểm</h3>
            </div>
            <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">
              {graded} bài đã chấm
            </span>
          </div>

          <div className="mt-6">
            {graded === 0 ? (
              <div className="flex h-[280px] flex-col items-center justify-center rounded-xl border border-dashed border-border bg-muted/50 p-4 text-center">
                <FileText size={28} className="mb-2 text-muted-foreground/60" />
                <p className="text-xs font-bold text-muted-foreground">Chưa có điểm để phân tích</p>
              </div>
            ) : (
              <div className="h-[360px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={scoreBuckets}
                    margin={{ top: 28, right: 16, left: 0, bottom: 8 }}
                    barCategoryGap="18%"
                  >
                    <defs>
                      <linearGradient id="scoreGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.95} />
                        <stop offset="100%" stopColor="#3b82f6" stopOpacity={0.55} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 6" stroke="#e5e7eb" vertical={false} />
                    <XAxis
                      dataKey="label"
                      tickLine={false}
                      axisLine={false}
                      tick={{ fontSize: 11, fontWeight: 700, fill: '#6b7280' }}
                    />
                    <YAxis
                      allowDecimals={false}
                      tickLine={false}
                      axisLine={false}
                      tick={{ fontSize: 11, fontWeight: 700, fill: '#6b7280' }}
                      width={48}
                    />
                    <Tooltip
                      cursor={{ fill: 'rgba(59, 130, 246, 0.08)' }}
                      contentStyle={{
                        borderRadius: 10,
                        border: '1px solid #e5e7eb',
                        boxShadow: '0 8px 24px rgba(15, 23, 42, 0.08)',
                        fontSize: 12,
                        fontWeight: 600,
                      }}
                      formatter={(value) => [`${value} học sinh`, 'Số lượng']}
                    />
                    <Bar dataKey="count" radius={[6, 6, 0, 0]} fill="url(#scoreGradient)">
                      {scoreBuckets.map((bucket) => (
                        <Cell
                          key={bucket.label}
                          fill={bucket.count === maxBucketCount && bucket.count > 0 ? '#1d4ed8' : 'url(#scoreGradient)'}
                        />
                      ))}
                      <LabelList
                        dataKey="count"
                        position="top"
                        formatter={(label) => {
                          const num = typeof label === 'number' ? label : Number(label);
                          return num > 0 ? num : '';
                        }}
                        style={{ fontSize: 11, fontWeight: 800, fill: '#374151' }}
                      />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          {graded > 0 && (
            <div className="mt-6 overflow-x-auto rounded-xl border border-border">
              <table className="w-full min-w-[640px] text-left text-xs">
                <thead>
                  <tr className="bg-muted/60 text-[10px] font-black uppercase tracking-wider text-muted-foreground">
                    <th className="border-b border-r border-border px-3 py-2 text-center">Điểm</th>
                    {scoreBuckets.map(bucket => (
                      <th key={bucket.label} className="border-b border-r border-border px-3 py-2 text-center last:border-r-0">
                        {bucket.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <tr className="text-xs font-bold text-foreground">
                    <td className="border-r border-border bg-muted/30 px-3 py-2 text-center font-black uppercase tracking-wider text-muted-foreground">
                      Số lượng
                    </td>
                    {scoreBuckets.map(bucket => (
                      <td key={bucket.label} className="border-r border-border px-3 py-2 text-center last:border-r-0">
                        {bucket.count}
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          )}

          {graded > 0 && (
            <div className="mt-6 flex flex-col items-center gap-4 lg:flex-row lg:items-stretch lg:justify-center">
              <div className="w-full max-w-md overflow-hidden rounded-xl border border-border">
                <table className="w-full text-left text-xs">
                  <tbody>
                    <ScoreStatRow label="Tổng số bài thi" value={String(sortedGrades.length)} />
                    <ScoreStatRow label="Tổng điểm" value={totalScore.toLocaleString('vi-VN')} />
                    <ScoreStatRow label="Trung bình" value={averageGrade} />
                    <ScoreStatRow label="Trung vị" value={medianGrade} />
                    <ScoreStatRow label="Điểm có nhiều bài đạt nhất" value={modeGrade} isLast />
                  </tbody>
                </table>
              </div>
              <p className="max-w-md text-[11px] italic leading-relaxed text-muted-foreground">
                Phân tích phổ điểm giúp giáo viên nắm được mức độ phân hóa kết quả học tập của lớp,
                từ đó điều chỉnh phương pháp giảng dạy và đánh giá phù hợp.
              </p>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
            <h3 className="text-sm font-black uppercase text-foreground">Tỉ lệ hoàn thành</h3>
            <p className="mt-1 text-xs font-medium text-muted-foreground">
              So với tổng số học sinh trong lớp
            </p>
            <div className="mt-5 flex items-end justify-between">
              <div>
                <p className="text-3xl font-black text-foreground">{completionRate}%</p>
                <p className="mt-1 text-[11px] font-bold text-muted-foreground">
                  {graded}/{members.length} bài đã chấm
                </p>
              </div>
              <CompletionRing value={completionRate} />
            </div>
            <div className="mt-5 h-2 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-emerald-500 transition-all duration-500"
                style={{ width: `${completionRate}%` }}
              />
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
            <h3 className="text-sm font-black uppercase text-foreground">Kết quả đạt / không đạt</h3>
            <p className="mt-1 text-xs font-medium text-muted-foreground">
              Dựa trên bài đã được chấm điểm
            </p>
            <div className="mt-5 space-y-3">
              <PassFailBar label="Đạt" count={passedCount} total={graded} color="bg-emerald-500" />
              <PassFailBar label="Không đạt" count={failedCount} total={graded} color="bg-destructive" />
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
            <h3 className="text-sm font-black uppercase text-foreground">Tình trạng nộp bài</h3>
            <p className="mt-1 text-xs font-medium text-muted-foreground">
              Tổng quan bài nộp của lớp
            </p>
            <div className="mt-5 grid grid-cols-2 gap-3">
              <MiniStat label="Đã nộp" value={String(submitted)} accent="text-primary-brand" />
              <MiniStat label="Chưa nộp" value={String(missing)} accent="text-destructive" />
              <MiniStat label="Đã chấm" value={String(graded)} accent="text-emerald-600" />
              <MiniStat label="Chờ chấm" value={String(Math.max(0, submitted - graded))} accent="text-amber-500" />
            </div>
          </div>
        </div>
      </main>
    </div>
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

function MiniStat({ label, value, accent }: { label: string; value: string; accent: string }) {
  return (
    <div className="rounded-xl border border-border bg-muted/40 p-3">
      <div className="text-[10px] font-black uppercase text-muted-foreground">{label}</div>
      <div className={`mt-1 text-xl font-black ${accent}`}>{value}</div>
    </div>
  );
}

function PassFailBar({ label, count, total, color }: { label: string; count: number; total: number; color: string }) {
  const percent = total > 0 ? Math.round((count / total) * 100) : 0;
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-[11px] font-bold text-muted-foreground">
        <span>{label}</span>
        <span>
          {count} · {percent}%
        </span>
      </div>
      <div className="h-2.5 overflow-hidden rounded-full bg-muted">
        <div
          className={`h-full rounded-full ${color} transition-all duration-500`}
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}

function CompletionRing({ value }: { value: number }) {
  const size = 64;
  const stroke = 8;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (value / 100) * circumference;
  return (
    <svg width={size} height={size} className="shrink-0 -rotate-90">
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        stroke="#e5e7eb"
        strokeWidth={stroke}
        fill="none"
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        stroke="#10b981"
        strokeWidth={stroke}
        fill="none"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        strokeLinecap="round"
        className="transition-all duration-500"
      />
    </svg>
  );
}

function buildScoreBuckets(submissions: ExamSubmission[]) {
  const grades = submissions
    .map(s => s.grade)
    .filter((g): g is number => typeof g === 'number' && Number.isFinite(g));
  const buckets = [
    { label: '<=1', min: 0, max: 1 },
    { label: '<=2', min: 1.01, max: 2 },
    { label: '<=3', min: 2.01, max: 3 },
    { label: '<=4', min: 3.01, max: 4 },
    { label: '<=5', min: 4.01, max: 5 },
    { label: '<=6', min: 5.01, max: 6 },
    { label: '<=7', min: 6.01, max: 7 },
    { label: '<=8', min: 7.01, max: 8 },
    { label: '<=9', min: 8.01, max: 9 },
    { label: '<=10', min: 9.01, max: 10 },
  ];
  return buckets.map(b => {
    const count = grades.filter(g => g >= b.min && g <= b.max + 0.0001).length;
    return {
      label: b.label,
      count,
      percent: grades.length > 0 ? Math.round((count / grades.length) * 100) : 0,
    };
  });
}

function buildScoreStats(submissions: ExamSubmission[]) {
  const grades = submissions
    .map(s => s.grade)
    .filter((g): g is number => typeof g === 'number' && Number.isFinite(g))
    .sort((a, b) => a - b);
  const totalScore = grades.reduce((acc, g) => acc + g, 0);
  const average = grades.length > 0 ? totalScore / grades.length : 0;
  const median =
    grades.length === 0
      ? 0
      : grades.length % 2 === 1
      ? grades[(grades.length - 1) / 2]
      : (grades[grades.length / 2 - 1] + grades[grades.length / 2]) / 2;

  const counts = new Map<number, number>();
  for (const g of grades) {
    const key = Math.round(g * 10) / 10;
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  let mode = 0;
  let maxCount = 0;
  for (const [value, count] of counts.entries()) {
    if (count > maxCount) {
      maxCount = count;
      mode = value;
    }
  }

  return {
    sortedGrades: grades,
    totalScore,
    averageGrade: average.toFixed(2),
    medianGrade: median.toFixed(1),
    modeGrade: mode.toFixed(1),
  };
}

function ScoreStatRow({ label, value, isLast }: { label: string; value: string; isLast?: boolean }) {
  return (
    <tr className={isLast ? '' : 'border-b border-border'}>
      <td className="bg-muted/30 px-4 py-2.5 text-xs font-black text-foreground">{label}</td>
      <td className="px-4 py-2.5 text-right text-sm font-black text-primary-brand">{value}</td>
    </tr>
  );
}
