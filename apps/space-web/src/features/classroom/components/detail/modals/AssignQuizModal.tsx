import { useState, useEffect } from 'react';
import { useTranslation } from '@shared/components/LocaleProvider';
import { quizApi } from '@/lib/api/quiz';
import { toast } from 'sonner';
import { Loader2, X, Clock, RotateCcw, Shuffle, HelpCircle, BookOpen, Check } from 'lucide-react';
import { Button } from '@shared/components/ui/button';
import { Input } from '@shared/components/ui/input';
import { Label } from '@shared/components/ui/label';
import type { Quiz } from '@/lib/api/types';

export default function AssignQuizModal({
  classroomUid,
  onClose,
  onAssigned,
  localAssigned,
}: {
  classroomUid: string;
  onClose: () => void;
  onAssigned: (quiz: Quiz) => void;
  localAssigned: Set<string>;
}) {
  const { t } = useTranslation();
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [loading, setLoading] = useState(false);
  const [pendingQuiz, setPendingQuiz] = useState<Quiz | null>(null);

  const [timeLimitMin, setTimeLimitMin] = useState(0);
  const [maxAttempts, setMaxAttempts] = useState(0);
  const [shuffleQuestions, setShuffleQuestions] = useState(false);
  const [shuffleOptions, setShuffleOptions] = useState(false);
  const [showExplanation, setShowExplanation] = useState(false);
  const [assigning, setAssigning] = useState(false);

  useEffect(() => {
    quizApi.list().then(data => {
      setQuizzes(data);
      setLoading(false);
    }).catch(() => {
      toast.error(t('quiz.assign_modal.load_error'));
      setLoading(false);
    });
  }, [t]);

  const handleConfirmAssign = async () => {
    if (!pendingQuiz) return;
    setAssigning(true);
    try {
      const assignment = await quizApi.assignToClassroom(pendingQuiz.uid, classroomUid, {
        time_limit_seconds: timeLimitMin > 0 ? timeLimitMin * 60 : 0,
        max_attempts: maxAttempts,
        shuffle_questions: shuffleQuestions,
        shuffle_options: shuffleOptions,
        show_explanation: showExplanation,
        passing_score_pct: 50,
      });
      onAssigned({ ...pendingQuiz, assigned_classrooms: [assignment] });
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : t('quiz.assign_modal.assign_error'));
    } finally {
      setAssigning(false);
    }
  };

  if (pendingQuiz) {
    return (
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div className="bg-card rounded-[32px] shadow-2xl w-full max-w-md animate-in fade-in zoom-in-95 duration-200">
          <div className="p-8 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-foreground">{t('quiz.assign_modal.settings_title')}</h2>
              <p className="text-sm text-muted-foreground font-medium mt-1 truncate max-w-[240px]">{pendingQuiz.title}</p>
            </div>
            <Button variant="ghost" size="icon" onClick={() => setPendingQuiz(null)} className="rounded-xl text-muted-foreground">
              <X size={20} />
            </Button>
          </div>

          <div className="p-8 space-y-8">
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2.5">
                <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2"><Clock size={14} /> {t('quiz.assign_modal.time_label')}</Label>
                <Input type="number" min={0} value={timeLimitMin} onChange={e => setTimeLimitMin(Number(e.target.value))}
                  className="w-full h-12 rounded-2xl bg-muted px-4 text-sm font-bold outline-none focus:ring-2 focus:ring-primary-brand-light transition-all" />
              </div>
              <div className="space-y-2.5">
                <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2"><RotateCcw size={14} /> {t('quiz.assign_modal.max_attempts_label')}</Label>
                <Input type="number" min={0} value={maxAttempts} onChange={e => setMaxAttempts(Number(e.target.value))}
                  className="w-full h-12 rounded-2xl bg-muted px-4 text-sm font-bold outline-none focus:ring-2 focus:ring-primary-brand-light transition-all" />
              </div>
            </div>

            <div className="space-y-4">
              {[
                { label: t('quiz.assign_modal.shuffle_questions'), icon: Shuffle, val: shuffleQuestions, set: setShuffleQuestions },
                { label: t('quiz.assign_modal.shuffle_options'), icon: Shuffle, val: shuffleOptions, set: setShuffleOptions },
                { label: t('quiz.assign_modal.show_explanation'), icon: HelpCircle, val: showExplanation, set: setShowExplanation },
              ].map(item => (
                <Label key={item.label} className="flex items-center justify-between p-4 rounded-2xl hover:bg-muted cursor-pointer group transition-all">
                  <div className="flex items-center gap-3 text-sm font-bold text-foreground">
                    <item.icon size={16} className="text-muted-foreground group-hover:text-primary-brand" /> {item.label}
                  </div>
                  <Input type="checkbox" checked={item.val} onChange={e => item.set(e.target.checked)}
                    className="w-5 h-5 rounded-lg text-primary-brand focus:ring-primary-brand transition-all" />
                </Label>
              ))}
            </div>
          </div>

          <div className="p-8 pt-0 flex gap-4">
            <Button variant="outline" onClick={() => setPendingQuiz(null)} className="flex-1 rounded-[20px] font-bold text-xs h-14 uppercase tracking-widest">
              {t('quiz.assign_modal.back')}
            </Button>
            <Button
              onClick={() => void handleConfirmAssign()}
              disabled={assigning}
              className="flex-1 bg-primary-brand hover:bg-primary-brand-dark text-white rounded-[20px] font-bold text-xs h-14 gap-3 shadow-lg shadow-primary-brand/20 uppercase tracking-widest transition-all"
            >
              {assigning ? <Loader2 size={18} className="animate-spin" /> : <Check size={18} />}
              {t('quiz.assign_modal.assign_to_class')}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-card rounded-[32px] shadow-2xl w-full max-w-lg animate-in fade-in slide-in-from-bottom-4 duration-200 max-h-[80vh] flex flex-col">
        <div className="p-8 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-foreground">{t('quiz.assign_modal.select_quiz_title')}</h2>
            <p className="text-sm text-muted-foreground font-medium mt-1">{t('quiz.assign_modal.select_quiz_hint')}</p>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} className="rounded-xl text-muted-foreground">
            <X size={20} />
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-3">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 text-muted-foreground/50">
              <Loader2 size={40} className="animate-spin text-primary-brand" />
            </div>
          ) : quizzes.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-muted-foreground/50">
              <BookOpen size={48} className="mb-4 opacity-40" />
              <p className="text-sm font-bold text-foreground uppercase tracking-widest">{t('quiz.assign_modal.library_empty')}</p>
              <p className="text-xs font-medium mt-1">{t('quiz.assign_modal.library_empty_hint')}</p>
            </div>
          ) : (
            quizzes.map(quiz => {
              const assigned = localAssigned.has(quiz.uid);
              return (
                <Button
                  key={quiz.uid}
                  type="button"
                  variant="ghost"
                  disabled={assigned}
                  onClick={() => { setPendingQuiz(quiz); setTimeLimitMin(0); setMaxAttempts(0); }}
                  className={`h-auto w-full text-left rounded-2xl p-5 transition-all flex items-center justify-start gap-5 ${
                    assigned
                      ? 'bg-emerald-50 cursor-default opacity-60'
                      : 'bg-card hover:bg-primary-brand-light/30 cursor-pointer group shadow-sm'
                  }`}
                >
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 transition-all ${assigned ? 'bg-emerald-100 text-emerald-600' : 'bg-muted text-muted-foreground group-hover:bg-primary-brand group-hover:text-white group-hover:shadow-lg'}`}>
                    {assigned ? <Check size={24} /> : <BookOpen size={24} />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-foreground group-hover:text-primary-brand transition-colors">{quiz.title}</div>
                    <div className="flex items-center gap-3 mt-1.5 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                      <span className="bg-muted px-2 py-0.5 rounded">{t('quiz.assign_modal.questions_count', undefined, { count: quiz.questions_count })}</span>
                    </div>
                  </div>
                  {assigned ? (
                    <span className="text-[10px] font-black text-emerald-600 uppercase bg-card px-3 py-1 rounded-full shrink-0 tracking-widest">{t('quiz.assign_modal.assigned_badge')}</span>
                  ) : (
                    <span className="text-[10px] font-black text-primary-brand uppercase bg-primary-brand-light px-3 py-1 rounded-full shrink-0 tracking-widest opacity-0 group-hover:opacity-100 transition-all">{t('quiz.assign_modal.select_badge')}</span>
                  )}
                </Button>
              );
            })
          )}
        </div>

        <div className="p-8">
          <Button onClick={onClose} variant="outline" className="w-full rounded-[20px] font-bold text-xs h-14 uppercase tracking-widest">
            {t('quiz.assign_modal.close_window')}
          </Button>
        </div>
      </div>
    </div>
  );
}
