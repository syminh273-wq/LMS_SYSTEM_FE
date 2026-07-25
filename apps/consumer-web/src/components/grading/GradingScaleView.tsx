'use client';

import * as React from 'react';
import {
  Trophy,
  Sparkles,
  Layers,
  CheckCircle2,
  Target,
  Award,
  TrendingUp,
  Crown,
  BookOpen,
  Lightbulb,
  GraduationCap,
  CheckCheck,
} from 'lucide-react';
import {
  QUIZ_RULES,
  EXAM_RULES,
  XP_RULES,
  LEVEL_RULES,
  LEADERBOARD_RULES,
} from '@/lib/data/grading-rules';
import { useTranslation } from '@shared/components/LocaleProvider';

interface FactProps {
  icon: React.ElementType;
  iconClassName?: string;
  label: string;
  value: React.ReactNode;
}

function Fact({ icon: Icon, iconClassName, label, value }: FactProps) {
  return (
    <div className="flex items-start gap-3 rounded-xl border border-slate-200 bg-white p-3.5 dark:border-slate-700 dark:bg-slate-900">
      <span
        className={`shrink-0 w-9 h-9 rounded-lg flex items-center justify-center ${
          iconClassName ?? 'bg-indigo-500/10 text-indigo-600'
        }`}
      >
        <Icon size={17} />
      </span>
      <div className="flex-1 min-w-0">
        <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">
          {label}
        </p>
        <div className="text-sm font-bold text-slate-900 dark:text-white mt-0.5 break-words leading-relaxed">
          {value}
        </div>
      </div>
    </div>
  );
}

interface ExampleBoxProps {
  label: string;
  children: React.ReactNode;
}

function ExampleBox({ label, children }: ExampleBoxProps) {
  return (
    <div className="rounded-xl border border-dashed border-indigo-200 bg-indigo-50/50 p-3.5 dark:border-indigo-500/30 dark:bg-indigo-500/10">
      <p className="text-[10px] font-black uppercase tracking-wider text-indigo-500 mb-1.5">
        {label}
      </p>
      <div className="text-sm text-slate-700 dark:text-slate-200 leading-relaxed">
        {children}
      </div>
    </div>
  );
}

interface SectionCardProps {
  title: string;
  subtitle?: string;
  icon: React.ElementType;
  iconClassName?: string;
  children: React.ReactNode;
}

function SectionCard({ title, subtitle, icon: Icon, iconClassName, children }: SectionCardProps) {
  return (
    <section className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4 dark:bg-slate-900 dark:border-slate-800">
      <div className="flex items-start gap-3">
        <span
          className={`shrink-0 w-10 h-10 rounded-xl flex items-center justify-center ${
            iconClassName ?? 'bg-indigo-500/10 text-indigo-600'
          }`}
        >
          <Icon size={18} />
        </span>
        <div className="flex-1 min-w-0">
          <h2 className="text-base font-black text-slate-900 dark:text-white tracking-tight">
            {title}
          </h2>
          {subtitle && (
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-1 leading-relaxed">
              {subtitle}
            </p>
          )}
        </div>
      </div>
      {children}
    </section>
  );
}

export interface GradingScaleViewProps {
  showLeaderboard?: boolean;
}

