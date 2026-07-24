'use client';

import * as React from 'react';
import {
  Calculator,
  Trophy,
  GraduationCap,
  Sparkles,
  Layers,
  CheckCircle2,
  Target,
  Award,
  TrendingUp,
  Crown,
  BookOpen,
} from 'lucide-react';
import {
  QUIZ_RULES,
  EXAM_RULES,
  XP_RULES,
  LEVEL_RULES,
  LEADERBOARD_RULES,
} from '@/lib/data/grading-rules';
import { useTranslation } from '@shared/components/LocaleProvider';

interface InfoRowProps {
  icon: React.ElementType;
  label: string;
  value: React.ReactNode;
}

function InfoRow({ icon: Icon, label, value }: InfoRowProps) {
  return (
    <div className="flex items-start gap-3 p-3 rounded-xl border border-border bg-card">
      <span className="shrink-0 w-8 h-8 rounded-lg bg-primary-brand/10 text-primary-brand flex items-center justify-center">
        <Icon size={15} />
      </span>
      <div className="flex-1 min-w-0">
        <p className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">
          {label}
        </p>
        <div className="text-sm font-bold text-foreground mt-0.5 break-words">
          {value}
        </div>
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
    <section className="bg-card border border-border rounded-2xl p-5 space-y-4">
      <div className="flex items-center gap-2">
        <span className={`shrink-0 w-8 h-8 rounded-lg flex items-center justify-center ${iconClassName ?? 'bg-primary-brand/10 text-primary-brand'}`}>
          <Icon size={15} />
        </span>
        <div className="flex-1 min-w-0">
          <h2 className="text-base font-black text-foreground tracking-tight">
            {title}
          </h2>
          {subtitle && (
            <p className="text-xs text-muted-foreground font-medium mt-0.5">
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
        title={g('quiz.card_title', 'Điểm Quiz (trắc nghiệm)')}
        subtitle={g('quiz.card_subtitle', 'Mỗi câu hỏi trắc nghiệm 4 đáp án; điểm được tính theo tỉ lệ đúng × thang điểm')}
        icon={BookOpen}
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <InfoRow
            icon={Target}
            label={g('quiz.max_grade_label', 'Thang điểm tối đa')}
            value={g('quiz.max_grade_value', '{{value}} điểm (mặc định; giáo viên cấu hình 1-10)', { value: QUIZ_RULES.defaultMaxGrade })}
          />
          <InfoRow
            icon={CheckCircle2}
            label={g('quiz.passing_label', 'Điểm đạt (passing)')}
            value={g('quiz.passing_value', '≥ {{pct}}% (mặc định; cấu hình qua QuizAssignment.passing_score_pct)', { pct: QUIZ_RULES.defaultPassingScorePct })}
          />
          <InfoRow
            icon={Sparkles}
            label={g('quiz.perfect_label', 'Điểm hoàn hảo')}
            value={g('quiz.perfect_value', '100% — cộng thêm XP quiz_perfect')}
          />
          <InfoRow
            icon={Calculator}
            label={g('quiz.formula_label', 'Công thức')}
            value={
              <code className="text-[12px] font-mono font-bold text-primary-brand bg-primary-brand/5 px-2 py-1 rounded">
                {QUIZ_RULES.formula}
              </code>
            }
          />
        </div>
      </SectionCard>

      <SectionCard
        title={g('exam.card_title', 'Điểm Exam (bài kiểm tra)')}
        subtitle={g('exam.card_subtitle', 'Bài kiểm tra có thể là trắc nghiệm, file, essay hoặc online có giám sát')}
        icon={GraduationCap}
        iconClassName="bg-amber-500/10 text-amber-600"
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <InfoRow
            icon={Target}
            label={g('exam.max_grade_label', 'Thang điểm')}
            value={g('exam.max_grade_value', '{{value}} điểm (mặc định; giáo viên cấu hình {{min}}-{{max}})', {
              value: EXAM_RULES.defaultMaxGrade,
              min: EXAM_RULES.maxGradeRange.min,
              max: EXAM_RULES.maxGradeRange.max,
            })}
          />
          <InfoRow
            icon={CheckCircle2}
            label={g('exam.passing_label', 'Điểm đạt (trắc nghiệm)')}
            value={g('exam.passing_value', '≥ {{pct}}% (cố định cho MC/online)', { pct: EXAM_RULES.defaultPassingScorePct })}
          />
          <InfoRow
            icon={Calculator}
            label={g('exam.formula_label', 'Công thức MC / online')}
            value={
              <code className="text-[12px] font-mono font-bold text-primary-brand bg-primary-brand/5 px-2 py-1 rounded">
                {EXAM_RULES.mcFormula}
              </code>
            }
          />
          <InfoRow
            icon={Layers}
            label={g('exam.ai_label', 'Rubric chấm AI (file / essay)')}
            value={g('exam.ai_value', 'Độ chính xác 30% + Tính đầy đủ 20% + Tư duy phản biện 20% + Thuật ngữ 15% + Hình thức 15% = 100%')}
          />
        </div>
      </SectionCard>

      <SectionCard
        title={g('xp.card_title', 'Bảng XP (Ranking)')}
        subtitle={g('xp.card_subtitle', 'Mỗi hành động trong hệ thống sẽ cộng XP tương ứng. XP cộng dồn, dùng để tính cấp bậc và ranking tổng.')}
        icon={Sparkles}
        iconClassName="bg-violet-500/10 text-violet-600"
      >
        <div className="overflow-hidden rounded-xl border border-border">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="text-left text-[10px] font-black uppercase tracking-wider text-muted-foreground px-3 py-2">
                  {g('xp.table_action', 'Hành động')}
                </th>
                <th className="text-center text-[10px] font-black uppercase tracking-wider text-muted-foreground px-3 py-2 w-20">
                  {g('xp.table_xp', 'XP')}
                </th>
                <th className="text-left text-[10px] font-black uppercase tracking-wider text-muted-foreground px-3 py-2">
                  {g('xp.table_trigger', 'Điều kiện')}
                </th>
                <th className="text-left text-[10px] font-black uppercase tracking-wider text-muted-foreground px-3 py-2 hidden md:table-cell">
                  {g('xp.table_counter', 'Bộ đếm thành tích')}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {XP_RULES.map((rule) => (
                <tr key={rule.code} className="hover:bg-muted/30 transition-colors">
                  <td className="px-3 py-2.5">
                    <div className="flex items-center gap-2">
                      <span className="shrink-0 w-7 h-7 rounded-lg bg-violet-500/10 text-violet-600 flex items-center justify-center">
                        <Trophy size={13} />
                      </span>
                      <span className="text-sm font-bold text-foreground">
                        {g(`actions.${rule.code}`, rule.code)}
                      </span>
                    </div>
                  </td>
                  <td className="px-3 py-2.5 text-center">
                    <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 text-xs font-black tabular-nums">
                      +{rule.xp}
                    </span>
                  </td>
                  <td className="px-3 py-2.5 text-xs text-muted-foreground font-medium">
                    {rule.triggerHint}
                  </td>
                  <td className="px-3 py-2.5 text-[11px] text-muted-foreground font-mono hidden md:table-cell">
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
        subtitle={g('level.card_subtitle', 'Level tăng theo XP tích lũy. Level càng cao cần nhiều XP hơn (đường cong lũy thừa).')}
        icon={TrendingUp}
        iconClassName="bg-emerald-500/10 text-emerald-600"
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <InfoRow
            icon={Calculator}
            label={g('level.formula_label', 'Công thức')}
            value={
              <code className="text-[12px] font-mono font-bold text-primary-brand bg-primary-brand/5 px-2 py-1 rounded">
                {LEVEL_RULES.formula}
              </code>
            }
          />
          <InfoRow
            icon={Crown}
            label={g('level.max_level', 'Cấp tối đa: {{max}}', { max: LEVEL_RULES.maxLevel })}
            value={g('level.example_label', 'Ví dụ XP cần để đạt')}
          />
        </div>

        <div>
          <p className="text-[10px] font-black uppercase tracking-wider text-muted-foreground mb-2">
            {g('level.example_label', 'Ví dụ XP cần để đạt')}
          </p>
          <div className="overflow-hidden rounded-xl border border-border">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  <th className="text-left text-[10px] font-black uppercase tracking-wider text-muted-foreground px-3 py-2">
                    {g('level.table_level', 'Level')}
                  </th>
                  <th className="text-right text-[10px] font-black uppercase tracking-wider text-muted-foreground px-3 py-2">
                    {g('level.table_required_xp', 'XP yêu cầu')}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {LEVEL_RULES.examples.map((ex) => (
                  <tr key={ex.level} className="hover:bg-muted/30 transition-colors">
                    <td className="px-3 py-2 text-sm font-bold text-foreground tabular-nums">
                      Lv {ex.level}
                    </td>
                    <td className="px-3 py-2 text-sm font-bold text-right text-emerald-600 tabular-nums">
                      {ex.requiredXp.toLocaleString()} XP
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div>
          <p className="text-[10px] font-black uppercase tracking-wider text-muted-foreground mb-2">
            {g('level_titles_label', 'Danh xưng theo cấp')}
          </p>
          <div className="flex flex-wrap gap-2">
            {LEVEL_RULES.titles.map((lt) => (
              <div
                key={lt.level}
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-border bg-card"
              >
                <Award size={12} className="text-amber-500" />
                <span className="text-[10px] font-black text-muted-foreground tabular-nums">Lv {lt.level}</span>
                <span className="text-xs font-bold text-foreground">{lt.title}</span>
              </div>
            ))}
          </div>
        </div>
      </SectionCard>

      {showLeaderboard && (
        <SectionCard
          title={g('leaderboard.card_title', 'Trọng số Leaderboard lớp')}
          subtitle={g('leaderboard.card_subtitle', 'Áp dụng cho bảng xếp hạng nội bộ từng lớp học. Không áp dụng cho ranking tổng (XP).')}
          icon={Layers}
          iconClassName="bg-rose-500/10 text-rose-600"
        >
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <InfoRow
              icon={Calculator}
              label={g('leaderboard.formula_label', 'Công thức')}
              value={
                <code className="text-[11px] font-mono font-bold text-primary-brand bg-primary-brand/5 px-2 py-1 rounded break-all">
                  {g('leaderboard.formula_value', 'total_score = quiz_avg × {{quizWeight}} + exam_avg × {{examWeight}}', {
                    quizWeight: LEADERBOARD_RULES.quizWeight,
                    examWeight: LEADERBOARD_RULES.examWeight,
                  })}
                </code>
              }
            />
            <InfoRow
              icon={BookOpen}
              label={g('leaderboard.quiz_weight_label', 'Trọng số Quiz')}
              value={<span className="tabular-nums">{LEADERBOARD_RULES.quizWeight} ({Math.round(LEADERBOARD_RULES.quizWeight * 100)}%)</span>}
            />
            <InfoRow
              icon={GraduationCap}
              label={g('leaderboard.exam_weight_label', 'Trọng số Exam')}
              value={<span className="tabular-nums">{LEADERBOARD_RULES.examWeight} ({Math.round(LEADERBOARD_RULES.examWeight * 100)}%)</span>}
            />
          </div>
        </SectionCard>
      )}
    </div>
  );
}
