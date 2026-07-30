'use client';

import { useEffect, useState } from 'react';
import { Skeleton } from '@shared/components/ui/skeleton';
import {
  Award, BookOpen, GraduationCap, TrendingUp, ArrowUpRight,
  Sparkles, Target,
} from 'lucide-react';
import { cn } from '@shared/lib/utils';
import { consumerDashboardApi } from '@/lib/api';
import type { DashboardSummary, DashboardRecentGrade } from '@/lib/api';

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

export default function GradesPage() {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
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
  }, []);

  const stats = summary
    ? [
        {
          label: 'GPA tích lũy', value: summary.gpa.gpa_4.toFixed(2), suffix: '/4.0',
          icon: GraduationCap, color: 'bg-primary',
        },
        {
          label: 'Lớp đang học', value: String(summary.active_classrooms), suffix: 'lớp',
          icon: BookOpen, color: 'bg-success',
        },
        {
          label: 'Chuyên cần', value: summary.attendance_pct.toFixed(0), suffix: '%',
          icon: Target, color: 'bg-warning',
        },
      ]
    : [];

  return (
    <div className="min-h-screen bg-muted">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6 sm:space-y-8">

        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-success text-success text-[11px] font-semibold mb-2">
              <Sparkles size={11} />
              Theo dõi tiến độ
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight">Điểm số & Thành tích</h1>
            <p className="text-muted-foreground text-[14px] mt-1">
              Theo dõi kết quả học tập và thành tích học thuật của bạn
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
          {loading
            ? Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="bg-card border border-border rounded-xl p-5 card-elevated">
                  <Skeleton className="w-11 h-11 rounded-lg mb-3" />
                  <Skeleton className="h-7 w-16 mb-1.5" />
                  <Skeleton className="h-3 w-24" />
                </div>
              ))
            : stats.map((s, i) => {
                const Icon = s.icon;
                return (
                  <div
                    key={s.label}
                    style={{ animationDelay: `${i * 50}ms` }}
                    className="bg-card border border-border rounded-xl p-5 card-elevated animate-fade-up"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className={cn("w-11 h-11 rounded-lg flex items-center justify-center text-white shadow-sm", s.color)}>
                        <Icon size={20} strokeWidth={2.2} />
                      </div>
                    </div>
                    <div className="flex items-baseline gap-1.5">
                      <p className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight tabular-nums">{s.value}</p>
                      {s.suffix && <span className="text-[13px] text-muted-foreground font-medium">{s.suffix}</span>}
                    </div>
                    <p className="text-[12.5px] text-muted-foreground mt-0.5 font-medium">{s.label}</p>
                  </div>
                );
              })}
        </div>

        <div className="space-y-4">
          <div className="flex items-end justify-between">
            <div>
              <h3 className="text-[15px] font-bold text-foreground flex items-center gap-2">
                <TrendingUp size={14} className="text-primary" />
                Kết quả chi tiết
              </h3>
              <p className="text-[12px] text-muted-foreground mt-0.5">5 bài đánh giá mới nhất</p>
            </div>
          </div>

          {loading ? (
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-16 w-full rounded-xl" />
              ))}
            </div>
          ) : !summary?.recent_grades.length ? (
            <div className="flex flex-col items-center justify-center gap-2 py-10 text-center bg-card border border-border rounded-xl card-elevated">
              <Award size={24} className="text-muted-foreground" />
              <p className="text-[13px] text-muted-foreground">Chưa có bài nào được chấm điểm</p>
            </div>
          ) : (
            <div className="space-y-2">
              {summary.recent_grades.map((item: DashboardRecentGrade) => {
                const pct = item.percent;
                const isExcellent = pct >= 90;
                const isGood = pct >= 70 && pct < 90;
                return (
                  <div
                    key={item.submission_uid}
                    className="group bg-card border border-border rounded-xl card-elevated hover:border-primary/40 transition-colors overflow-hidden"
                  >
                    <div className="flex items-center gap-3 sm:gap-4 p-3.5 sm:p-4">
                      <div className={cn(
                        "w-10 h-10 sm:w-12 sm:h-12 rounded-lg flex items-center justify-center font-bold text-[12px] sm:text-[13px] shrink-0",
                        isExcellent
                          ? "bg-success text-success"
                          : isGood
                          ? "bg-warning text-warning"
                          : "bg-destructive text-destructive"
                      )}>
                        {gradeLetter(pct)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[13.5px] sm:text-[14px] font-semibold text-foreground group-hover:text-primary transition-colors truncate">
                          {item.classroom_name}
                        </p>
                        <p className="text-[11.5px] text-muted-foreground mt-0.5 truncate">{item.exam_title}</p>
                      </div>
                      <div className="hidden sm:flex flex-col items-end shrink-0 min-w-[100px]">
                        <div className="flex items-baseline gap-0.5">
                          <span className="text-[15px] font-bold text-foreground tabular-nums">{item.grade}</span>
                          <span className="text-[11px] text-muted-foreground">/{item.max_grade}</span>
                        </div>
                        <p className="text-[10.5px] text-muted-foreground mt-0.5">{formatDate(item.graded_at)}</p>
                      </div>
                      <div className="w-16 sm:w-20 shrink-0">
                        <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                          <div
                            className={cn(
                              "h-full rounded-full transition-all",
                              isExcellent ? "bg-success" : isGood ? "bg-warning" : "bg-destructive"
                            )}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <p className="text-[10px] text-muted-foreground text-right mt-1 font-semibold tabular-nums">{Math.round(pct)}%</p>
                      </div>
                      <ArrowUpRight size={15} className="text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all shrink-0 hidden sm:block" />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
