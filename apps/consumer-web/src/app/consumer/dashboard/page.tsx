'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSelector } from 'react-redux';
import {
  TrendingUp,
  TrendingDown,
  BookOpen,
  Award,
  Sparkles,
  ArrowUpRight,
  Calendar as CalendarIcon,
  GraduationCap,
  Target,
  CheckCircle2,
  Plus,
  ChevronRight,
  Activity,
  Users,
  Clock,
} from 'lucide-react';
import type { RootState } from '@/lib/redux/store';
import { cn } from '@shared/lib/utils';

const MOCK_STATS = [
  {
    label: 'GPA tích lũy',
    value: '3.84',
    suffix: '/4.0',
    delta: '+0.12',
    deltaType: 'up' as const,
    icon: GraduationCap,
    color: 'bg-indigo-600',
    bg: 'bg-indigo-50',
    fg: 'text-indigo-600',
  },
  {
    label: 'Lớp đang học',
    value: '6',
    suffix: 'lớp',
    delta: '+1',
    deltaType: 'up' as const,
    icon: BookOpen,
    color: 'bg-emerald-600',
    bg: 'bg-emerald-50',
    fg: 'text-emerald-600',
  },
  {
    label: 'Bài đã nộp',
    value: '24',
    suffix: '/28',
    delta: '+4 tuần này',
    deltaType: 'up' as const,
    icon: CheckCircle2,
    color: 'bg-amber-500',
    bg: 'bg-amber-50',
    fg: 'text-amber-600',
  },
  {
    label: 'Chuyên cần',
    value: '98',
    suffix: '%',
    delta: '-2%',
    deltaType: 'down' as const,
    icon: Target,
    color: 'bg-rose-600',
    bg: 'bg-rose-50',
    fg: 'text-rose-600',
  },
];

const MOCK_GRADES = [
  { course: 'Advanced Web Development', code: 'CS301', assignment: 'Final Project', score: 95, total: 100, date: '2 ngày trước', grade: 'A+' },
  { course: 'Database Management Systems', code: 'CS205', assignment: 'Midterm Exam', score: 88, total: 100, date: '1 tuần trước', grade: 'B+' },
  { course: 'UI/UX Design Principles', code: 'DS210', assignment: 'Case Study', score: 92, total: 100, date: '2 tuần trước', grade: 'A' },
  { course: 'Mobile App Development', code: 'CS340', assignment: 'Quiz #3', score: 100, total: 100, date: '3 tuần trước', grade: 'A+' },
  { course: 'Data Structures & Algorithms', code: 'CS201', assignment: 'Homework #4', score: 42, total: 50, date: '4 tuần trước', grade: 'A' },
];

const PERFORMANCE_DATA = [
  { week: 'T1', value: 72 },
  { week: 'T2', value: 78 },
  { week: 'T3', value: 85 },
  { week: 'T4', value: 82 },
  { week: 'T5', value: 88 },
  { week: 'T6', value: 92 },
  { week: 'T7', value: 95 },
];

const SCHEDULE = [
  { time: '09:00', title: 'React Workshop', type: 'Trực tiếp', color: 'bg-rose-500' },
  { time: '11:30', title: 'Database Quiz', type: 'Deadline', color: 'bg-amber-500' },
  { time: '14:00', title: 'Design Review', type: 'Họp nhóm', color: 'bg-emerald-500' },
];

