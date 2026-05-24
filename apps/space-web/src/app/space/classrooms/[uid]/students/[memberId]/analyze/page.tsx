'use client';

import { use, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  ClipboardCheck,
  TrendingUp,
  TrendingDown,
  Minus,
  Loader2,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Flame,
  BookOpen,
  Activity,
  Target,
  Zap,
  ShieldAlert,
  BarChart2,
  Calendar,
  Award,
} from 'lucide-react';
import { Button } from '@shared/components/ui/button';
import { spaceApi } from '@/lib/api';
import type { ClassroomMember } from '@/lib/api/types';
import { toast } from 'sonner';

// ─── Mock analytics data ───────────────────────────────────────────────────
const MOCK = {
  overall: { score: 72.4, status: 'Improving' as const },
  composite: {
    academic: 78,
    assignment: 65,
    attendance: 80,
    engagement: 68,
    discipline: 70,
  },
  academic: {
    currentGPA: 7.8,
    previousGPA: 6.9,
    passRate: 88,
    gpaWeekly: [
      { label: 'T1', v: 6.5 }, { label: 'T2', v: 6.8 }, { label: 'T3', v: 6.4 },
      { label: 'T4', v: 7.0 }, { label: 'T5', v: 7.2 }, { label: 'T6', v: 6.9 },
      { label: 'T7', v: 7.4 }, { label: 'T8', v: 7.6 }, { label: 'T9', v: 7.8 },
      { label: 'T10', v: 7.5 }, { label: 'T11', v: 7.9 }, { label: 'T12', v: 7.8 },
    ],
  },
  assignment: {
    total: 24, submitted: 20, onTime: 14, late: 6, missed: 4,
    submitRate: 83, onTimeRate: 58, lateRate: 25, missRate: 17,
    avgSubmitTime: '2.4h trước hạn',
    resubmitCount: 3,
    weekly: [
      { label: 'T1', onTime: 3, late: 1, miss: 0 },
      { label: 'T2', onTime: 2, late: 2, miss: 1 },
      { label: 'T3', onTime: 3, late: 0, miss: 0 },
      { label: 'T4', onTime: 2, late: 1, miss: 1 },
      { label: 'T5', onTime: 3, late: 1, miss: 0 },
      { label: 'T6', onTime: 1, late: 1, miss: 1 },
    ],
  },
  attendance: {
    rate: 80, total: 40, attended: 32, absent: 8, lateIn: 3,
    consecutiveAbsent: 2,
    weekly: [
      { label: 'T1', v: 100 }, { label: 'T2', v: 80 }, { label: 'T3', v: 100 },
      { label: 'T4', v: 60 },  { label: 'T5', v: 100 }, { label: 'T6', v: 80 },
      { label: 'T7', v: 100 }, { label: 'T8', v: 80 },  { label: 'T9', v: 60 },
      { label: 'T10', v: 80 }, { label: 'T11', v: 100 }, { label: 'T12', v: 80 },
    ],
  },
  engagement: {
    loginCount: 45, studyHours: 32, videoWatchPct: 68,
    docsOpened: 24, questionsAsked: 5, forumPosts: 3, exercisesDone: 18,
    weekly: [
      { label: 'T1', v: 72 }, { label: 'T2', v: 85 }, { label: 'T3', v: 60 },
      { label: 'T4', v: 78 }, { label: 'T5', v: 90 }, { label: 'T6', v: 55 },
      { label: 'T7', v: 82 }, { label: 'T8', v: 68 }, { label: 'T9', v: 74 },
      { label: 'T10', v: 88 }, { label: 'T11', v: 65 }, { label: 'T12', v: 70 },
    ],
  },
  discipline: {
    consistencyScore: 68, learningStreak: 5, weeklyCompletion: 72, deadlineDiscipline: 58,
  },
  improvement: {
    monthlyDelta: 12.5,
    trend: [
      { label: 'T1', v: -0.3 }, { label: 'T2', v: 0.3 }, { label: 'T3', v: -0.4 },
      { label: 'T4', v: 0.6 },  { label: 'T5', v: 0.2 }, { label: 'T6', v: -0.1 },
      { label: 'T7', v: 0.5 },  { label: 'T8', v: 0.4 }, { label: 'T9', v: -0.2 },
      { label: 'T10', v: 0.3 }, { label: 'T11', v: 0.4 }, { label: 'T12', v: 0.3 },
    ],
  },
  risk: {
    level: 'medium' as 'low' | 'medium' | 'high',
    dropoutRisk: 22,
    burnoutRisk: 18,
    inactiveDays: 1,
    alerts: [
      { type: 'warning' as const, label: 'Tỉ lệ nộp đúng hạn thấp (58%)', sub: 'Cần cải thiện deadline discipline' },
      { type: 'info' as const,    label: 'Engagement giảm 2 tuần liên tiếp', sub: 'Theo dõi hoạt động học tập' },
      { type: 'ok' as const,      label: 'GPA tăng 0.9 điểm so với kỳ trước', sub: 'Tiếp tục duy trì' },
    ],
  },
};

