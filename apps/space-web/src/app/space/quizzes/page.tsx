'use client';

import * as React from 'react';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { quizApi } from '@/lib/api/quiz';
import type { Quiz } from '@/lib/api/types';
import {
  Loader2, Plus, Trash2, Eye, BookOpen, Wand2,
} from 'lucide-react';
import { Button } from '@shared/components/ui/button';
import { toast } from 'sonner';
import { useTranslation } from '@shared/components/LocaleProvider';
import { useSelector } from 'react-redux';
import type { RootState } from '@/lib/redux/store';
import GenerateQuizModal from '@/components/quiz/GenerateQuizModal';

export default function QuizLibraryPage() {
  const router = useRouter();
  const { t } = useTranslation();
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [loading, setLoading] = useState(true);
  const [showGenerateModal, setShowGenerateModal] = useState(false);

  const activeTaskCount = useSelector((s: RootState) => {
    const ids = s.quizTasks.ids;
    let n = 0;
    for (const id of ids) {
      const t = s.quizTasks.byId[id];
      if (t && (t.status === 'completed') && t.quiz_uid && !quizzes.find(q => q.uid === t.quiz_uid)) {
        n += 1;
      }
    }
    return n;
  });

  const loadQuizzes = React.useCallback(async () => {
    setLoading(true);
    try {
      const data = await quizApi.list();
      setQuizzes(data);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : t('quiz.load_error'));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    const handle = setTimeout(() => { void loadQuizzes(); }, 0);
    return () => clearTimeout(handle);
  }, [loadQuizzes]);

  useEffect(() => {
    if (activeTaskCount === 0) return;
    const id = setTimeout(() => { void loadQuizzes(); }, 0);
    return () => clearTimeout(id);
  }, [activeTaskCount, loadQuizzes]);

  const handleDelete = async (quiz: Quiz) => {
    if (!window.confirm(t('quiz.delete_confirm', undefined, { title: quiz.title }))) return;
    try {
      await quizApi.deleteQuiz(quiz.uid);
      setQuizzes(prev => prev.filter(q => q.uid !== quiz.uid));
      toast.success(t('quiz.delete_success'));
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : t('quiz.delete_error'));
    }
  };

  const STATUS_LABEL_KEY: Record<string, string> = {
    draft: 'quiz.status.draft',
    published: 'quiz.status.published',
    archived: 'quiz.status.archived',
  };

  return (
    <div className="max-w-5xl mx-auto py-8 px-4 space-y-6 animate-in fade-in duration-300">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-foreground tracking-tight">{t('quiz.title')}</h1>
          <p className="text-sm text-muted-foreground font-medium mt-1">
            {t('quiz.subtitle')}
          </p>
        </div>
        <Button
          onClick={() => setShowGenerateModal(true)}
          className="bg-primary-brand hover:bg-primary-brand-dark text-white font-bold text-xs rounded-xl h-10 px-5 gap-2 shadow-lg shadow-primary-brand/20"
        >
          <Wand2 size={16} />
          {t('quiz.create_btn')}
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-32 text-muted-foreground">
          <Loader2 size={36} className="animate-spin" />
        </div>
      ) : quizzes.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-32 text-muted-foreground border-2 border-dashed border-border rounded-3xl">
          <BookOpen size={48} className="mb-4 opacity-30" />
          <p className="text-sm font-medium">{t('quiz.empty')}</p>
          <p className="text-xs mt-1 mb-6">{t('quiz.empty_hint')}</p>
          <Button onClick={() => setShowGenerateModal(true)} variant="outline" className="rounded-xl gap-2 font-bold text-xs">
            <Plus size={16} /> {t('quiz.create_first_btn')}
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {quizzes.map(quiz => (
            <div
              key={quiz.uid}
              className="bg-card border border-border rounded-2xl shadow-sm hover:shadow-md hover:border-primary-brand/50 transition-all group p-5 flex flex-col gap-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary-brand/10 flex items-center justify-center text-primary-brand shrink-0">
                  <BookOpen size={20} />
                </div>
                <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full border ${
                  quiz.status === 'published'
                    ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                    : quiz.status === 'archived'
                    ? 'bg-muted text-muted-foreground border-border'
                    : 'bg-amber-500/10 text-amber-500 border-amber-500/20'
                }`}>
                  {t(STATUS_LABEL_KEY[quiz.status] ?? 'quiz.status.draft')}
                </span>
              </div>

              <div className="flex-1">
                <h3 className="font-black text-foreground text-sm leading-snug line-clamp-2">{quiz.title}</h3>
                {quiz.description && (
                  <p className="text-xs text-muted-foreground font-medium mt-1 line-clamp-2">{quiz.description}</p>
                )}
                <div className="mt-3 flex items-center gap-3 text-[11px] font-bold text-muted-foreground uppercase">
                  <span>{t('quiz.library.card_questions_count', undefined, { count: quiz.questions_count })}</span>
                  {quiz.assigned_classrooms && quiz.assigned_classrooms.length > 0 && (
                    <span className="text-primary-brand">{t('quiz.library.card_classes_count', undefined, { count: quiz.assigned_classrooms.length })}</span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2 border-t border-border">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => router.push(`/space/quizzes/${quiz.uid}`)}
                  className="flex-1 h-8 rounded-lg gap-1.5 text-xs font-bold"
                >
                  <Eye size={14} />
                  {t('quiz.view_detail')}
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => void handleDelete(quiz)}
                  className="h-8 w-8 rounded-lg text-muted-foreground hover:text-rose-500 hover:bg-rose-500/10"
                >
                  <Trash2 size={15} />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showGenerateModal && (
        <GenerateQuizModal onClose={() => setShowGenerateModal(false)} />
      )}
    </div>
  );
}