export default function DashboardPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const userProfile = useSelector((s: RootState) => s.user.profile);

  useEffect(() => {
    setMounted(true);
    const token = localStorage.getItem('accessToken');
    if (!token) {
      router.push('/consumer/login');
      return;
    }
    setIsAuthenticated(true);
  }, [router]);

  if (!mounted || !isAuthenticated) return null;

  const displayName = userProfile?.full_name || userProfile?.username || 'bạn';
  const firstName = displayName.split(' ').pop() || displayName;
  const maxScore = Math.max(...PERFORMANCE_DATA.map((d) => d.value));

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6 sm:space-y-8">

        {/* ── Hero greeting ── */}
        <div className="relative overflow-hidden rounded-2xl bg-indigo-600 p-6 sm:p-8 text-white shadow-lg">
          <div className="absolute inset-0 opacity-[0.08]" style={{ backgroundImage: 'radial-gradient(circle, #ffffff 1px, transparent 1px)', backgroundSize: '24px 24px' }} />
          <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full bg-indigo-500/50 blur-3xl" />
          <div className="absolute -bottom-20 -left-10 w-48 h-48 rounded-full bg-sky-500/30 blur-3xl" />

          <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/15 border border-white/20 text-[11px] font-semibold tracking-wide mb-3">
                <Sparkles size={11} />
                Hôm nay là ngày tuyệt vời để học
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight mb-1 text-balance">
                Chào {firstName} 👋
              </h1>
              <p className="text-indigo-100 text-[15px] max-w-lg">
                Bạn đã hoàn thành 24/28 bài tập. Cố lên, mục tiêu GPA 3.9 đang chờ phía trước.
              </p>
            </div>

            <button
              onClick={() => router.push('/consumer/classroom')}
              className="inline-flex items-center gap-1.5 px-4 h-10 rounded-lg bg-white text-indigo-700 text-[13px] font-semibold hover:bg-indigo-50 transition-colors shadow-md"
            >
              <Plus size={15} strokeWidth={2.5} />
              Tham gia lớp mới
            </button>
          </div>
        </div>

        {/* ── Stats Grid ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {MOCK_STATS.map((s, i) => {
            const Icon = s.icon;
            const isUp = s.deltaType === 'up';
            return (
              <div
                key={s.label}
                style={{ animationDelay: `${i * 50}ms` }}
                className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5 card-elevated animate-fade-up"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center text-white shadow-sm", s.color)}>
                    <Icon size={18} strokeWidth={2.2} />
                  </div>
                  <div className={cn(
                    "flex items-center gap-0.5 text-[11px] font-semibold px-1.5 py-0.5 rounded-md",
                    isUp ? "text-emerald-700 bg-emerald-50" : "text-rose-700 bg-rose-50"
                  )}>
                    {isUp ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
                    {s.delta}
                  </div>
                </div>
                <div className="flex items-baseline gap-1">
                  <p className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight tabular-nums">{s.value}</p>
                  {s.suffix && <span className="text-sm text-slate-500 font-medium">{s.suffix}</span>}
                </div>
                <p className="text-xs text-slate-600 mt-0.5 font-medium">{s.label}</p>
              </div>
            );
          })}
        </div>

        {/* ── Performance + Schedule ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
          {/* Performance chart */}
          <div className="lg:col-span-2 bg-white border border-slate-200 rounded-xl p-5 sm:p-6 card-elevated">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Activity size={15} className="text-indigo-600" />
                  Hiệu suất học tập
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">7 tuần gần nhất</p>
              </div>
              <div className="flex items-center gap-1 bg-slate-100 rounded-lg p-0.5">
                {['Tuần', 'Tháng', 'Học kỳ'].map((v) => (
                  <button
                    key={v}
                    className={cn(
                      "px-2.5 py-1 text-[11px] font-semibold rounded-md transition-colors",
                      v === 'Tuần'
                        ? "bg-white text-slate-900 shadow-sm"
                        : "text-slate-500 hover:text-slate-900"
                    )}
                  >
                    {v}
                  </button>
                ))}
              </div>
            </div>

            {/* Bar chart */}
            <div className="h-48 sm:h-56 flex items-end justify-between gap-2 sm:gap-3">
              {PERFORMANCE_DATA.map((d, i) => {
                const height = (d.value / 100) * 100;
                const isLast = i === PERFORMANCE_DATA.length - 1;
                return (
                  <div key={d.week} className="flex-1 flex flex-col items-center gap-2 group">
                    <div className="relative w-full h-full flex items-end">
                      <div
                        className={cn(
                          "w-full rounded-t-md transition-all",
                          isLast
                            ? "bg-indigo-600"
                            : "bg-slate-200 group-hover:bg-indigo-300"
                        )}
                        style={{ height: `${height}%`, minHeight: '4px' }}
                      />
                      <div className="absolute -top-6 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-900 text-white text-[10px] font-semibold px-1.5 py-0.5 rounded">
                        {d.value}
                      </div>
                    </div>
                    <span className={cn(
                      "text-[11px] font-semibold",
                      isLast ? "text-indigo-600" : "text-slate-500"
                    )}>
                      {d.week}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Today's schedule */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 sm:p-6 card-elevated">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <CalendarIcon size={15} className="text-indigo-600" />
                Hôm nay
              </h3>
              <button className="text-[11px] font-semibold text-indigo-600 hover:underline">
                Xem tất cả
              </button>
            </div>
            <div className="space-y-2.5">
              {SCHEDULE.map((item) => (
                <div
                  key={item.title}
                  className="group flex items-center gap-3 p-3 rounded-lg border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/50 transition-colors cursor-pointer"
                >
                  <div className="text-[11px] font-bold text-slate-500 tabular-nums w-10 shrink-0">
                    {item.time}
                  </div>
                  <div className={cn("w-1 h-8 rounded-full shrink-0", item.color)} />
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-semibold text-slate-900 truncate">{item.title}</p>
                    <p className="text-[11px] text-slate-500">{item.type}</p>
                  </div>
                  <ChevronRight size={14} className="text-slate-300 group-hover:text-indigo-600 transition-colors" />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Recent Grades ── */}
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden card-elevated">
          <div className="flex items-center justify-between p-5 sm:p-6 border-b border-slate-200">
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Award size={15} className="text-amber-500" />
                Kết quả gần đây
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">5 bài đánh giá mới nhất</p>
            </div>
            <button
              onClick={() => router.push('/consumer/grades')}
              className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:underline"
            >
              Xem tất cả
              <ArrowUpRight size={13} />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50">
                  <th className="text-left text-[11px] font-bold uppercase tracking-wider text-slate-500 px-5 sm:px-6 py-3">Môn học</th>
                  <th className="text-left text-[11px] font-bold uppercase tracking-wider text-slate-500 px-5 sm:px-6 py-3 hidden sm:table-cell">Bài</th>
                  <th className="text-left text-[11px] font-bold uppercase tracking-wider text-slate-500 px-5 sm:px-6 py-3">Điểm</th>
                  <th className="text-left text-[11px] font-bold uppercase tracking-wider text-slate-500 px-5 sm:px-6 py-3 hidden md:table-cell">Ngày</th>
                  <th className="text-right text-[11px] font-bold uppercase tracking-wider text-slate-500 px-5 sm:px-6 py-3">Tiến độ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {MOCK_GRADES.map((g) => {
                  const pct = (g.score / g.total) * 100;
                  const isExcellent = pct >= 90;
                  return (
                    <tr key={g.course} className="hover:bg-slate-50 transition-colors group">
                      <td className="px-5 sm:px-6 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className={cn(
                            "w-9 h-9 rounded-lg flex items-center justify-center text-[11px] font-bold shrink-0",
                            isExcellent
                              ? "bg-emerald-100 text-emerald-700"
                              : "bg-slate-100 text-slate-600"
                          )}>
                            {g.grade}
                          </div>
                          <div className="min-w-0">
                            <p className="text-[13px] font-semibold text-slate-900 truncate">{g.course}</p>
                            <p className="text-[11px] text-slate-500">{g.code}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 sm:px-6 py-3.5 text-[13px] text-slate-600 hidden sm:table-cell">{g.assignment}</td>
                      <td className="px-5 sm:px-6 py-3.5">
                        <div className="flex items-baseline gap-1">
                          <span className={cn(
                            "text-[14px] font-bold tabular-nums",
                            isExcellent ? "text-emerald-600" : "text-slate-900"
                          )}>
                            {g.score}
                          </span>
                          <span className="text-[11px] text-slate-500">/{g.total}</span>
                        </div>
                      </td>
                      <td className="px-5 sm:px-6 py-3.5 text-[12px] text-slate-500 hidden md:table-cell">{g.date}</td>
                      <td className="px-5 sm:px-6 py-3.5">
                        <div className="flex items-center justify-end gap-2">
                          <div className="w-20 sm:w-24 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                            <div
                              className={cn(
                                "h-full rounded-full transition-all",
                                isExcellent ? "bg-emerald-500" : pct >= 70 ? "bg-amber-500" : "bg-rose-500"
                              )}
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                          <span className="text-[11px] font-semibold text-slate-500 tabular-nums w-9 text-right">
                            {Math.round(pct)}%
                          </span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