const STATUS_MAP = {
  Improving: { label: 'Đang tiến bộ', color: 'text-emerald-600 bg-emerald-50 border-emerald-200', icon: TrendingUp },
  Stable:    { label: 'Ổn định',      color: 'text-blue-600 bg-blue-50 border-blue-200',          icon: Minus },
  Declining: { label: 'Đang giảm sút', color: 'text-rose-600 bg-rose-50 border-rose-200',        icon: TrendingDown },
  'At Risk': { label: 'Có nguy cơ',   color: 'text-amber-600 bg-amber-50 border-amber-200',      icon: AlertTriangle },
  Excellent: { label: 'Xuất sắc',     color: 'text-violet-600 bg-violet-50 border-violet-200',   icon: Award },
};

// ─────────────────────────────────────────────────────────────────────────────

export default function StudentAnalyzePage({
  params,
}: {
  params: Promise<{ uid: string; memberId: string }>;
}) {
  const { uid, memberId } = use(params);
  const router = useRouter();
  const [member, setMember] = useState<ClassroomMember | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    spaceApi.classrooms.members(uid)
      .then(all => setMember(all.find(m => m.member_id === memberId) ?? null))
      .catch(() => toast.error('Không thể tải dữ liệu sinh viên'))
      .finally(() => setLoading(false));
  }, [uid, memberId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 className="h-10 w-10 animate-spin text-indigo-600" />
      </div>
    );
  }

  const status = MOCK.overall.status;
  const StatusIcon = STATUS_MAP[status].icon;

  return (
    <div className="space-y-6 pb-10">

      {/* ── Page header ── */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="outline" size="icon"
            onClick={() => router.push(`/space/classrooms/${uid}/students/${memberId}`)}
            className="h-10 w-10 rounded-full border-slate-200 bg-white shadow-sm hover:bg-slate-50"
          >
            <ArrowLeft size={18} />
          </Button>
          <div className="flex items-center gap-3">
            {member?.member_avatar ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={member.member_avatar} alt={member.member_name}
                className="h-10 w-10 rounded-xl object-cover" />
            ) : (
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-sm font-black text-indigo-600">
                {(member?.member_name ?? 'S').charAt(0).toUpperCase()}
              </div>
            )}
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-indigo-500">Phân tích toàn diện</p>
              <h1 className="text-xl font-black text-slate-900">{member?.member_name ?? 'Sinh viên'}</h1>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-black ${STATUS_MAP[status].color}`}>
            <StatusIcon size={13} />
            {STATUS_MAP[status].label}
          </span>
          <Button variant="outline" className="gap-2 rounded-xl text-xs font-bold"
            onClick={() => router.push(`/space/classrooms/${uid}/students/${memberId}`)}>
            <ClipboardCheck size={15} /> Chi tiết
          </Button>
        </div>
      </div>

      {/* ── Composite score + breakdown ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Big score */}
        <div className="rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-700 p-6 text-white shadow-lg shadow-indigo-500/20 flex flex-col justify-between">
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-indigo-200">Overall Score</p>
            <div className="mt-2 flex items-end gap-2">
              <span className="text-6xl font-black leading-none">{MOCK.overall.score}</span>
              <span className="text-2xl font-bold text-indigo-300 mb-1">/100</span>
            </div>
          </div>
          <div className="mt-4">
            <p className="text-xs font-bold text-indigo-200 mb-2 uppercase tracking-widest">Công thức tổng hợp</p>
            <p className="text-[10px] text-indigo-300 leading-relaxed font-medium">
              35% Academic · 25% Assignment · 15% Attendance · 15% Engagement · 10% Discipline
            </p>
          </div>
        </div>

        {/* Breakdown bars */}
        <div className="lg:col-span-2 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4">Breakdown by category</p>
          <div className="space-y-3">
            {[
              { label: 'Academic Performance', value: MOCK.composite.academic, weight: '35%', color: 'bg-indigo-500' },
              { label: 'Assignment Behavior',  value: MOCK.composite.assignment, weight: '25%', color: 'bg-violet-500' },
              { label: 'Attendance',           value: MOCK.composite.attendance, weight: '15%', color: 'bg-emerald-500' },
              { label: 'Learning Engagement',  value: MOCK.composite.engagement, weight: '15%', color: 'bg-amber-500' },
              { label: 'Discipline',           value: MOCK.composite.discipline, weight: '10%', color: 'bg-rose-400' },
            ].map(c => (
              <div key={c.label} className="flex items-center gap-3">
                <div className="w-40 shrink-0 flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-600 truncate">{c.label}</span>
                </div>
                <div className="flex-1 h-2 rounded-full bg-slate-100 overflow-hidden">
                  <div className={`h-full rounded-full ${c.color} transition-all duration-700`}
                    style={{ width: `${c.value}%` }} />
                </div>
                <span className="w-8 text-right text-xs font-black text-slate-700">{c.value}</span>
                <span className="w-8 text-right text-[10px] font-bold text-slate-400">{c.weight}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Risk Alerts ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {MOCK.risk.alerts.map((a, i) => (
          <div key={i} className={`rounded-2xl border p-4 flex items-start gap-3 ${
            a.type === 'warning' ? 'bg-amber-50 border-amber-200' :
            a.type === 'info'    ? 'bg-blue-50 border-blue-200' :
                                   'bg-emerald-50 border-emerald-200'
          }`}>
            {a.type === 'warning' ? <AlertTriangle size={16} className="text-amber-500 shrink-0 mt-0.5" /> :
             a.type === 'info'    ? <Activity size={16} className="text-blue-500 shrink-0 mt-0.5" /> :
                                    <CheckCircle2 size={16} className="text-emerald-500 shrink-0 mt-0.5" />}
            <div>
              <p className={`text-xs font-black ${
                a.type === 'warning' ? 'text-amber-700' :
                a.type === 'info'    ? 'text-blue-700' : 'text-emerald-700'
              }`}>{a.label}</p>
              <p className="text-[10px] text-slate-500 mt-0.5 font-medium">{a.sub}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── Academic Performance ── */}
      <SectionCard icon={<BookOpen size={17} className="text-indigo-500" />}
        title="Academic Performance" sub="GPA & điểm số theo thời gian">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
          {[
            { label: 'GPA hiện tại', value: MOCK.academic.currentGPA.toFixed(1), sub: `↑ từ ${MOCK.academic.previousGPA}`, color: 'text-indigo-600' },
            { label: 'GPA kỳ trước', value: MOCK.academic.previousGPA.toFixed(1), sub: 'Baseline', color: 'text-slate-500' },
            { label: 'Tỉ lệ pass', value: `${MOCK.academic.passRate}%`, sub: `Fail ${100 - MOCK.academic.passRate}%`, color: 'text-emerald-600' },
            { label: 'Tăng trưởng', value: `+${(MOCK.academic.currentGPA - MOCK.academic.previousGPA).toFixed(1)}`, sub: 'so kỳ trước', color: 'text-emerald-600' },
          ].map(s => (
            <div key={s.label} className="rounded-xl border border-slate-100 bg-slate-50/50 p-4 text-center">
              <div className={`text-2xl font-black ${s.color}`}>{s.value}</div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mt-0.5">{s.label}</div>
              <div className="text-[10px] text-slate-400 mt-0.5">{s.sub}</div>
            </div>
          ))}
        </div>
        <TrendLineChart
          data={MOCK.academic.gpaWeekly}
          domain={[5, 10]}
          ticks={[5, 6, 7, 8, 9, 10]}
          refY={5}
          avgY={MOCK.academic.currentGPA}
          color="#6366f1"
          label="GPA"
          height={200}
        />
      </SectionCard>

      {/* ── Assignment Behavior ── */}
      <SectionCard icon={<ClipboardCheck size={17} className="text-violet-500" />}
        title="Assignment Behavior" sub="Tình trạng nộp bài chi tiết">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
          {[
            { label: 'Tổng bài',   value: MOCK.assignment.total,        color: 'text-slate-700' },
            { label: 'Đã nộp',     value: MOCK.assignment.submitted,    color: 'text-indigo-600' },
            { label: 'Đúng hạn',   value: MOCK.assignment.onTime,       color: 'text-emerald-600' },
            { label: 'Không nộp',  value: MOCK.assignment.missed,       color: 'text-rose-500' },
          ].map(s => (
            <div key={s.label} className="rounded-xl border border-slate-100 bg-slate-50/50 p-4 text-center">
              <div className={`text-2xl font-black ${s.color}`}>{s.value}</div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mt-0.5">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Rate bars */}
        <div className="space-y-3 mb-5">
          {[
            { label: 'Tỉ lệ nộp bài',     value: MOCK.assignment.submitRate,  color: 'bg-indigo-500' },
            { label: 'Nộp đúng hạn',       value: MOCK.assignment.onTimeRate,  color: 'bg-emerald-500' },
            { label: 'Nộp trễ',            value: MOCK.assignment.lateRate,    color: 'bg-amber-400' },
            { label: 'Không nộp',          value: MOCK.assignment.missRate,    color: 'bg-rose-400' },
          ].map(r => (
            <div key={r.label} className="flex items-center gap-3">
              <span className="w-32 text-xs font-bold text-slate-600 shrink-0">{r.label}</span>
              <div className="flex-1 h-2 rounded-full bg-slate-100">
                <div className={`h-full rounded-full ${r.color}`} style={{ width: `${r.value}%` }} />
              </div>
              <span className="w-10 text-right text-xs font-black text-slate-700">{r.value}%</span>
            </div>
          ))}
        </div>

        <div className="flex items-center gap-6 text-xs font-bold text-slate-500">
          <span className="flex items-center gap-1.5"><Clock size={13} className="text-slate-400" />Trung bình nộp: <span className="text-slate-700">{MOCK.assignment.avgSubmitTime}</span></span>
          <span className="flex items-center gap-1.5"><BarChart2 size={13} className="text-slate-400" />Resubmit: <span className="text-slate-700">{MOCK.assignment.resubmitCount} lần</span></span>
        </div>
      </SectionCard>

      {/* ── Attendance + Engagement (2 col) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Attendance */}
        <SectionCard icon={<Calendar size={17} className="text-emerald-500" />}
          title="Attendance" sub="Chuyên cần & đi học">
          <div className="grid grid-cols-2 gap-3 mb-4">
            {[
              { label: 'Tỉ lệ đi học', value: `${MOCK.attendance.rate}%`, color: MOCK.attendance.rate >= 80 ? 'text-emerald-600' : 'text-rose-500' },
              { label: 'Buổi nghỉ',    value: MOCK.attendance.absent,      color: 'text-rose-500' },
              { label: 'Đi trễ',       value: MOCK.attendance.lateIn,     color: 'text-amber-500' },
              { label: 'Nghỉ liên tiếp', value: MOCK.attendance.consecutiveAbsent, color: 'text-slate-700' },
            ].map(s => (
              <div key={s.label} className="rounded-xl border border-slate-100 bg-slate-50/50 p-3 text-center">
                <div className={`text-xl font-black ${s.color}`}>{s.value}</div>
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mt-0.5">{s.label}</div>
              </div>
            ))}
          </div>
          <TrendLineChart data={MOCK.attendance.weekly} domain={[0, 100]} ticks={[0, 50, 80, 100]}
            refY={80} color="#10b981" label="%" height={140} />
        </SectionCard>

        {/* Engagement */}
        <SectionCard icon={<Zap size={17} className="text-amber-500" />}
          title="Learning Engagement" sub="Mức độ tham gia học tập">
          <div className="grid grid-cols-2 gap-3 mb-4">
            {[
              { label: 'Lần đăng nhập',  value: MOCK.engagement.loginCount,      color: 'text-indigo-600' },
              { label: 'Giờ học',        value: `${MOCK.engagement.studyHours}h`, color: 'text-violet-600' },
              { label: 'Video đã xem',   value: `${MOCK.engagement.videoWatchPct}%`, color: 'text-amber-600' },
              { label: 'Bài tập TH',     value: MOCK.engagement.exercisesDone,   color: 'text-emerald-600' },
            ].map(s => (
              <div key={s.label} className="rounded-xl border border-slate-100 bg-slate-50/50 p-3 text-center">
                <div className={`text-xl font-black ${s.color}`}>{s.value}</div>
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mt-0.5">{s.label}</div>
              </div>
            ))}
          </div>
          <TrendAreaChart data={MOCK.engagement.weekly} color="#f59e0b" label="%" height={140} />
        </SectionCard>
      </div>

      {/* ── Improvement Trend ── */}
      <SectionCard icon={<TrendingUp size={17} className="text-emerald-500" />}
        title="Improvement Trend" sub="Xu hướng tiến bộ quan trọng nhất">
        <div className="grid grid-cols-3 gap-4 mb-5">
          <div className="rounded-xl bg-emerald-50 border border-emerald-100 p-4 text-center">
            <div className="text-3xl font-black text-emerald-600">+{MOCK.improvement.monthlyDelta}%</div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 mt-1">Cải thiện tháng này</div>
          </div>
          <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-4 text-center">
            <div className="text-3xl font-black text-indigo-600">{MOCK.discipline.learningStreak}</div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mt-1">Ngày học liên tiếp</div>
          </div>
          <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-4 text-center">
            <div className={`text-3xl font-black ${MOCK.overall.status === 'Improving' ? 'text-emerald-600' : 'text-amber-500'}`}>
              {STATUS_MAP[status].label}
            </div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mt-1">Trạng thái</div>
          </div>
        </div>
        <DeltaBarChart data={MOCK.improvement.trend} />
      </SectionCard>

      {/* ── Discipline & Risk ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Discipline */}
        <SectionCard icon={<Target size={17} className="text-rose-500" />}
          title="Discipline & Consistency" sub="Tính đều đặn và kỷ luật">
          <div className="space-y-4">
            {[
              { label: 'Consistency Score',  value: MOCK.discipline.consistencyScore, desc: 'Độ ổn định học tập' },
              { label: 'Deadline Discipline', value: MOCK.discipline.deadlineDiscipline, desc: 'Kỷ luật thời hạn' },
              { label: 'Weekly Completion',  value: MOCK.discipline.weeklyCompletion, desc: 'Hoàn thành mục tiêu tuần' },
            ].map(d => (
              <div key={d.label}>
                <div className="flex justify-between mb-1">
                  <span className="text-xs font-bold text-slate-600">{d.label}</span>
                  <span className={`text-xs font-black ${d.value >= 70 ? 'text-emerald-600' : d.value >= 50 ? 'text-amber-600' : 'text-rose-500'}`}>
                    {d.value}/100
                  </span>
                </div>
                <div className="h-2 rounded-full bg-slate-100">
                  <div
                    className={`h-full rounded-full transition-all duration-700 ${d.value >= 70 ? 'bg-emerald-500' : d.value >= 50 ? 'bg-amber-400' : 'bg-rose-400'}`}
                    style={{ width: `${d.value}%` }}
                  />
                </div>
                <p className="text-[10px] text-slate-400 mt-0.5">{d.desc}</p>
              </div>
            ))}
          </div>
        </SectionCard>

        {/* Risk */}
        <SectionCard icon={<ShieldAlert size={17} className="text-rose-500" />}
          title="Risk Indicators" sub="Chỉ số cảnh báo sớm">
          <div className="space-y-4">
            {[
              { label: 'Dropout Risk',  value: MOCK.risk.dropoutRisk,  color: MOCK.risk.dropoutRisk >= 50 ? 'bg-rose-500' : MOCK.risk.dropoutRisk >= 25 ? 'bg-amber-400' : 'bg-emerald-500', textColor: MOCK.risk.dropoutRisk >= 50 ? 'text-rose-600' : 'text-amber-600' },
              { label: 'Burnout Risk',  value: MOCK.risk.burnoutRisk,  color: MOCK.risk.burnoutRisk >= 50 ? 'bg-rose-500' : MOCK.risk.burnoutRisk >= 25 ? 'bg-amber-400' : 'bg-emerald-500',  textColor: MOCK.risk.burnoutRisk >= 50 ? 'text-rose-600' : 'text-emerald-600' },
            ].map(r => (
              <div key={r.label}>
                <div className="flex justify-between mb-1">
                  <span className="text-xs font-bold text-slate-600">{r.label}</span>
                  <span className={`text-xs font-black ${r.textColor}`}>{r.value}%</span>
                </div>
                <div className="h-2 rounded-full bg-slate-100">
                  <div className={`h-full rounded-full ${r.color}`} style={{ width: `${r.value}%` }} />
                </div>
              </div>
            ))}
            <div className="mt-4 rounded-xl border border-slate-100 bg-slate-50 p-4">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Risk Level</p>
              <div className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-black border ${
                MOCK.risk.level === 'high'   ? 'bg-rose-50 text-rose-600 border-rose-200' :
                MOCK.risk.level === 'medium' ? 'bg-amber-50 text-amber-600 border-amber-200' :
                                              'bg-emerald-50 text-emerald-600 border-emerald-200'
              }`}>
                <ShieldAlert size={12} />
                {MOCK.risk.level === 'high' ? 'Nguy cơ cao' : MOCK.risk.level === 'medium' ? 'Nguy cơ trung bình' : 'An toàn'}
              </div>
              <p className="text-[10px] text-slate-400 mt-2">
                Không active: <span className="font-bold text-slate-600">{MOCK.risk.inactiveDays} ngày</span>
              </p>
            </div>
          </div>
        </SectionCard>
      </div>

      {/* ── Radar / Overall spider ── */}
      <SectionCard icon={<Flame size={17} className="text-orange-500" />}
        title="Performance Radar" sub="Tổng quan 5 chiều năng lực">
        <RadarChartWidget />
      </SectionCard>

    </div>
  );
}

