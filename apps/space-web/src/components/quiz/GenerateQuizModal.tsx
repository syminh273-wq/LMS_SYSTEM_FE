import * as React from 'react';
import { useState, useRef } from 'react';
import { useDispatch } from 'react-redux';
import { useRouter } from 'next/navigation';
import { quizTasksApi } from '@/lib/api/quiz-tasks';
import { upsertTask, setPanelOpen } from '@/lib/redux/quizTasksSlice';
import { useTranslation } from '@shared/components/LocaleProvider';
import {
  FileText,
  UploadCloud, X, Wand2, Plus, Trash2,
} from 'lucide-react';
import { Button } from '@shared/components/ui/button';
import { Input } from '@shared/components/ui/input';
import { Label } from '@shared/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@shared/components/ui/radio-group';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@shared/components/ui/select';
import { toast } from 'sonner';
import { QUIZ_MIN_OPTIONS, QUIZ_MAX_OPTIONS, type QuizQuestionType } from '@/lib/api/types';

type SubmitPhase = 'idle' | 'submitting';
type OptionMode = 'uniform' | 'custom';
type CorrectGroup = { count: number; correct: number };

const OPTION_CHOICES = Array.from(
  { length: QUIZ_MAX_OPTIONS - QUIZ_MIN_OPTIONS + 1 },
  (_, i) => QUIZ_MIN_OPTIONS + i,
);

function flattenCorrectCounts(groups: CorrectGroup[]): number[] {
  return groups.flatMap(g => Array(Math.max(0, g.count)).fill(g.correct));
}

