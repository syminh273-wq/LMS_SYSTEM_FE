import { useState, useEffect } from 'react';
import { Loader2, X, CheckCircle2, Save, Trash2, Plus } from 'lucide-react';
import { Button } from '@shared/components/ui/button';
import { Checkbox } from '@shared/components/ui/checkbox';
import { Input } from '@shared/components/ui/input';
import { toast } from 'sonner';
import { quizApi } from '@/lib/api/quiz';
import { QUIZ_MIN_OPTIONS, QUIZ_MAX_OPTIONS, type QuizQuestion } from '@/lib/api/types';

interface Props {
  quizUid: string;
  question: QuizQuestion;
  onClose: () => void;
  onUpdated: (q: QuizQuestion) => void;
}

const letterFor = (index: number) => String.fromCharCode(65 + index);

function sameSet(a: number[], b: number[]) {
  if (a.length !== b.length) return false;
  const bSet = new Set(b);
  return a.every(v => bSet.has(v));
}

export default function EditQuestionModal({
  quizUid,
  question,
  onClose,
  onUpdated,
}: Props) {
  const isMulti = question.question_type === 'multi_answer';
  const isTf = question.question_type === 'true_false';
  const [options, setOptions] = useState<string[]>(question.options);
  const [correct, setCorrect] = useState<number[]>(question.correct_answers);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setOptions(question.options);
    setCorrect(question.correct_answers);
  }, [question]);

  const toggleCorrect = (index: number) => {
    if (!isMulti) {
      setCorrect([index]);
      return;
    }
    setCorrect(prev => (prev.includes(index) ? prev.filter(i => i !== index) : [...prev, index]));
  };

  const updateOptionText = (index: number, text: string) => {
    setOptions(prev => prev.map((o, i) => (i === index ? text : o)));
  };

  const addOption = () => {
    if (options.length >= QUIZ_MAX_OPTIONS) return;
    setOptions(prev => [...prev, '']);
  };

  const removeOption = (index: number) => {
    if (options.length <= QUIZ_MIN_OPTIONS) return;
    setOptions(prev => prev.filter((_, i) => i !== index));
    setCorrect(prev =>
      prev.filter(i => i !== index).map(i => (i > index ? i - 1 : i))
    );
  };

  const optionsValid = options.length >= QUIZ_MIN_OPTIONS && options.every(o => o.trim().length > 0);
  const canSave = optionsValid && correct.length >= 1;

  const isUnchanged =
    sameSet(correct, question.correct_answers) &&
    options.length === question.options.length &&
    options.every((o, i) => o === question.options[i]);

  const handleSave = async () => {
    if (!canSave) return;
    if (isUnchanged) {
      onClose();
      return;
    }
    setSaving(true);
    try {
      const updated = await quizApi.updateQuestion(quizUid, question.uid, {
        question_type: question.question_type,
        options,
        correct_answers: correct,
      });
      onUpdated(updated);
      toast.success('Đã cập nhật câu hỏi');
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
            Sửa câu hỏi
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
            <div className="flex items-center justify-between">
              <div className="text-[10px] font-black text-muted-foreground uppercase tracking-wider">
                {isMulti ? 'Đáp án (chọn 1 hoặc nhiều đáp án đúng)' : 'Đáp án (chọn 1 đáp án đúng)'}
              </div>
              {isMulti && (
                <span className="rounded-full bg-primary-brand/10 px-2 py-0.5 text-[10px] font-black uppercase text-primary-brand">
                  Nhiều đáp án
                </span>
              )}
            </div>

            {options.map((optionText, index) => {
              const isSelected = correct.includes(index);
              return (
                <div
                  key={index}
                  className={`flex items-center gap-2 rounded-xl px-3 py-2 border transition-all ${
                    isSelected
                      ? 'border-emerald-300 bg-emerald-50 ring-2 ring-emerald-200'
                      : 'border-border bg-muted/30'
                  }`}
                >
                  {isMulti ? (
                    <Checkbox checked={isSelected} onCheckedChange={() => toggleCorrect(index)} className="shrink-0" />
                  ) : (
                    <button
                      type="button"
                      onClick={() => toggleCorrect(index)}
                      className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black shrink-0 ${
                        isSelected ? 'bg-emerald-500 text-white' : 'bg-muted text-muted-foreground'
                      }`}
                    >
                      {letterFor(index)}
                    </button>
                  )}
                  <Input
                    value={optionText}
                    onChange={e => updateOptionText(index, e.target.value)}
                    placeholder={`Đáp án ${letterFor(index)}`}
                    className="flex-1 bg-transparent border-0 shadow-none focus-visible:ring-0 font-bold text-sm h-8 px-1"
                  />
                  {!isTf && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeOption(index)}
                      disabled={options.length <= QUIZ_MIN_OPTIONS}
                      className="h-8 w-8 rounded-lg text-muted-foreground hover:text-destructive shrink-0 disabled:opacity-30"
                    >
                      <Trash2 size={14} />
                    </Button>
                  )}
                </div>
              );
            })}

            {!isTf && (
              <Button
                type="button"
                variant="outline"
                onClick={addOption}
                disabled={options.length >= QUIZ_MAX_OPTIONS}
                className="w-full rounded-xl border-dashed text-xs font-bold gap-2 h-10 disabled:opacity-40"
              >
                <Plus size={14} />
                Thêm đáp án {options.length >= QUIZ_MAX_OPTIONS ? `(tối đa ${QUIZ_MAX_OPTIONS})` : ''}
              </Button>
            )}

            {!optionsValid && (
              <p className="text-xs font-bold text-destructive">
                Cần ít nhất {QUIZ_MIN_OPTIONS} đáp án và không để trống nội dung.
              </p>
            )}
            {optionsValid && correct.length === 0 && (
              <p className="text-xs font-bold text-destructive">Cần chọn ít nhất 1 đáp án đúng.</p>
            )}
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
            disabled={saving || !canSave}
            className="flex-1 bg-primary-brand hover:bg-primary-brand-dark text-white rounded-xl font-bold text-xs h-11 gap-2 disabled:opacity-60"
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
