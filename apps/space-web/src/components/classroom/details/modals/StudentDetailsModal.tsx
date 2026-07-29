import { useState, useEffect } from 'react';
import { useTranslation } from '@shared/components/LocaleProvider';
import { spaceApi } from '@/lib/api';
import { toast } from 'sonner';
import { Loader2, X, ClipboardCheck } from 'lucide-react';
import { Button } from '@shared/components/ui/button';
import type { ClassroomMember, StudentExamRecord } from '@/lib/api/types';
import { getSubmissionStatusClass, getSubmissionStatusLabel } from '../utils/exam';

export default function StudentDetailsModal({
  member,
  classroomUid,
  onClose,
}: {
  member: ClassroomMember;
  classroomUid: string;
  onClose: () => void;
}) {
  const { t, formatDateTime } = useTranslation();
  const [records, setRecords] = useState<StudentExamRecord[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    spaceApi.classrooms.studentSubmissions(classroomUid, member.member_id)
      .then(setRecords)
      .catch(() => toast.error(t('classroom.ui.score_load_error')))
      .finally(() => setLoading(false));
  }, [classroomUid, member.member_id, t]);

  const submitted = records.filter(r => r.submission).length;
  const graded = records.filter(r => r.submission?.grade != null).length;
  const avgGrade = graded > 0
    ? records.filter(r => r.submission?.grade != null).reduce((s, r) => s + (r.submission!.grade ?? 0), 0) / graded
    : null;

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-card rounded-[32px] shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-8 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-4">
            {member.member_avatar ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={member.member_avatar} alt={member.member_name} className="w-14 h-14 rounded-2xl object-cover" />
            ) : (
              <div className="w-14 h-14 rounded-2xl bg-primary-brand-light flex items-center justify-center text-primary-brand font-black text-xl">
                {member.member_name.charAt(0).toUpperCase()}
              </div>
            )}
            <div>
              <h2 className="text-xl font-black text-foreground">{member.member_name}</h2>
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mt-0.5">{t('classroom.ui.score_member_label', undefined, { time: formatDateTime(member.joined_at) })}</p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} className="rounded-xl text-muted-foreground shrink-0">
            <X size={20} />
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 px-8 py-5 shrink-0">
          {[
            { label: t('classroom.ui.score_total_exams'), value: records.length, color: 'text-foreground' },
            { label: t('classroom.ui.score_submitted'), value: submitted, color: 'text-primary-brand' },
            { label: t('classroom.ui.score_avg'), value: avgGrade != null ? avgGrade.toFixed(1) : '--', color: 'text-emerald-600' },
          ].map(s => (
            <div key={s.label} className="bg-muted rounded-2xl p-4 text-center">
              <div className={`text-2xl font-black${s.color}`}>{s.value}</div>
              <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mt-1">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Table */}
        <div className="flex-1 overflow-y-auto p-8">
          {loading ? (
            <div className="flex items-center justify-center h-40 text-muted-foreground">
              <Loader2 size={32} className="animate-spin" />
            </div>
          ) : records.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 text-muted-foreground">
              <ClipboardCheck size={36} className="mb-3 opacity-30" />
              <p className="text-sm font-medium">{t('classroom.ui.score_no_submission')}</p>
            </div>
          ) : (
            <table className="w-full text-left">
              <thead>
                <tr className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">
                  <th className="pb-3">{t('classroom.ui.score_grade_th_exam')}</th>
                  <th className="pb-3">{t('classroom.ui.score_grade_th_status')}</th>
                  <th className="pb-3">{t('classroom.ui.score_grade_th_submitted_at')}</th>
                  <th className="pb-3 text-right">{t('classroom.ui.score_grade_th_grade')}</th>
                </tr>
              </thead>
              <tbody>
                {records.map(r => (
                  <tr key={r.exam.uid} className="hover:bg-muted/50">
                    <td className="py-3 pr-4 text-sm font-bold text-foreground">{r.exam.title}</td>
                    <td className="py-3 pr-4">
                      {r.submission ? (
                        <span className={`text-[10px] font-black uppercase px-2 py-1 rounded-full${getSubmissionStatusClass(r.submission.status)}`}>
                          {getSubmissionStatusLabel(r.submission.status, t)}
                        </span>
                      ) : (
                        <span className="text-[10px] font-black uppercase px-2 py-1 rounded-full bg-muted text-muted-foreground">{t('classroom.ui.score_status_not_submitted')}</span>
                      )}
                    </td>
                    <td className="py-3 pr-4 text-xs font-bold text-muted-foreground">
                      {r.submission?.submitted_at ? formatDateTime(r.submission.submitted_at) : '--'}
                    </td>
                    <td className="py-3 text-right">
                      {r.submission?.grade != null ? (
                        <span className={`text-sm font-black${r.submission.grade >= 5 ? 'text-emerald-600' : 'text-rose-600'}`}>
                          {r.submission.grade.toFixed(1)}
                        </span>
                      ) : (
                        <span className="text-sm font-black text-muted-foreground/50">--</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