// ─── Reusable section card ────────────────────────────────────────────────────
function SectionCard({
  icon, title, sub, children,
}: {
  icon: React.ReactNode;
  title: string;
  sub: string;
  children: React.ReactNode;
}) {
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-100 px-6 py-4 flex items-center gap-3">
        {icon}
        <div>
          <h2 className="text-sm font-black text-slate-900">{title}</h2>
          <p className="text-xs font-medium text-slate-400 mt-0.5">{sub}</p>
        </div>
      </div>
      <div className="p-6">{children}</div>
    </div>
  );
}

// ─── Trend line chart ─────────────────────────────────────────────────────────
function TrendLineChart({
  data, domain, ticks, refY, avgY, color, label, height,
}: {
  data: { label: string; v: number }[];
  domain: [number, number];
  ticks: number[];
  refY: number;
  avgY?: number;
  color: string;
  label: string;
  height: number;
}) {
  const {
    ResponsiveContainer, LineChart, Line, XAxis, YAxis,
    CartesianGrid, Tooltip, ReferenceLine,
    // eslint-disable-next-line @typescript-eslint/no-require-imports
  } = require('recharts') as typeof import('recharts');

  const mapped = data.map(d => ({ name: d.label, value: d.v }));

  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={mapped} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
        <XAxis dataKey="name" tick={{ fontSize: 9, fill: '#94a3b8', fontWeight: 700 }} axisLine={false} tickLine={false} />
        <YAxis domain={domain} ticks={ticks} tick={{ fontSize: 9, fill: '#94a3b8', fontWeight: 700 }} axisLine={false} tickLine={false} />
        <Tooltip contentStyle={{ borderRadius: 10, border: '1px solid #e2e8f0', fontSize: 11, fontWeight: 700 }}
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          formatter={(v: any) => [typeof v === 'number' ? v.toFixed(1) : v, label]} />
        <ReferenceLine y={refY} stroke="#f43f5e" strokeDasharray="3 3" strokeWidth={1} />
        {avgY != null && (
          <ReferenceLine y={avgY} stroke={color} strokeDasharray="4 4" strokeOpacity={0.5}
            label={{ value: `avg ${avgY.toFixed(1)}`, fill: color, fontSize: 9, fontWeight: 700 }} />
        )}
        <Line type="monotone" dataKey="value" stroke={color} strokeWidth={2.5}
          dot={{ r: 3, fill: color, strokeWidth: 0 }} activeDot={{ r: 5 }} />
      </LineChart>
    </ResponsiveContainer>
  );
}

