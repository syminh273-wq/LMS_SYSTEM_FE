import { useState, useEffect } from 'react';
import { Loader2, X, CheckCircle2, Save } from 'lucide-react';
import { Button } from '@shared/components/ui/button';
import { toast } from 'sonner';
import { quizApi } from '@/lib/api/quiz';
import type { QuizQuestion } from '@/lib/api/types';

const OPTION_KEYS = ['a', 'b', 'c', 'd'] as const;
type OptionKey = (typeof OPTION_KEYS)[number];

interface Props {
  quizUid: string;
  question: QuizQuestion;
  onClose: () => void;
  onUpdated: (q: QuizQuestion) => void;
}

export default function EditQuestionModal({
  quizUid,
  question,
  onClose,
  onUpdated,
}: Props) {
  const [correct, setCorrect] = useState<OptionKey>(question.correct_answer);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setCorrect(question.correct_answer);
  }, [question.correct_answer]);

  const handleSave = async () => {
    if (correct === question.correct_answer) {
      onClose();
      return;
    }
    setSaving(true);
    try {
      const updated = await quizApi.updateQuestion(quizUid, question.uid, {
        correct_answer: correct,
      });
      onUpdated(updated);
      toast.success('Đã cập nhật đáp án đúng');
      onClose();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Lưu thất bại');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-card rounded-3xl shadow-2xl w-full max-w-2xl animate-in fade-in zoom-in-95 duration-200 overflow-hidden">
        <div className="p-6 border-b border-border flex items-center justify-between">
          <h2 className="font-black text-foreground flex items-center gap-2">
            <CheckCircle2 size={20} className="text-primary-brand" />
            Sửa đáp án đúng
          </h2>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="rounded-xl text-muted-foreground"
          >
            <X size={20} />
          </Button>
        </div>

        <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
          <div className="text-sm font-bold text-foreground bg-muted/50 rounded-xl p-4 border border-border">
            {question.question_text}
          </div>

          <div className="space-y-2">
            <div className="text-[10px] font-black text-muted-foreground uppercase tracking-wider">
              Chọn đáp án đúng
            </div>
            {OPTION_KEYS.map((key) => {
              const isSelected = correct === key;
              const optionText =
                question[`option_${key}` as keyof QuizQuestion] as string;
              return (
                <Button
                  key={key}
                  type="button"
                  onClick={() => setCorrect(key)}
                  className={`w-full flex items-center gap-3 rounded-xl px-4 py-3 border text-sm font-bold text-left transition-all ${
                    isSelected
                      ? 'border-emerald-300 bg-emerald-50 text-emerald-800 ring-2 ring-emerald-200'
                      : 'border-border bg-muted/30 text-foreground hover:border-primary-brand-light hover:bg-muted/50'
                  }`}
                >
                  <span
                    className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black shrink-0 ${
                      isSelected
                        ? 'bg-emerald-500 text-white'
                        : 'bg-muted text-muted-foreground'
                    }`}
                  >
                    {key.toUpperCase()}
                  </span>
                  <span className="flex-1">{optionText}</span>
                  {isSelected && (
                    <CheckCircle2 size={16} className="text-emerald-500 shrink-0" />
                  )}
                </Button>
              );
            })}
          </div>
        </div>

        <div className="p-6 pt-0 flex gap-3">
          <Button
            variant="outline"
            onClick={onClose}
            className="flex-1 rounded-xl font-bold text-xs h-11"
          >
            HỦY
          </Button>
          <Button
            onClick={() => void handleSave()}
            disabled={saving}
            className="flex-1 bg-primary-brand hover:bg-primary-brand-dark text-white rounded-xl font-bold text-xs h-11 gap-2"
          >
            {saving ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <Save size={14} />
            )}
            LƯU
          </Button>
        </div>
      </div>
    </div>
  );
}
