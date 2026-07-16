'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { Layers, Loader2, Award, ChevronRight, Trophy } from 'lucide-react';
import { useTranslation } from '@shared/components/LocaleProvider';
import { toast } from 'sonner';
import { consumerQuizCollectionApi } from '@/lib/api/quiz-collection';
import type { QuizCollection, QuizCollectionProgress } from '@/lib/api/types';

interface Props {
  params: Promise<{ uid: string }>;
}

export default function ClassroomCollectionListPage({ params }: Props) {
  const router = useRouter();
  const { t } = useTranslation();
  const classroomUid = use(params).uid;
  const [collections, setCollections] = useState<QuizCollection[]>([]);
  const [progress, setProgress] = useState<Record<string, QuizCollectionProgress>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const list = await consumerQuizCollectionApi.listByClassroom(classroomUid);
        setCollections(list);
        const pMap: Record<string, QuizCollectionProgress> = {};
        for (const c of list) {
          try {
            pMap[c.uid] = await consumerQuizCollectionApi.getProgress(c.uid, classroomUid);
          } catch {
            pMap[c.uid] = { total: c.quiz_count, passed: 0, is_completed: false, percent: 0, passed_quiz_ids: [], missing_quiz_ids: [] };
          }
        }
        setProgress(pMap);
      } catch (err: unknown) {
        toast.error(err instanceof Error ? err.message : t('quizCollection.load_error'));
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, [classroomUid, t]);

  return (
    <div className="max-w-4xl mx-auto py-6 px-4 space-y-4">
      <div>
        <h1 className="text-xl font-black text-foreground">{t('quizCollection.title')}</h1>
        <p className="text-sm text-muted-foreground mt-0.5">{t('quizCollection.subtitle')}</p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-24 text-muted-foreground">
          <Loader2 size={32} className="animate-spin" />
        </div>
      ) : collections.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-muted-foreground border-2 border-dashed border-border rounded-2xl">
          <Layers size={40} className="mb-3 opacity-30" />
          <p className="text-sm font-medium">{t('quizCollection.empty')}</p>
          <p className="text-xs mt-1">{t('quizCollection.empty_hint')}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {collections.map(c => {
            const p = progress[c.uid];
            return (
              <button
                key={c.uid}
                onClick={() => router.push(`/consumer/classroom/${classroomUid}/collection/${c.uid}`)}
                className="w-full text-left bg-card border border-border rounded-2xl p-4 hover:shadow-md hover:border-primary-brand/50 transition-all group flex items-center gap-4"
              >
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
                  p?.is_completed
                    ? 'bg-amber-500/10 text-amber-600'
                    : 'bg-primary-brand/10 text-primary-brand'
                }`}>
                  {p?.is_completed ? <Trophy size={22} /> : <Layers size={22} />}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-black text-foreground text-sm truncate">{c.title}</h3>
                  {c.description && (
                    <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">{c.description}</p>
                  )}
                  {p && p.total > 0 && (
                    <div className="mt-2 flex items-center gap-2">
                      <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                        <div
                          className={`h-full transition-all ${
                            p.is_completed ? 'bg-amber-500' : 'bg-primary-brand'
                          }`}
                          style={{ width: `${p.percent}%` }}
                        />
                      </div>
                      <span className="text-[11px] font-bold text-muted-foreground shrink-0">
                        {t('quizCollection.card_progress', undefined, { done: p.passed, total: p.total })}
                      </span>
                    </div>
                  )}
                </div>
                <ChevronRight size={16} className="text-muted-foreground group-hover:text-primary-brand group-hover:translate-x-1 transition-all" />
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