// ─── Area chart ───────────────────────────────────────────────────────────────
function TrendAreaChart({
  data, color, label, height,
}: {
  data: { label: string; v: number }[];
  color: string;
  label: string;
  height: number;
}) {
  const {
    ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
    // eslint-disable-next-line @typescript-eslint/no-require-imports
  } = require('recharts') as typeof import('recharts');

  const mapped = data.map(d => ({ name: d.label, value: d.v }));

  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={mapped} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
        <defs>
          <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%"  stopColor={color} stopOpacity={0.2} />
            <stop offset="95%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
        <XAxis dataKey="name" tick={{ fontSize: 9, fill: '#94a3b8', fontWeight: 700 }} axisLine={false} tickLine={false} />
        <YAxis domain={[0, 100]} tick={{ fontSize: 9, fill: '#94a3b8', fontWeight: 700 }} axisLine={false} tickLine={false} />
        <Tooltip contentStyle={{ borderRadius: 10, border: '1px solid #e2e8f0', fontSize: 11, fontWeight: 700 }}
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          formatter={(v: any) => [typeof v === 'number' ? v.toFixed(0) : v, label]} />
        <Area type="monotone" dataKey="value" stroke={color} strokeWidth={2.5}
          fill="url(#areaGrad)" dot={{ r: 3, fill: color, strokeWidth: 0 }} activeDot={{ r: 5 }} />
      </AreaChart>
    </ResponsiveContainer>
  );
}

