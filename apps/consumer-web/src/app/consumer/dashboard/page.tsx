'use client';

import { useEffect, useState } from 'react';
import { Button } from '@shared/components/ui/button';
import { Skeleton } from '@shared/components/ui/skeleton';
import { useRouter } from 'next/navigation';
import { useSelector } from 'react-redux';
import {
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
  Users,
  ShieldCheck,
} from 'lucide-react';
import type { RootState } from '@/lib/redux/store';
import { cn } from '@shared/lib/utils';
import { consumerDashboardApi } from '@/lib/api';
import type { DashboardSummary, DashboardScheduleItem, DashboardRecentGrade } from '@/lib/api';

const SCHEDULE_TYPE_LABEL: Record<DashboardScheduleItem['type'], string> = {
  class: 'Buổi học',
  exam: 'Bài kiểm tra',
  deadline: 'Deadline',
  study_session: 'Ôn tập',
};

const SCHEDULE_TYPE_COLOR: Record<DashboardScheduleItem['type'], string> = {
  class: 'bg-primary',
  exam: 'bg-destructive',
  deadline: 'bg-warning',
  study_session: 'bg-success',
};

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
}

function formatDate(iso: string | null): string {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function gradeLetter(pct: number): string {
  if (pct >= 95) return 'A+';
  if (pct >= 85) return 'A';
  if (pct >= 75) return 'B+';
  if (pct >= 65) return 'B';
  if (pct >= 50) return 'C';
  return 'D';
}

export default function DashboardPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);
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

  useEffect(() => {
    if (!isAuthenticated) return;
    let cancelled = false;
    consumerDashboardApi
      .getSummary()
      .then((data) => {
        if (!cancelled) setSummary(data);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [isAuthenticated]);

  if (!mounted || !isAuthenticated) return null;

  const displayName = userProfile?.full_name || userProfile?.username || 'bạn';
  const firstName = displayName.split(' ').pop() || displayName;

  const stats = summary
    ? [
        {
          label: 'GPA tích lũy',
          value: summary.gpa.gpa_4.toFixed(2),
          suffix: '/4.0',
          icon: GraduationCap,
          color: 'bg-primary',
        },
        {
          label: 'Lớp đang học',
          value: String(summary.active_classrooms),
          suffix: 'lớp',
          icon: BookOpen,
          color: 'bg-success',
        },
        {
          label: 'Bài đã nộp',
          value: String(summary.assignments_submitted),
          suffix: `/${summary.assignments_total}`,
          icon: CheckCircle2,
          color: 'bg-warning',
        },
        {
          label: 'Chuyên cần',
          value: summary.attendance_pct.toFixed(0),
          suffix: '%',
          icon: Target,
          color: 'bg-destructive',
        },
      ]
    : [];

  return (
    <div className="min-h-screen bg-muted dark:bg-slate-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6 sm:space-y-8">

        {/* ── Hero greeting ── */}
        <div className="relative overflow-hidden rounded-2xl bg-primary p-6 sm:p-8 text-white shadow-lg">
          <div className="absolute inset-0 opacity-[0.08]" style={{ backgroundImage: 'radial-gradient(circle, #ffffff 1px, transparent 1px)', backgroundSize: '24px 24px' }} />
          <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full bg-primary/50 blur-3xl" />
          <div className="absolute -bottom-20 -left-10 w-48 h-48 rounded-full bg-sky-500/30 blur-3xl" />

          <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-card/15 border border-white/20 text-[11px] font-semibold tracking-wide mb-3">
                <Sparkles size={11} />
                Hôm nay là ngày tuyệt vời để học
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight mb-1 text-balance">
                Chào {firstName} 👋
              </h1>
              <p className="text-primary-foreground/80 text-[15px] max-w-lg">
                {summary
                  ? `Bạn đã hoàn thành ${summary.assignments_submitted}/${summary.assignments_total} bài tập. GPA hiện tại của bạn là ${summary.gpa.gpa_4.toFixed(2)}/4.0.`
                  : 'Đang tải tiến độ học tập của bạn...'}
              </p>
            </div>

            <Button
              onClick={() => router.push('/consumer/classroom')}
              variant="secondary"
              className="gap-1.5 h-10"
            >
              <Plus size={15} strokeWidth={2.5} />
              Tham gia lớp mới
            </Button>
          </div>
        </div>

        {/* ── Stats Grid ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {loading
            ? Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="bg-card border border-border rounded-xl p-4 sm:p-5 card-elevated">
                  <Skeleton className="w-10 h-10 rounded-lg mb-3" />
                  <Skeleton className="h-7 w-16 mb-1.5" />
                  <Skeleton className="h-3 w-20" />
                </div>
              ))
            : stats.map((s, i) => {
                const Icon = s.icon;
                return (
                  <div
                    key={s.label}
                    style={{ animationDelay: `${i * 50}ms` }}
                    className="bg-card border border-border rounded-xl p-4 sm:p-5 card-elevated animate-fade-up"
                  >
                    <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center text-white shadow-sm mb-3", s.color)}>
                      <Icon size={18} strokeWidth={2.2} />
                    </div>
                    <div className="flex items-baseline gap-1">
                      <p className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight tabular-nums">{s.value}</p>
                      {s.suffix && <span className="text-sm text-muted-foreground font-medium">{s.suffix}</span>}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5 font-medium">{s.label}</p>
                  </div>
                );
              })}
        </div>

        {/* ── Today's schedule ── */}
        <div className="bg-card border border-border rounded-xl p-5 sm:p-6 card-elevated">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-base font-bold text-foreground flex items-center gap-2">
              <CalendarIcon size={15} className="text-primary" />
              Hôm nay
            </h3>
            <Button
              onClick={() => router.push('/consumer/calendar')}
              variant="link"
              className="text-[11px] font-semibold h-auto p-0"
            >
              Xem tất cả
            </Button>
          </div>

          {loading ? (
            <div className="space-y-2.5">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-14 w-full rounded-lg" />
              ))}
            </div>
          ) : !summary?.today_schedule.length ? (
            <div className="flex flex-col items-center justify-center gap-2 py-8 text-center">
              <CalendarIcon size={24} className="text-muted-foreground" />
              <p className="text-[13px] text-muted-foreground">Không có lịch nào hôm nay</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
              {summary.today_schedule.map((item) => (
                <div
                  key={item.uid}
                  className="group flex items-center gap-3 p-3 rounded-lg border border-border hover:border-primary/30 hover:bg-primary/10 transition-colors cursor-pointer"
                >
                  <div className="text-[11px] font-bold text-muted-foreground tabular-nums w-10 shrink-0">
                    {formatTime(item.start_time)}
                  </div>
                  <div className={cn("w-1 h-8 rounded-full shrink-0", SCHEDULE_TYPE_COLOR[item.type])} />
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-semibold text-foreground truncate">{item.title}</p>
                    <p className="text-[11px] text-muted-foreground">{SCHEDULE_TYPE_LABEL[item.type]}</p>
                  </div>
                  <ChevronRight size={14} className="text-slate-300 group-hover:text-primary transition-colors" />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── Recent Grades ── */}
        <div className="bg-card border border-border rounded-xl overflow-hidden card-elevated">
          <div className="flex items-center justify-between p-5 sm:p-6 border-b border-border">
            <div>
              <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                <Award size={15} className="text-warning" />
                Kết quả gần đây
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">5 bài đánh giá mới nhất</p>
            </div>
            <Button
              onClick={() => router.push('/consumer/grades')}
              variant="link"
              className="gap-1 text-xs font-semibold h-auto p-0"
            >
              Xem tất cả
              <ArrowUpRight size={13} />
            </Button>
          </div>

          {loading ? (
            <div className="p-5 sm:p-6 space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full rounded-lg" />
              ))}
            </div>
          ) : !summary?.recent_grades.length ? (
            <div className="flex flex-col items-center justify-center gap-2 py-10 text-center">
              <Award size={24} className="text-muted-foreground" />
              <p className="text-[13px] text-muted-foreground">Chưa có bài nào được chấm điểm</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border bg-muted">
                    <th className="text-left text-[11px] font-bold uppercase tracking-wider text-muted-foreground px-5 sm:px-6 py-3">Môn học</th>
                    <th className="text-left text-[11px] font-bold uppercase tracking-wider text-muted-foreground px-5 sm:px-6 py-3 hidden sm:table-cell">Bài</th>
                    <th className="text-left text-[11px] font-bold uppercase tracking-wider text-muted-foreground px-5 sm:px-6 py-3">Điểm</th>
                    <th className="text-left text-[11px] font-bold uppercase tracking-wider text-muted-foreground px-5 sm:px-6 py-3 hidden md:table-cell">Ngày</th>
                    <th className="text-right text-[11px] font-bold uppercase tracking-wider text-muted-foreground px-5 sm:px-6 py-3">Tiến độ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {summary.recent_grades.map((g: DashboardRecentGrade) => {
                    const pct = g.percent;
                    const isExcellent = pct >= 90;
                    return (
                      <tr key={g.submission_uid} className="hover:bg-muted transition-colors group">
                        <td className="px-5 sm:px-6 py-3.5">
                          <div className="flex items-center gap-3">
                            <div className={cn(
                              "w-9 h-9 rounded-lg flex items-center justify-center text-[11px] font-bold shrink-0",
                              isExcellent
                                ? "bg-success/10 text-success"
                                : "bg-muted text-muted-foreground"
                            )}>
                              {gradeLetter(pct)}
                            </div>
                            <div className="min-w-0">
                              <p className="text-[13px] font-semibold text-foreground truncate">{g.classroom_name}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 sm:px-6 py-3.5 text-[13px] text-muted-foreground hidden sm:table-cell">{g.exam_title}</td>
                        <td className="px-5 sm:px-6 py-3.5">
                          <div className="flex items-baseline gap-1">
                            <span className={cn(
                              "text-[14px] font-bold tabular-nums",
                              isExcellent ? "text-success" : "text-foreground"
                            )}>
                              {g.grade}
                            </span>
                            <span className="text-[11px] text-muted-foreground">/{g.max_grade}</span>
                          </div>
                        </td>
                        <td className="px-5 sm:px-6 py-3.5 text-[12px] text-muted-foreground hidden md:table-cell">{formatDate(g.graded_at)}</td>
                        <td className="px-5 sm:px-6 py-3.5">
                          <div className="flex items-center justify-end gap-2">
                            <div className="w-20 sm:w-24 h-1.5 bg-muted rounded-full overflow-hidden">
                              <div
                                className={cn(
                                  "h-full rounded-full transition-all",
                                  isExcellent ? "bg-success" : pct >= 70 ? "bg-warning" : "bg-destructive"
                                )}
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                            <span className="text-[11px] font-semibold text-muted-foreground tabular-nums w-9 text-right">
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
          )}
        </div>

        {/* ── Recent Certificates ── */}
        <div className="bg-card border border-border rounded-xl overflow-hidden card-elevated">
          <div className="flex items-center justify-between p-5 sm:p-6 border-b border-border">
            <div>
              <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                <ShieldCheck size={15} className="text-primary" />
                Chứng chỉ gần đây
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">Các chứng chỉ đã nhận</p>
            </div>
          </div>

          {loading ? (
            <div className="p-5 sm:p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-20 w-full rounded-lg" />
              ))}
            </div>
          ) : !summary?.recent_certificates.length ? (
            <div className="flex flex-col items-center justify-center gap-2 py-10 text-center">
              <ShieldCheck size={24} className="text-muted-foreground" />
              <p className="text-[13px] text-muted-foreground">Chưa có chứng chỉ nào</p>
            </div>
          ) : (
            <div className="p-5 sm:p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {summary.recent_certificates.map((cert) => (
                <button
                  key={cert.uid}
                  onClick={() => router.push(`/consumer/certificate/${cert.uid}`)}
                  className="group flex items-start gap-3 p-3.5 rounded-lg border border-border hover:border-primary/30 hover:bg-primary/10 transition-colors text-left"
                >
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
                    <Award size={18} strokeWidth={2.2} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-semibold text-foreground truncate">{cert.title || 'Chứng chỉ'}</p>
                    <p className="text-[11px] text-muted-foreground truncate flex items-center gap-1">
                      <Users size={11} />
                      {cert.classroom_name}
                    </p>
                    <p className="text-[10.5px] text-muted-foreground mt-0.5">{cert.issued_at_display}</p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