export default function GenerateQuizModal({ onClose }: { onClose: () => void }) {
  const dispatch = useDispatch();
  const router = useRouter();
  const { t } = useTranslation();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [numQuestions, setNumQuestions] = useState(10);
  const [numOptions, setNumOptions] = useState(4);
  const [optionMode, setOptionMode] = useState<OptionMode>('uniform');
  const [customOptions, setCustomOptions] = useState(4);
  const [correctGroups, setCorrectGroups] = useState<CorrectGroup[]>([{ count: 5, correct: 1 }]);
  const [questionType, setQuestionType] = useState<QuizQuestionType>('single_answer');
  const fileRef = useRef<HTMLInputElement>(null);
  const [phase, setPhase] = useState<SubmitPhase>('idle');

  const submitting = phase === 'submitting';
  const isTf = questionType === 'true_false';
  const isCustom = !isTf && optionMode === 'custom';
  const totalCustomQuestions = correctGroups.reduce((sum, g) => sum + Math.max(0, g.count), 0);
  const effectiveNumQuestions = isCustom ? totalCustomQuestions : numQuestions;

  const updateGroup = (index: number, patch: Partial<CorrectGroup>) => {
    setCorrectGroups(prev => prev.map((g, i) => (i === index ? { ...g, ...patch } : g)));
  };
  const addGroup = () => setCorrectGroups(prev => [...prev, { count: 1, correct: 1 }]);
  const removeGroup = (index: number) => setCorrectGroups(prev => prev.filter((_, i) => i !== index));

  const handleCustomOptionsChange = (value: number) => {
    setCustomOptions(value);
    // correct can never exceed how many options the question actually has
    setCorrectGroups(prev => prev.map(g => ({ ...g, correct: Math.min(g.correct, value) })));
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
    if (!isPdf) {
      toast.error(t('quiz.generate_modal.invalid_file_type'));
      return;
    }
    setSelectedFile(file);
  };

  const handleGenerate = async () => {
    if (!selectedFile) { toast.error(t('quiz.generate_modal.input_file_required')); return; }
    if (isCustom && totalCustomQuestions < 1) { toast.error(t('quiz.generate_modal.input_file_required')); return; }

    setPhase('submitting');

    try {
      const baseInput = isTf
        ? { file: selectedFile, num_questions: numQuestions }
        : isCustom
          ? {
              file: selectedFile,
              option_counts: Array(totalCustomQuestions).fill(customOptions),
              correct_counts: flattenCorrectCounts(correctGroups),
            }
          : { file: selectedFile, num_questions: numQuestions, num_options: numOptions };

      const response = isTf
        ? await quizTasksApi.createGenerateTaskTf(baseInput)
        : questionType === 'multi_answer'
          ? await quizTasksApi.createGenerateTaskMulti(baseInput)
          : await quizTasksApi.createGenerateTask(baseInput);

      const optimisticTask = {
        id: response.task_id,
        kind: 'generate' as const,
        title: response.title || t('quiz.generate_modal.title'),
        question_type: questionType,
        status: response.status,
        progress: 0,
        total_steps: effectiveNumQuestions,
        current_step: 0,
        quiz_uid: null,
        error_message: null,
        payload: {},
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        completed_at: null,
      };
      dispatch(upsertTask(optimisticTask));

      toast.success(t('quizTasks.toast.started'), {
        description: t('quizTasks.toast.started_desc'),
        duration: 6000,
        action: {
          label: t('quizTasks.toast.view_tasks'),
          onClick: () => dispatch(setPanelOpen(true)),
        },
      });

      onClose();
      void router.refresh();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : t('quizTasks.toast.submit_error'));
      setPhase('idle');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-card border border-border rounded-3xl shadow-2xl w-full max-w-2xl animate-in fade-in slide-in-from-bottom-4 duration-200 max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-border flex items-center justify-between sticky top-0 bg-card z-10">
          <div>
            <h2 className="font-black text-foreground">{t('quiz.generate_modal.title')}</h2>
            <p className="text-xs text-muted-foreground font-medium mt-0.5">{t('quiz.generate_modal.subtitle')}</p>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} disabled={submitting} className="rounded-xl text-muted-foreground hover:text-foreground">
            <X size={20} />
          </Button>
        </div>

        <div className="p-6 space-y-6">
          {!isTf && (
          <div className="space-y-2">
            <div className="text-[10px] font-black uppercase text-muted-foreground tracking-wider">{t('quiz.generate_modal.option_mode_label')}</div>
            <div className="grid grid-cols-2 gap-2">
              {(['uniform', 'custom'] as const).map(mode => (
                <Button
                  key={mode}
                  type="button"
                  variant={optionMode === mode ? 'default' : 'outline'}
                  disabled={submitting}
                  onClick={() => {
                    setOptionMode(mode);
                    if (mode === 'custom') setQuestionType('multi_answer');
                  }}
                  className="rounded-xl font-bold text-xs h-10"
                >
                  {t(mode === 'custom' ? 'quiz.generate_modal.option_mode_custom' : 'quiz.generate_modal.option_mode_uniform')}
                </Button>
              ))}
            </div>
          </div>
          )}

          {isTf && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="text-[10px] font-black uppercase text-muted-foreground tracking-wider">{t('quiz.generate_modal.num_questions_label')}</div>
                <span className="text-sm font-black text-primary-brand">{t('quiz.generate_modal.num_questions_value', undefined, { count: numQuestions })}</span>
              </div>
              <Input
                type="range" min={5} max={30} step={5}
                value={numQuestions}
                onChange={e => setNumQuestions(Number(e.target.value))}
                disabled={submitting}
                className="w-full accent-primary-brand disabled:opacity-60"
              />
              <div className="flex justify-between text-[10px] font-bold text-muted-foreground">
                <span>5</span><span>10</span><span>15</span><span>20</span><span>25</span><span>30</span>
              </div>
            </div>
          )}

          {!isTf && !isCustom && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="text-[10px] font-black uppercase text-muted-foreground tracking-wider">{t('quiz.generate_modal.num_questions_label')}</div>
                <span className="text-sm font-black text-primary-brand">{t('quiz.generate_modal.num_questions_value', undefined, { count: numQuestions })}</span>
              </div>
              <Input
                type="range" min={5} max={30} step={5}
                value={numQuestions}
                onChange={e => setNumQuestions(Number(e.target.value))}
                disabled={submitting}
                className="w-full accent-primary-brand disabled:opacity-60"
              />
              <div className="flex justify-between text-[10px] font-bold text-muted-foreground">
                <span>5</span><span>10</span><span>15</span><span>20</span><span>25</span><span>30</span>
              </div>

              <div className="flex items-center justify-between pt-2">
                <div className="text-[10px] font-black uppercase text-muted-foreground tracking-wider">{t('quiz.generate_modal.num_options_label')}</div>
                <span className="text-sm font-black text-primary-brand">{t('quiz.generate_modal.num_options_value', undefined, { count: numOptions })}</span>
              </div>
              <Select value={String(numOptions)} onValueChange={v => setNumOptions(Number(v))} disabled={submitting}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {OPTION_CHOICES.map(n => (
                    <SelectItem key={n} value={String(n)}>{n}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {isCustom && (
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="text-[10px] font-black uppercase text-muted-foreground tracking-wider">{t('quiz.generate_modal.option_group_options')}</div>
                <Select value={String(customOptions)} onValueChange={v => handleCustomOptionsChange(Number(v))} disabled={submitting}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {OPTION_CHOICES.map(n => (
                      <SelectItem key={n} value={String(n)}>{n}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <div className="grid grid-cols-[1fr_1fr_auto] gap-2 text-[10px] font-black uppercase text-muted-foreground tracking-wider px-1">
                  <span>{t('quiz.generate_modal.option_group_questions')}</span>
                  <span>{t('quiz.generate_modal.option_group_correct')}</span>
                  <span />
                </div>
                {correctGroups.map((group, index) => (
                  <div key={index} className="grid grid-cols-[1fr_1fr_auto] gap-2 items-center">
                    <Input
                      type="number" min={1}
                      value={group.count}
                      disabled={submitting}
                      onChange={e => updateGroup(index, { count: Number(e.target.value) })}
                      className="h-10"
                    />
                    <Select
                      value={String(group.correct)}
                      onValueChange={v => updateGroup(index, { correct: Number(v) })}
                      disabled={submitting}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Array.from({ length: customOptions }, (_, i) => i + 1).map(n => (
                          <SelectItem key={n} value={String(n)}>{n}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      disabled={submitting || correctGroups.length <= 1}
                      onClick={() => removeGroup(index)}
                      className="text-muted-foreground hover:text-destructive disabled:opacity-30"
                    >
                      <Trash2 size={14} />
                    </Button>
                  </div>
                ))}
                <div className="flex items-center justify-between pt-1">
                  <Button type="button" variant="outline" size="sm" disabled={submitting} onClick={addGroup} className="gap-1.5 rounded-xl font-bold text-xs">
                    <Plus size={14} /> {t('quiz.generate_modal.option_group_add')}
                  </Button>
                  <span className="text-xs font-black text-primary-brand">
                    {t('quiz.generate_modal.option_group_total', undefined, { count: totalCustomQuestions })}
                  </span>
                </div>
              </div>
            </div>
          )}

          <div className="space-y-2">
            <div className="text-[10px] font-black uppercase text-muted-foreground tracking-wider">{t('quiz.generate_modal.question_type_label')}</div>
            <RadioGroup
              value={questionType}
              onValueChange={value => setQuestionType(value as QuizQuestionType)}
              className="grid grid-cols-1 gap-2 sm:grid-cols-2"
            >
              {(isCustom
                ? (['multi_answer'] as const)
                : (['single_answer', 'multi_answer', 'true_false'] as const)
              ).map(value => (
                <Label
                  key={value}
                  htmlFor={`question-type-${value}`}
                  className={`flex cursor-pointer items-start gap-2.5 rounded-xl border p-3 transition ${
                    questionType === value ? 'border-primary-brand bg-primary-brand/5' : 'border-border hover:bg-muted/30'
                  }`}
                >
                  <RadioGroupItem value={value} id={`question-type-${value}`} disabled={submitting} className="mt-0.5" />
                  <span className="flex flex-col">
                    <span className="text-xs font-bold text-foreground">
                      {t(`quiz.generate_modal.question_type_${value === 'multi_answer' ? 'multi' : value === 'true_false' ? 'true_false' : 'single'}`)}
                    </span>
                    <span className="text-[11px] font-medium text-muted-foreground">
                      {t(`quiz.generate_modal.question_type_${value === 'multi_answer' ? 'multi' : value === 'true_false' ? 'true_false' : 'single'}_hint`)}
                    </span>
                  </span>
                </Label>
              ))}
            </RadioGroup>
          </div>

          <div className="space-y-3">
            <div className="text-[10px] font-black uppercase text-muted-foreground tracking-wider">{t('quiz.generate_modal.source_label')}</div>
            <div
              onClick={() => !submitting && fileRef.current?.click()}
              className="flex flex-col items-center justify-center h-36 rounded-2xl border-2 border-dashed border-border hover:border-primary-brand bg-muted/30 hover:bg-primary-brand/5 transition cursor-pointer"
            >
              <Input ref={fileRef} type="file" accept=".pdf" className="hidden" onChange={handleFileSelect} />
              {selectedFile ? (
                <>
                  <FileText size={28} className="text-primary-brand mb-2" />
                  <p className="text-sm font-bold text-foreground">{selectedFile.name}</p>
                  <p className="text-xs text-primary-brand font-medium mt-1">{t('quiz.generate_modal.file_change')}</p>
                </>
              ) : (
                <>
                  <UploadCloud size={28} className="text-muted-foreground mb-2" />
                  <p className="text-sm font-bold text-foreground">{t('quiz.generate_modal.file_drop_hint')}</p>
                  <p className="text-xs text-muted-foreground mt-1">{t('quiz.generate_modal.file_drop_format')}</p>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="p-6 pt-0 flex gap-3 sticky bottom-0 bg-card border-t border-border">
          <Button variant="outline" onClick={onClose} disabled={submitting} className="flex-1 rounded-xl font-bold text-xs h-11">
            {t('quiz.generate_modal.cancel')}
          </Button>
          <Button
            onClick={() => void handleGenerate()}
            disabled={submitting || (isCustom && totalCustomQuestions < 1)}
            className="flex-1 bg-primary-brand hover:bg-primary-brand-dark text-white rounded-xl font-bold text-xs h-11 gap-2 shadow-lg shadow-primary-brand/20 disabled:opacity-60"
          >
            <Wand2 size={16} /> {t('quiz.generate_modal.submit', undefined, { count: effectiveNumQuestions })}
          </Button>
        </div>
      </div>
    </div>
  );
}
