import { useState } from 'react';
import { useTranslation } from '@shared/components/LocaleProvider';
import { quizApi } from '@/lib/api/quiz';
import { toast } from 'sonner';
import { Loader2, X, Clock, RotateCcw, Shuffle, HelpCircle, Check } from 'lucide-react';
import { Button } from '@shared/components/ui/button';
import { Input } from '@shared/components/ui/input';
import { Label } from '@shared/components/ui/label';
import type { Quiz } from '@/lib/api/types';

export default function EditSettingsModal({
  quiz,
  classroomId,
  onClose,
  onSaved,
}: {
  quiz: Quiz;
  classroomId: string;
  onClose: () => void;
  onSaved: (updated: Quiz) => void;
}) {
  const { t } = useTranslation();
  const existing = quiz.assigned_classrooms?.[0];
  const [timeLimitMin, setTimeLimitMin] = useState(
    existing?.time_limit_seconds ? Math.round(existing.time_limit_seconds / 60) : 0
  );
  const [maxAttempts, setMaxAttempts] = useState(existing?.max_attempts ?? 0);
  const [shuffleQuestions, setShuffleQuestions] = useState(existing?.shuffle_questions ?? false);
  const [shuffleOptions, setShuffleOptions] = useState(existing?.shuffle_options ?? false);
  const [showExplanation, setShowExplanation] = useState(existing?.show_explanation ?? true);
  const [passingScore, setPassingScore] = useState(existing?.passing_score_pct ?? 50);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      const assignment = await quizApi.updateAssignment(quiz.uid, classroomId, {
        time_limit_seconds: timeLimitMin > 0 ? timeLimitMin * 60 : 0,
        max_attempts: maxAttempts,
        shuffle_questions: shuffleQuestions,
        shuffle_options: shuffleOptions,
        show_explanation: showExplanation,
        passing_score_pct: passingScore,
      });
      onSaved({ ...quiz, assigned_classrooms: [assignment] });
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : t('quiz.settings_modal.save_error'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-card rounded-[32px] shadow-2xl w-full max-w-md animate-in fade-in zoom-in-95 duration-200">
        <div className="p-8 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-foreground">{t('quiz.settings_modal.title')}</h2>
            <p className="text-sm text-muted-foreground font-medium mt-1 truncate max-w-[240px]">{quiz.title}</p>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} className="rounded-xl text-muted-foreground">
            <X size={20} />
          </Button>
        </div>

        <div className="p-8 space-y-8">
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2.5">
              <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2"><Clock size={14} /> {t('quiz.settings_modal.time_label')}</Label>
              <Input type="number" min={0} value={timeLimitMin} onChange={e => setTimeLimitMin(Number(e.target.value))}
                className="w-full h-12 rounded-2xl bg-muted px-4 text-sm font-bold outline-none focus:ring-2 focus:ring-primary-brand-light transition-all" />
            </div>
            <div className="space-y-2.5">
              <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2"><RotateCcw size={14} /> {t('quiz.settings_modal.max_attempts_label')}</Label>
              <Input type="number" min={0} value={maxAttempts} onChange={e => setMaxAttempts(Number(e.target.value))}
                className="w-full h-12 rounded-2xl bg-muted px-4 text-sm font-bold outline-none focus:ring-2 focus:ring-primary-brand-light transition-all" />
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{t('quiz.settings_modal.passing_score_label', undefined, { score: passingScore })}</Label>
            </div>
            <Input type="range" min={0} max={100} step={5} value={passingScore} onChange={e => setPassingScore(Number(e.target.value))}
              className="w-full accent-primary-brand" />
          </div>

          <div className="space-y-4">
            {[
              { label: t('quiz.settings_modal.shuffle_questions'), icon: Shuffle, val: shuffleQuestions, set: setShuffleQuestions },
              { label: t('quiz.settings_modal.shuffle_options'), icon: Shuffle, val: shuffleOptions, set: setShuffleOptions },
              { label: t('quiz.settings_modal.show_explanation'), icon: HelpCircle, val: showExplanation, set: setShowExplanation },
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
          <Button variant="outline" onClick={onClose} className="flex-1 rounded-[20px] font-bold text-xs h-14 uppercase tracking-widest">
            {t('quiz.settings_modal.cancel')}
          </Button>
          <Button
            onClick={() => void handleSave()}
            disabled={saving}
            className="flex-1 bg-primary-brand hover:bg-primary-brand-dark text-white rounded-[20px] font-bold text-xs h-14 gap-3 shadow-lg shadow-primary-brand/20 uppercase tracking-widest transition-all"
          >
            {saving ? <Loader2 size={18} className="animate-spin" /> : <Check size={18} />}
            {t('quiz.settings_modal.save')}
          </Button>
        </div>
      </div>
    </div>
  );
}
