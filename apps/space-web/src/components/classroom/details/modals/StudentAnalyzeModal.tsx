import { useState, useEffect } from 'react';
import { useTranslation } from '@shared/components/LocaleProvider';
import { spaceApi } from '@/lib/api';
import { toast } from 'sonner';
import { Loader2, X, BarChart2, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { Button } from '@shared/components/ui/button';
import type { ClassroomMember, StudentExamRecord } from '@/lib/api/types';
import GradeLineChart from './GradeLineChart';

export default function StudentAnalyzeModal({
  member,
  classroomUid,
  onClose,
}: {
  member: ClassroomMember;
  classroomUid: string;
  onClose: () => void;
}) {
  const { t } = useTranslation();
  const [records, setRecords] = useState<StudentExamRecord[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    spaceApi.classrooms.studentSubmissions(classroomUid, member.member_id)
      .then(setRecords)
      .catch(() => toast.error(t('classroom.ui.score_load_error')))
      .finally(() => setLoading(false));
  }, [classroomUid, member.member_id, t]);

  const graded = records.filter(r => r.submission?.grade != null);
  const chartData = graded.map((r, i) => ({
    name: r.exam.title.length > 14 ? r.exam.title.slice(0, 14) + '…' : r.exam.title,
    fullName: r.exam.title,
    grade: Number(r.submission!.grade!.toFixed(1)),
    index: i + 1,
  }));

  const trend = chartData.length >= 2
    ? chartData[chartData.length - 1].grade - chartData[0].grade
    : 0;
  const submissionRate = records.length > 0
    ? Math.round((records.filter(r => r.submission).length / records.length) * 100)
    : 0;
  const avgGrade = graded.length > 0
    ? (graded.reduce((s, r) => s + r.submission!.grade!, 0) / graded.length).toFixed(1)
    : '--';

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-card rounded-[32px] shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-8 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-4">
            {member.member_avatar ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={member.member_avatar} alt={member.member_name} className="w-12 h-12 rounded-2xl object-cover" />
            ) : (
              <div className="w-12 h-12 rounded-2xl bg-primary-brand-light flex items-center justify-center text-primary-brand font-black text-lg">
                {member.member_name.charAt(0).toUpperCase()}
              </div>
            )}
            <div>
              <h2 className="text-xl font-black text-foreground">{t('classroom.ui.analyze_title', undefined, { name: member.member_name })}</h2>
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mt-0.5">{t('classroom.ui.analyze_subtitle')}</p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} className="rounded-xl text-muted-foreground shrink-0">
            <X size={20} />
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto p-8 space-y-6">
          {loading ? (
            <div className="flex items-center justify-center h-40 text-muted-foreground">
              <Loader2 size={32} className="animate-spin" />
            </div>
          ) : (
            <>
              {/* KPI row */}
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-muted rounded-2xl p-5 text-center">
                  <div className="text-2xl font-black text-foreground">{submissionRate}%</div>
                  <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mt-1">{t('classroom.ui.analyze_submission_rate')}</div>
                </div>
                <div className="bg-muted rounded-2xl p-5 text-center">
                  <div className="text-2xl font-black text-emerald-600">{avgGrade}</div>
                  <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mt-1">{t('classroom.ui.analyze_avg_score')}</div>
                </div>
                <div className="bg-muted rounded-2xl p-5 text-center flex flex-col items-center gap-1">
                  {trend > 0
                    ? <TrendingUp size={22} className="text-emerald-500" />
                    : trend < 0
                    ? <TrendingDown size={22} className="text-rose-500" />
                    : <Minus size={22} className="text-muted-foreground" />}
                  <div className={`text-2xl font-black${trend > 0 ? 'text-emerald-600' : trend < 0 ? 'text-rose-600' : 'text-muted-foreground'}`}>
                    {trend > 0 ? `+${trend.toFixed(1)}` : trend.toFixed(1)}
                  </div>
                  <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">{t('classroom.ui.analyze_trend')}</div>
                </div>
              </div>

              {/* Chart */}
              {chartData.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-40 text-muted-foreground bg-muted rounded-2xl">
                  <BarChart2 size={36} className="mb-3 opacity-30" />
                  <p className="text-sm font-medium">{t('classroom.ui.analyze_no_grade')}</p>
                </div>
              ) : (
                <div className="bg-muted rounded-2xl p-6">
                  <p className="text-xs font-black text-muted-foreground uppercase tracking-widest mb-4">{t('classroom.ui.analyze_chart_title')}</p>
                  <GradeLineChart data={chartData} />
                </div>
              )}

              {/* Assessment */}
              <div className="rounded-2xl p-5 space-y-3">
                <p className="text-xs font-black text-muted-foreground uppercase tracking-widest">{t('classroom.ui.analyze_auto_assessment')}</p>
                <p className="text-sm font-medium text-foreground leading-relaxed">
                  {submissionRate === 0 && t('classroom.ui.analyze_no_submission_msg')}
                  {submissionRate > 0 && submissionRate < 50 && t('classroom.ui.analyze_low_submission_msg')}
                  {submissionRate >= 50 && submissionRate < 100 && trend >= 0 && t('classroom.ui.analyze_stable_msg')}
                  {submissionRate >= 50 && submissionRate < 100 && trend < 0 && t('classroom.ui.analyze_grade_declining_msg')}
                  {submissionRate === 100 && trend > 0 && t('classroom.ui.analyze_excellent_msg')}
                  {submissionRate === 100 && trend === 0 && t('classroom.ui.analyze_consistent_msg')}
                  {submissionRate === 100 && trend < 0 && t('classroom.ui.analyze_submitted_low_grade_msg')}
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
