'use client';

import * as React from 'react';
import { useState, useRef } from 'react';
import { useDispatch } from 'react-redux';
import { useRouter } from 'next/navigation';
import { quizTasksApi } from '@/lib/api/quiz-tasks';
import { upsertTask, setPanelOpen } from '@/lib/redux/quizTasksSlice';
import { useTranslation } from '@shared/components/LocaleProvider';
import {
  FileText,
  UploadCloud, X, Wand2,
} from 'lucide-react';
import { Button } from '@shared/components/ui/button';
import { Input } from '@shared/components/ui/input';
import { Textarea } from '@shared/components/ui/textarea';
import { toast } from 'sonner';

const QUIZ_TYPE_KEYS = [
  { value: 'multiple_choice', key: 'type_multiple_choice' },
  { value: 'true_false',      key: 'type_true_false' },
  { value: 'fill_blank',      key: 'type_fill_blank' },
  { value: 'scenario',        key: 'type_scenario' },
] as const;

const QUIZ_TYPE_ICONS: Record<typeof QUIZ_TYPE_KEYS[number]['value'], string> = {
  multiple_choice: '🔘',
  true_false: '✅',
  fill_blank: '✏️',
  scenario: '🎯',
};

type QuizTypeValue = typeof QUIZ_TYPE_KEYS[number]['value'];
type SubmitPhase = 'idle' | 'submitting';

export default function GenerateQuizModal({ onClose }: { onClose: () => void }) {
  const dispatch = useDispatch();
  const router = useRouter();
  const { t } = useTranslation();
  const [mode, setMode] = useState<'text' | 'file'>('text');
  const [content, setContent] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [quizType, setQuizType] = useState<QuizTypeValue>('multiple_choice');
  const [numQuestions, setNumQuestions] = useState(10);
  const fileRef = useRef<HTMLInputElement>(null);
  const [phase, setPhase] = useState<SubmitPhase>('idle');

  const submitting = phase === 'submitting';

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setSelectedFile(file);
  };

  const handleGenerate = async () => {
    if (mode === 'text' && !content.trim()) { toast.error(t('quiz.generate_modal.input_text_required')); return; }
    if (mode === 'file' && !selectedFile) { toast.error(t('quiz.generate_modal.input_file_required')); return; }

    setPhase('submitting');

    try {
      const response = await quizTasksApi.createGenerateTask({
        ...(mode === 'text' ? { content } : {}),
        quiz_type: quizType,
        num_questions: numQuestions,
        ...(mode === 'file' ? { file: selectedFile! } : {}),
      });

      const optimisticTask = {
        id: response.task_id,
        kind: 'generate' as const,
        title: response.title || t('quiz.generate_modal.title'),
        status: response.status,
        progress: 0,
        total_steps: numQuestions,
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
          <div className="space-y-2">
            <div className="text-[10px] font-black uppercase text-muted-foreground tracking-wider">{t('quiz.generate_modal.quiz_type_label')}</div>
            <div className="grid grid-cols-2 gap-2">
              {QUIZ_TYPE_KEYS.map(opt => (
                <Button
                  key={opt.value}
                  type="button"
                  onClick={() => setQuizType(opt.value)}
                  disabled={submitting}
                  className={`text-left rounded-2xl border-2 px-4 py-3 transition-all ${
                    quizType === opt.value
                      ? 'border-primary-brand bg-primary-brand/10'
                      : 'border-border bg-muted/50 hover:border-primary-brand/50'
                  } disabled:opacity-60`}
                >
                  <div className="text-lg mb-1">{QUIZ_TYPE_ICONS[opt.value]}</div>
                  <div className={`text-xs font-black ${quizType === opt.value ? 'text-primary-brand' : 'text-foreground'}`}>
                    {t(`quiz.generate_modal.${opt.key}_label`)}
                  </div>
                  <div className="text-[10px] font-medium text-muted-foreground mt-0.5 leading-relaxed">{t(`quiz.generate_modal.${opt.key}_desc`)}</div>
                </Button>
              ))}
            </div>
          </div>

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

          <div className="space-y-3">
            <div className="text-[10px] font-black uppercase text-muted-foreground tracking-wider">{t('quiz.generate_modal.source_label')}</div>
            <div className="flex gap-2">
              {([['text', t('quiz.generate_modal.source_text')], ['file', t('quiz.generate_modal.source_file')]] as const).map(([key, label]) => (
                <Button
                  key={key}
                  type="button"
                  onClick={() => setMode(key)}
                  disabled={submitting}
                  data-selected={mode === key}
                  className="flex-1 py-2.5 rounded-xl text-xs font-black bg-muted text-muted-foreground data-[selected=true]:border-2 data-[selected=true]:border-primary data-[selected=true]:text-primary disabled:opacity-60"
                >
                  {label}
                </Button>
              ))}
            </div>

            {mode === 'text' ? (
              <Textarea
                value={content}
                onChange={e => setContent(e.target.value)}
                placeholder={t('quiz.generate_modal.text_placeholder')}
                rows={6}
                disabled={submitting}
                className="w-full rounded-2xl border border-border bg-muted/50 px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-primary-brand focus:ring-2 focus:ring-primary-brand/20 resize-none transition disabled:opacity-60"
              />
            ) : (
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
            )}
          </div>
        </div>

        <div className="p-6 pt-0 flex gap-3 sticky bottom-0 bg-card border-t border-border">
          <Button variant="outline" onClick={onClose} disabled={submitting} className="flex-1 rounded-xl font-bold text-xs h-11">
            {t('quiz.generate_modal.cancel')}
          </Button>
          <Button
            onClick={() => void handleGenerate()}
            disabled={submitting}
            className="flex-1 bg-primary-brand hover:bg-primary-brand-dark text-white rounded-xl font-bold text-xs h-11 gap-2 shadow-lg shadow-primary-brand/20 disabled:opacity-60"
          >
            <Wand2 size={16} /> {t('quiz.generate_modal.submit', undefined, { count: numQuestions })}
          </Button>
        </div>
      </div>
    </div>
  );
}