export default function GradingScaleView({ showLeaderboard = false }: GradingScaleViewProps) {
  const { t } = useTranslation();
  const g = (key: string, fallback: string, values?: Record<string, string | number>) =>
    t(`grading.${key}`, fallback, values);

  return (
    <div className="space-y-4">
      <SectionCard
        title={g('quiz.card_title', 'Điểm Quiz (bài trắc nghiệm)')}
        subtitle={g('quiz.card_subtitle', 'Mỗi câu có 4 đáp án, bạn chọn 1 đáp án đúng nhất')}
        icon={BookOpen}
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          <Fact
            icon={Target}
            label={g('quiz.max_grade_label', 'Điểm tối đa')}
            value={g('quiz.max_grade_value', '{{value}} điểm. Giáo viên có thể chỉnh từ 1 đến 10.', { value: QUIZ_RULES.defaultMaxGrade })}
          />
          <Fact
            icon={CheckCircle2}
            iconClassName="bg-emerald-500/10 text-emerald-600"
            label={g('quiz.passing_label', 'Bao nhiêu điểm thì đạt?')}
            value={g('quiz.passing_value', '≥ {{pct}}% là ĐẠT. Giáo viên có thể chỉnh mức này.', { pct: QUIZ_RULES.defaultPassingScorePct })}
          />
          <Fact
            icon={Sparkles}
            iconClassName="bg-amber-500/10 text-amber-600"
            label={g('quiz.perfect_label', 'Thưởng điểm tuyệt đối')}
            value={g('quiz.perfect_value', 'Làm đúng 100% sẽ được thưởng thêm +20 XP 🎉')}
          />
          <Fact
            icon={Layers}
            iconClassName="bg-sky-500/10 text-sky-600"
            label={g('quiz.formula_label', 'Cách tính')}
            value={
              <code className="text-[12px] font-mono font-bold text-sky-700 dark:text-sky-300 break-all">
                {g('quiz.formula_value', 'Điểm = (số câu đúng ÷ tổng số câu) × điểm tối đa')}
              </code>
            }
          />
        </div>
        <ExampleBox label={g('quiz.example_label', 'Ví dụ')}>
          {g('quiz.example_text', 'Quiz 10 câu, điểm tối đa 10. Bạn đúng 8 câu → 8/10 × 10 = 8.0 điểm.')}
        </ExampleBox>
      </SectionCard>

      <SectionCard
        title={g('exam.card_title', 'Điểm Exam (bài kiểm tra)')}
        subtitle={g('exam.card_subtitle', 'Bài kiểm tra có thể là trắc nghiệm, nộp file, viết luận hoặc thi online có giám sát')}
        icon={GraduationCap}
        iconClassName="bg-amber-500/10 text-amber-600"
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          <Fact
            icon={Target}
            label={g('exam.max_grade_label', 'Điểm tối đa')}
            value={g('exam.max_grade_value', '{{value}} điểm. Giáo viên có thể chỉnh từ 1 đến {{max}}.', {
              value: EXAM_RULES.defaultMaxGrade,
              max: EXAM_RULES.maxGradeRange.max,
            })}
          />
          <Fact
            icon={CheckCircle2}
            iconClassName="bg-emerald-500/10 text-emerald-600"
            label={g('exam.passing_label', 'Bao nhiêu điểm thì đạt?')}
            value={g('exam.passing_value', '≥ {{pct}}% là ĐẠT (áp dụng cho trắc nghiệm & thi online).', { pct: EXAM_RULES.defaultPassingScorePct })}
          />
          <Fact
            icon={Layers}
            iconClassName="bg-sky-500/10 text-sky-600"
            label={g('exam.formula_label', 'Cách tính (trắc nghiệm/online)')}
            value={
              <code className="text-[12px] font-mono font-bold text-sky-700 dark:text-sky-300 break-all">
                {g('exam.formula_value', 'Điểm = (số câu đúng ÷ tổng số câu) × điểm tối đa')}
              </code>
            }
          />
          <Fact
            icon={CheckCheck}
            iconClassName="bg-violet-500/10 text-violet-600"
            label={g('exam.ai_label', 'Chấm bằng AI (file/luận văn)')}
            value={g('exam.ai_value', 'AI chấm theo 5 tiêu chí: Chính xác 30% + Đầy đủ 20% + Tư duy phản biện 20% + Thuật ngữ 15% + Hình thức 15% = 100%')}
          />
        </div>
        <ExampleBox label={g('exam.example_label', 'Ví dụ')}>
          {g('exam.example_text', 'Exam 20 câu trắc nghiệm, điểm tối đa 10. Bạn đúng 15 câu → 15/20 × 10 = 7.5 điểm.')}
        </ExampleBox>
      </SectionCard>

      <SectionCard
        title={g('xp.card_title', 'Bảng XP (điểm thưởng)')}
        subtitle={g('xp.card_subtitle', 'Mỗi hoạt động bạn làm sẽ được cộng XP. XP cộng dồn theo thời gian để tính cấp bậc và thứ hạng tổng.')}
        icon={Sparkles}
        iconClassName="bg-violet-500/10 text-violet-600"
      >
        <div className="overflow-hidden rounded-xl border border-slate-200 dark:border-slate-700">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 dark:bg-slate-800/50">
              <tr>
                <th className="text-left text-[10px] font-black uppercase tracking-wider text-slate-500 px-3 py-2.5">
                  {g('xp.table_action', 'Hoạt động')}
                </th>
                <th className="text-center text-[10px] font-black uppercase tracking-wider text-slate-500 px-3 py-2.5 w-20">
                  {g('xp.table_xp', 'XP')}
                </th>
                <th className="text-left text-[10px] font-black uppercase tracking-wider text-slate-500 px-3 py-2.5">
                  {g('xp.table_trigger', 'Khi nào nhận?')}
                </th>
                <th className="text-left text-[10px] font-black uppercase tracking-wider text-slate-500 px-3 py-2.5 hidden md:table-cell">
                  {g('xp.table_counter', 'Đếm thành tích')}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {XP_RULES.map((rule) => (
                <tr key={rule.code} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                  <td className="px-3 py-3">
                    <span className="text-sm font-bold text-slate-900 dark:text-white">
                      {g(`actions.${rule.code}`, rule.code)}
                    </span>
                  </td>
                  <td className="px-3 py-3 text-center">
                    <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20 text-xs font-black tabular-nums">
                      +{rule.xp}
                    </span>
                  </td>
                  <td className="px-3 py-3 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                    {rule.triggerHint}
                  </td>
                  <td className="px-3 py-3 text-[11px] text-slate-400 font-mono hidden md:table-cell">
                    {rule.counter ?? '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </SectionCard>

      <SectionCard
        title={g('level.card_title', 'Cấp bậc (Level)')}
        subtitle={g('level.card_subtitle', 'Level tăng dần theo XP. Level càng cao cần nhiều XP hơn.')}
        icon={TrendingUp}
        iconClassName="bg-emerald-500/10 text-emerald-600"
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          <Fact
            icon={Layers}
            iconClassName="bg-sky-500/10 text-sky-600"
            label={g('level.formula_label', 'Cách tính')}
            value={
              <code className="text-[12px] font-mono font-bold text-sky-700 dark:text-sky-300 break-all">
                {g('level.formula_value', 'XP cần để đạt level N = 100 × (N − 1)^1.5')}
              </code>
            }
          />
          <Fact
            icon={Crown}
            iconClassName="bg-amber-500/10 text-amber-600"
            label={g('level.max_level', 'Cấp cao nhất: {{max}}', { max: LEVEL_RULES.maxLevel })}
            value={g('level.example_label', 'Bảng XP cần để đạt')}
          />
        </div>

        <div>
          <p className="text-[10px] font-black uppercase tracking-wider text-slate-500 mb-2">
            {g('level.example_label', 'Bảng XP cần để đạt')}
          </p>
          <div className="overflow-hidden rounded-xl border border-slate-200 dark:border-slate-700">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 dark:bg-slate-800/50">
                <tr>
                  <th className="text-left text-[10px] font-black uppercase tracking-wider text-slate-500 px-3 py-2.5">
                    {g('level.table_level', 'Level')}
                  </th>
                  <th className="text-right text-[10px] font-black uppercase tracking-wider text-slate-500 px-3 py-2.5">
                    {g('level.table_required_xp', 'XP cần có')}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {LEVEL_RULES.examples.map((ex) => (
                  <tr key={ex.level} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                    <td className="px-3 py-2.5 text-sm font-bold text-slate-900 dark:text-white tabular-nums">
                      Lv {ex.level}
                    </td>
                    <td className="px-3 py-2.5 text-sm font-bold text-right text-emerald-600 dark:text-emerald-400 tabular-nums">
                      {ex.requiredXp.toLocaleString()} XP
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div>
          <p className="text-[10px] font-black uppercase tracking-wider text-slate-500 mb-2">
            {g('level_titles_label', 'Danh xưng theo cấp')}
          </p>
          <div className="flex flex-wrap gap-2">
            {LEVEL_RULES.titles.map((lt) => (
              <div
                key={lt.level}
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-800/50"
              >
                <Award size={12} className="text-amber-500" />
                <span className="text-[10px] font-black text-slate-500 tabular-nums">Lv {lt.level}</span>
                <span className="text-xs font-bold text-slate-900 dark:text-white">{lt.title}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="flex items-start gap-2.5 rounded-xl border border-amber-200 bg-amber-50 p-3.5 dark:border-amber-500/30 dark:bg-amber-500/10">
          <Lightbulb size={16} className="shrink-0 text-amber-600 mt-0.5" />
          <div className="text-xs text-slate-700 dark:text-slate-200 leading-relaxed">
            <span className="font-black text-amber-700 dark:text-amber-300">
              {g('level.tip_label', 'Mẹo nhỏ')}:{' '}
            </span>
            {g('level.tip_value', 'Tích cực nộp bài, làm quiz đúng và đạt chứng chỉ để lên cấp nhanh hơn.')}
          </div>
        </div>
      </SectionCard>

      {showLeaderboard && (
        <SectionCard
          title={g('leaderboard.card_title', 'Bảng xếp hạng trong lớp')}
          subtitle={g('leaderboard.card_subtitle', 'Đây là bảng xếp hạng nội bộ của từng lớp (không phải ranking tổng của cả hệ thống).')}
          icon={Trophy}
          iconClassName="bg-rose-500/10 text-rose-600"
        >
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            <Fact
              icon={Layers}
              iconClassName="bg-sky-500/10 text-sky-600"
              label={g('leaderboard.formula_label', 'Cách tính điểm lớp')}
              value={
                <code className="text-[11px] font-mono font-bold text-sky-700 dark:text-sky-300 break-all">
                  {g('leaderboard.formula_value', 'Điểm = điểm trung bình Quiz × 60% + điểm trung bình Exam × 40%')}
                </code>
              }
            />
            <Fact
              icon={BookOpen}
              label={g('leaderboard.quiz_weight_label', 'Trọng số Quiz')}
              value={<span className="tabular-nums">{LEADERBOARD_RULES.quizWeight} ({Math.round(LEADERBOARD_RULES.quizWeight * 100)}%)</span>}
            />
            <Fact
              icon={GraduationCap}
              label={g('leaderboard.exam_weight_label', 'Trọng số Exam')}
              value={<span className="tabular-nums">{LEADERBOARD_RULES.examWeight} ({Math.round(LEADERBOARD_RULES.examWeight * 100)}%)</span>}
            />
          </div>
          <ExampleBox label={g('leaderboard.example_label', 'Ví dụ')}>
            {g('leaderboard.example_text', 'Quiz trung bình 80%, Exam trung bình 60% → 80 × 0.6 + 60 × 0.4 = 72 điểm lớp.')}
          </ExampleBox>
        </SectionCard>
      )}
    </div>
  );
}