// ─── Delta bar chart (positive/negative) ────────────────────────────────────
function DeltaBarChart({ data }: { data: { label: string; v: number }[] }) {
  const {
    ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell, ReferenceLine,
    // eslint-disable-next-line @typescript-eslint/no-require-imports
  } = require('recharts') as typeof import('recharts');

  const mapped = data.map(d => ({ name: d.label, value: d.v }));

  return (
    <ResponsiveContainer width="100%" height={160}>
      <BarChart data={mapped} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
        <XAxis dataKey="name" tick={{ fontSize: 9, fill: '#94a3b8', fontWeight: 700 }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fontSize: 9, fill: '#94a3b8', fontWeight: 700 }} axisLine={false} tickLine={false} />
        <Tooltip contentStyle={{ borderRadius: 10, border: '1px solid #e2e8f0', fontSize: 11, fontWeight: 700 }}
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          formatter={(v: any) => [typeof v === 'number' ? (v > 0 ? `+${v.toFixed(1)}` : v.toFixed(1)) : v, 'Δ GPA']} />
        <ReferenceLine y={0} stroke="#cbd5e1" />
        <Bar dataKey="value" radius={[4, 4, 0, 0]}>
          {mapped.map((entry, i) => (
            <Cell key={i} fill={entry.value >= 0 ? '#10b981' : '#f43f5e'} fillOpacity={0.85} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

// ─── Radar chart ─────────────────────────────────────────────────────────────
function RadarChartWidget() {
  const {
    ResponsiveContainer, RadarChart, Radar, PolarGrid,
    PolarAngleAxis, PolarRadiusAxis, Tooltip,
    // eslint-disable-next-line @typescript-eslint/no-require-imports
  } = require('recharts') as typeof import('recharts');

  const data = [
    { subject: 'Academic',   A: MOCK.composite.academic },
    { subject: 'Assignment', A: MOCK.composite.assignment },
    { subject: 'Attendance', A: MOCK.composite.attendance },
    { subject: 'Engagement', A: MOCK.composite.engagement },
    { subject: 'Discipline', A: MOCK.composite.discipline },
  ];

  return (
    <ResponsiveContainer width="100%" height={260}>
      <RadarChart data={data} margin={{ top: 10, right: 30, left: 30, bottom: 10 }}>
        <PolarGrid stroke="#e2e8f0" />
        <PolarAngleAxis dataKey="subject" tick={{ fontSize: 11, fill: '#64748b', fontWeight: 700 }} />
        <PolarRadiusAxis domain={[0, 100]} tick={{ fontSize: 9, fill: '#94a3b8' }} axisLine={false} />
        <Tooltip contentStyle={{ borderRadius: 10, border: '1px solid #e2e8f0', fontSize: 11, fontWeight: 700 }} />
        <Radar name="Score" dataKey="A" stroke="#6366f1" fill="#6366f1" fillOpacity={0.15} strokeWidth={2} />
      </RadarChart>
    </ResponsiveContainer>
  );
}

import React from 'react';
