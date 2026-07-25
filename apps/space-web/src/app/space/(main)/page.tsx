'use client';

import { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@shared/components/ui/card';
import {
  BookOpen,
  Users,
  Award,
  Loader2,
  TrendingUp,
  FileCheck,
  GraduationCap,
  CheckCircle2,
  Clock,
  BarChart3,
  File,
  ClipboardList,
  Video,
  UserX,
  Gamepad2,
  Timer,
} from 'lucide-react';
import { useDashboard } from '@/lib/hooks/use-dashboard';
import type { ActivityLogEventType } from '@/lib/api/types';
import { useTranslation } from '@shared/components/LocaleProvider';

const ACTIVITY_KEY_MAP: Record<ActivityLogEventType, string> = {
  classroom_created: 'dashboard.activity.classroom_created',
  document_uploaded: 'dashboard.activity.document_uploaded',
  document_deleted: 'dashboard.activity.document_deleted',
  exam_created: 'dashboard.activity.exam_created',
  exam_published: 'dashboard.activity.exam_published',
  exam_opened: 'dashboard.activity.exam_opened',
  exam_closed: 'dashboard.activity.exam_closed',
  exam_deleted: 'dashboard.activity.exam_deleted',
  quiz_assigned: 'dashboard.activity.quiz_assigned',
  meeting_started: 'dashboard.activity.meeting_started',
  meeting_ended: 'dashboard.activity.meeting_ended',
  member_joined: 'dashboard.activity.member_joined',
  member_approved: 'dashboard.activity.member_approved',
  member_rejected: 'dashboard.activity.member_rejected',
  member_kicked: 'dashboard.activity.member_kicked',
  member_left: 'dashboard.activity.member_left',
  exam_submitted: 'dashboard.activity.exam_submitted',
};

function getActivityMeta(eventType: ActivityLogEventType, t: (key: string) => string) {
  const map: Record<ActivityLogEventType, { icon: React.ElementType; color: string; bg: string; label: string }> = {
    classroom_created: { icon: GraduationCap, color: 'text-primary-brand', bg: 'bg-primary-brand-light', label: t(ACTIVITY_KEY_MAP.classroom_created) },
    document_uploaded: { icon: File,          color: 'text-blue-600',   bg: 'bg-blue-50',   label: t(ACTIVITY_KEY_MAP.document_uploaded) },
    document_deleted:  { icon: File,          color: 'text-red-500',    bg: 'bg-red-50',    label: t(ACTIVITY_KEY_MAP.document_deleted) },
    exam_created:      { icon: ClipboardList, color: 'text-orange-600', bg: 'bg-orange-50', label: t(ACTIVITY_KEY_MAP.exam_created) },
    exam_published:    { icon: CheckCircle2,  color: 'text-green-600',  bg: 'bg-green-50',  label: t(ACTIVITY_KEY_MAP.exam_published) },
    exam_opened:       { icon: Timer,         color: 'text-emerald-600',bg: 'bg-emerald-50',label: t(ACTIVITY_KEY_MAP.exam_opened) },
    exam_closed:       { icon: Clock,         color: 'text-muted-foreground',  bg: 'bg-muted/50',  label: t(ACTIVITY_KEY_MAP.exam_closed) },
    exam_deleted:      { icon: ClipboardList, color: 'text-red-500',    bg: 'bg-red-50',    label: t(ACTIVITY_KEY_MAP.exam_deleted) },
    quiz_assigned:     { icon: Gamepad2,      color: 'text-purple-600', bg: 'bg-purple-50', label: t(ACTIVITY_KEY_MAP.quiz_assigned) },
    meeting_started:   { icon: Video,         color: 'text-sky-600',    bg: 'bg-sky-50',    label: t(ACTIVITY_KEY_MAP.meeting_started) },
    meeting_ended:     { icon: Video,         color: 'text-muted-foreground',  bg: 'bg-muted/50',  label: t(ACTIVITY_KEY_MAP.meeting_ended) },
    member_joined:     { icon: Users,         color: 'text-blue-500',   bg: 'bg-blue-50',   label: t(ACTIVITY_KEY_MAP.member_joined) },
    member_approved:   { icon: CheckCircle2,  color: 'text-green-600',  bg: 'bg-green-50',  label: t(ACTIVITY_KEY_MAP.member_approved) },
    member_rejected:   { icon: UserX,         color: 'text-red-500',    bg: 'bg-red-50',    label: t(ACTIVITY_KEY_MAP.member_rejected) },
    member_kicked:     { icon: UserX,         color: 'text-red-500',    bg: 'bg-red-50',    label: t(ACTIVITY_KEY_MAP.member_kicked) },
    member_left:       { icon: Users,         color: 'text-muted-foreground',  bg: 'bg-muted/50',  label: t(ACTIVITY_KEY_MAP.member_left) },
    exam_submitted:    { icon: FileCheck,     color: 'text-teal-600',   bg: 'bg-teal-50',   label: t(ACTIVITY_KEY_MAP.exam_submitted) },
  };
  return map[eventType] ?? { icon: ClipboardList, color: 'text-muted-foreground', bg: 'bg-muted/50', label: eventType };
}

function timeAgo(isoString: string, t: (key: string, fb?: string, values?: Record<string, string | number>) => string): string {
  if (!isoString) return '';
  const diff = Date.now() - new Date(isoString).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return t('dashboard.time_ago.just_now');
  if (minutes < 60) return t('dashboard.time_ago.minutes_ago', undefined, { count: minutes });
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return t('dashboard.time_ago.hours_ago', undefined, { count: hours });
  return t('dashboard.time_ago.days_ago', undefined, { count: Math.floor(hours / 24) });
}

const QUOTES = [
  { text: 'Giáo dục là vũ khí mạnh nhất bạn có thể dùng để thay đổi thế giới.', author: 'Nelson Mandela' },
  { text: 'Người thầy ảnh hưởng đến cõi đời đời, không ai biết được ảnh hưởng của họ dừng lại ở đâu.', author: 'Henry Adams' },
  { text: 'Mục đích của giáo dục là biến gương thành cửa sổ.', author: 'Sydney J. Harris' },
  { text: 'Dạy học không phải là đổ đầy một cái xô, mà là thắp sáng một ngọn lửa.', author: 'W. B. Yeats' },
  { text: 'Mọi đứa trẻ đều là thiên tài. Nhưng nếu bạn đánh giá một con cá qua khả năng leo cây...', author: 'Albert Einstein' },
  { text: 'Học không bao giờ làm mệt trí óc. Sự nhàm chán đến từ sự lặp lại, không từ sự học hỏi.', author: 'Leonardo da Vinci' },
  { text: 'Giáo viên giỏi nhất là người dạy trò tìm ra câu trả lời, không phải cho họ câu trả lời.', author: 'Lao Tzu' },
];

function getDailyQuote() {
  const day = Math.floor(Date.now() / 86400000);
  return QUOTES[day % QUOTES.length];
}

function getGreeting(hour: number, t: (key: string) => string): { text: string; emoji: string; gradient: string } {
  if (hour < 6)  return { text: t('dashboard.greeting.night'),    emoji: '🌙', gradient: 'from-slate-800 via-indigo-900 to-slate-900' };
  if (hour < 12) return { text: t('dashboard.greeting.morning'),  emoji: '☀️', gradient: 'from-orange-400 via-amber-500 to-yellow-400' };
  if (hour < 18) return { text: t('dashboard.greeting.afternoon'), emoji: '⛅', gradient: 'from-sky-500 via-indigo-500 to-violet-500' };
  return          { text: t('dashboard.greeting.evening'),   emoji: '🌆', gradient: 'from-indigo-600 via-purple-600 to-slate-700' };
}

// ── Dashboard ────────────────────────────────────────────────────────────────

export default function SpaceDashboardPage() {
  const { t, formatDate: localeFormatDate, formatTime: localeFormatTime } = useTranslation();
  const { status, data } = useDashboard();
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  if (status === 'loading' || !data) {
    return (
      <div className="flex h-screen items-center justify-center bg-muted/50">
        <div className="flex flex-col items-center gap-4">
          <Loader2 size={40} className="animate-spin text-primary-brand" />
          <p className="text-muted-foreground font-medium">{t('dashboard.loading')}</p>
        </div>
      </div>
    );
  }

  const { teacherName, summary } = data;
  const kpis = summary.kpis;
  const recentActivity = summary.recent_activity;
  const weeklyTrend = summary.weekly_trend;
  const topClasses = summary.top_classes;

  const completionPct = kpis.completion_rate_pct ?? 0;

  const weeklyMax = Math.max(1, ...weeklyTrend.flatMap((d) => [d.enrolled, d.submitted]));

  const statCards = [
    {
      name: t('dashboard.stats.total_classrooms'),
      value: kpis.total_classrooms,
      sub: t('dashboard.stats.total_classrooms_sub', undefined, { count: kpis.active_classrooms }),
      icon: BookOpen,
      color: 'text-blue-600',
      bg: 'bg-blue-50',
      trend: true,
    },
    {
      name: t('dashboard.stats.active_students'),
      value: kpis.total_students,
      sub: t('dashboard.stats.active_students_sub', undefined, { count: kpis.total_classrooms }),
      icon: Users,
      color: 'text-green-600',
      bg: 'bg-green-50',
      trend: true,
    },
    {
      name: t('dashboard.stats.completion_rate'),
      value: `${completionPct.toFixed(completionPct % 1 === 0 ? 0 : 1)}%`,
      sub: t('dashboard.stats.completion_rate_sub', undefined, {
        graded: kpis.graded,
        total: kpis.submissions,
      }),
      icon: TrendingUp,
      color: 'text-orange-600',
      bg: 'bg-orange-50',
      trend: true,
    },
    {
      name: t('dashboard.stats.certificates_issued'),
      value: kpis.certificates_issued,
      sub: t('dashboard.stats.certificates_issued_sub', undefined, { count: kpis.exams_published }),
      icon: Award,
      color: 'text-purple-600',
      bg: 'bg-purple-50',
      trend: false,
    },
  ];

  const greeting = getGreeting(now.getHours(), t);
  const quote = getDailyQuote();
  const timeStr = localeFormatTime(now);
  const dateStr = localeFormatDate(now, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  const firstName = teacherName.split(' ').pop() ?? teacherName;

  return (
    <div className="space-y-8 animate-in fade-in duration-500">

      {/* ── Greeting Card ── */}
      <div className={`relative overflow-hidden rounded-3xl bg-gradient-to-br ${greeting.gradient} p-8 text-white shadow-xl`}>
        <div className="absolute -top-10 -right-10 w-48 h-48 rounded-full bg-white/5 blur-2xl" />
        <div className="absolute -bottom-8 -left-8 w-40 h-40 rounded-full bg-white/5 blur-2xl" />
        <div className="absolute top-4 right-4 w-24 h-24 rounded-full bg-white/5 blur-xl" />

        <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <span className="text-4xl animate-bounce" style={{ animationDuration: '2s' }}>
                {greeting.emoji}
              </span>
              <div>
                <p className="text-white/70 text-sm font-semibold uppercase tracking-widest">
                  {dateStr}
                </p>
                <h1 className="text-2xl md:text-3xl font-black tracking-tight mt-0.5">
                  {t('dashboard.greeting.with_name', undefined, { greeting: greeting.text, name: firstName })}
                </h1>
              </div>
            </div>

            <div className="mt-4 bg-white/10 backdrop-blur-sm rounded-2xl px-5 py-3 border border-white/10 max-w-lg">
              <p className="text-sm font-medium text-white/90 leading-relaxed italic">
                &ldquo;{quote.text}&rdquo;
              </p>
              <p className="text-xs text-white/60 font-bold mt-1.5">— {quote.author}</p>
            </div>
          </div>

          <div className="shrink-0 text-right">
            <div className="text-4xl md:text-5xl font-black tracking-tighter tabular-nums">
              {timeStr}
            </div>
            <p className="text-white/60 text-xs font-bold uppercase tracking-widest mt-1">
              {t('dashboard.current_time')}
            </p>
            <div className="flex items-center gap-4 mt-4 justify-end">
              <div className="text-center">
                <div className="text-xl font-black">{kpis.total_classrooms}</div>
                <div className="text-[10px] text-white/60 uppercase font-bold">{t('dashboard.mini_stats.classrooms')}</div>
              </div>
              <div className="w-px h-8 bg-white/20" />
              <div className="text-center">
                <div className="text-xl font-black">{kpis.total_students}</div>
                <div className="text-[10px] text-white/60 uppercase font-bold">{t('dashboard.mini_stats.students')}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat) => (
          <Card key={stat.name} className="border-border shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{stat.name}</CardTitle>
              <div className={`w-9 h-9 rounded-xl ${stat.bg} flex items-center justify-center`}>
                <stat.icon size={18} className={stat.color} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">{stat.value}</div>
              <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                {stat.trend && <TrendingUp size={11} className="text-emerald-500" />}
                {stat.sub}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Middle Row */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Weekly Bar Chart */}
        <Card className="lg:col-span-2 border-border shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <BarChart3 size={18} className="text-primary-brand" />
              {t('dashboard.chart.title')}
            </CardTitle>
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-primary-brand inline-block" />{t('dashboard.chart.enrolled_label')}</span>
              <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-emerald-400 inline-block" />{t('dashboard.chart.submitted_label')}</span>
            </div>
          </CardHeader>
          <CardContent>
            {weeklyTrend.length === 0 ? (
              <p className="text-sm text-muted-foreground italic text-center py-8">{t('dashboard.recent_activity.empty')}</p>
            ) : (
              <div className="flex items-end justify-between gap-3 h-36 px-2">
                {weeklyTrend.map((d) => {
                  const enrolledH = (d.enrolled / weeklyMax) * 100;
                  const submittedH = (d.submitted / weeklyMax) * 100;
                  return (
                    <div key={d.date} className="flex-1 flex flex-col items-center gap-1.5">
                      <div className="w-full flex items-end justify-center gap-1 h-28">
                        <div
                          className="flex-1 bg-primary-brand rounded-t-md transition-all duration-700"
                          style={{ height: `${enrolledH}%` }}
                          title={t('dashboard.chart.enrolled_tooltip', undefined, { count: d.enrolled })}
                        />
                        <div
                          className="flex-1 bg-emerald-400 rounded-t-md transition-all duration-700"
                          style={{ height: `${submittedH}%` }}
                          title={t('dashboard.chart.submitted_tooltip', undefined, { count: d.submitted })}
                        />
                      </div>
                      <span className="text-[10px] font-bold text-muted-foreground uppercase">
                        {t(`dashboard.chart.${d.weekday}`)}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card className="border-border shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Clock size={18} className="text-muted-foreground" />
              {t('dashboard.recent_activity.title')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {recentActivity.length === 0 ? (
              <p className="text-sm text-muted-foreground italic text-center py-4">{t('dashboard.recent_activity.empty')}</p>
            ) : (
              <div className="space-y-4">
                {recentActivity.map((log) => {
                  const { icon: Icon, color, bg, label } = getActivityMeta(log.event_type, t);
                  return (
                    <div key={log.uid} className="flex items-start gap-3">
                      <div className={`w-7 h-7 rounded-lg ${bg} flex items-center justify-center shrink-0 mt-0.5`}>
                        <Icon size={14} className={color} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-foreground leading-snug">
                          {label}{log.target_name ? ` — ${log.target_name}` : ''}
                        </p>
                        {log.actor_name && (
                          <p className="text-[10px] text-muted-foreground mt-0.5 font-medium">{log.actor_name}</p>
                        )}
                        <p className="text-[10px] text-muted-foreground mt-0.5">{timeAgo(log.created_at, t)}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Bottom Row */}
      <div className="grid gap-6 lg:grid-cols-1">
        {/* Top Classes */}
        <Card className="border-border shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <GraduationCap size={18} className="text-primary-brand" />
              {t('dashboard.top_classes.title')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {topClasses.length === 0 ? (
              <p className="text-sm text-muted-foreground italic text-center py-4">{t('dashboard.recent_activity.empty')}</p>
            ) : (
              <div className="space-y-4">
                {topClasses.map((cls) => (
                  <div key={cls.uid} className="space-y-1.5">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium text-foreground truncate">{cls.name}</span>
                      <span className="text-xs text-muted-foreground shrink-0 ml-2">{t('dashboard.top_classes.students_count', undefined, { current: cls.students, max: cls.max })}</span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-1.5">
                      <div
                        className="h-1.5 rounded-full bg-primary-brand transition-all duration-700"
                        style={{ width: `${cls.progress}%` }}
                      />
                    </div>
                    <p className="text-[10px] text-muted-foreground">{t('dashboard.top_classes.progress', undefined, { percent: cls.progress })}</p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
