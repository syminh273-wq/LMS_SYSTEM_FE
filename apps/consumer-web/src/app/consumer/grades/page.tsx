'use client';

import { Button } from '@shared/components/ui/button';
import {
  Award, BookOpen, GraduationCap, TrendingUp, ArrowUpRight,
  Sparkles, Download,
} from 'lucide-react';
import { cn } from '@shared/lib/utils';

const STATS = [
  {
    label: 'GPA tích lũy', value: '3.85', suffix: '/4.0',
    icon: GraduationCap, color: 'bg-primary',
  },
  {
    label: 'Tín chỉ tích lũy', value: '42', suffix: '/120',
    icon: BookOpen, color: 'bg-success',
  },
  {
    label: 'Xếp hạng', value: 'Top 5%', suffix: '',
    icon: Award, color: 'bg-warning',
  },
];

const GRADES = [
  { course: 'Advanced Web Development', assignment: 'Final Project', grade: 'A+', score: 95, total: 100, date: '2 ngày trước' },
  { course: 'Database Management Systems', assignment: 'Midterm Exam', grade: 'B+', score: 88, total: 100, date: '1 tuần trước' },
  { course: 'UI/UX Design Principles', assignment: 'Case Study', grade: 'A', score: 92, total: 100, date: '2 tuần trước' },
  { course: 'Mobile App Development', assignment: 'Quiz #3', grade: 'A+', score: 100, total: 100, date: '3 tuần trước' },
  { course: 'Data Structures & Algorithms', assignment: 'Homework #4', grade: 'A', score: 42, total: 50, date: '4 tuần trước' },
];

export default function GradesPage() {
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
          <Button variant="outline" className="inline-flex items-center gap-1.5 h-10 self-start sm:self-auto">
            <Download size={14} className="text-primary" />
            Xuất bảng điểm
          </Button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
          {STATS.map((s, i) => {
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

          <div className="space-y-2">
            {GRADES.map((item, i) => {
              const pct = (item.score / item.total) * 100;
              const isExcellent = pct >= 90;
              const isGood = pct >= 70 && pct < 90;
              return (
                <div
                  key={i}
                  className="group bg-card border border-border rounded-xl card-elevated hover:border-primary/40 transition-colors cursor-pointer overflow-hidden"
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
                      {item.grade}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[13.5px] sm:text-[14px] font-semibold text-foreground group-hover:text-primary transition-colors truncate">
                        {item.course}
                      </p>
                      <p className="text-[11.5px] text-muted-foreground mt-0.5 truncate">{item.assignment}</p>
                    </div>
                    <div className="hidden sm:flex flex-col items-end shrink-0 min-w-[100px]">
                      <div className="flex items-baseline gap-0.5">
                        <span className="text-[15px] font-bold text-foreground tabular-nums">{item.score}</span>
                        <span className="text-[11px] text-muted-foreground">/{item.total}</span>
                      </div>
                      <p className="text-[10.5px] text-muted-foreground mt-0.5">{item.date}</p>
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
        </div>

        <div className="rounded-2xl bg-warning text-white p-5 sm:p-6 shadow-md">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-3.5">
              <div className="flex -space-x-2">
                {[
                  { icon: '🏆', bg: 'bg-warning' },
                  { icon: '⭐', bg: 'bg-success' },
                  { icon: '🎯', bg: 'bg-destructive' },
                ].map((b, i) => (
                  <div
                    key={i}
                    className={cn(
                      "w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-base sm:text-lg ring-2 ring-warning",
                      b.bg
                    )}
                  >
                    {b.icon}
                  </div>
                ))}
              </div>
              <div>
                <p className="text-[14px] font-bold">Bạn đã mở khoá 12 thành tích</p>
                <p className="text-[11.5px] text-amber-50 mt-0.5">Tiếp tục phấn đấu để nhận thêm huy hiệu nhé!</p>
              </div>
            </div>
            <Button variant="link" className="inline-flex items-center gap-1">
              Xem tất cả huy hiệu
              <ArrowUpRight size={13} />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
