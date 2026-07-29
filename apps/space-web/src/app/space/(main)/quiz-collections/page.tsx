'use client';

import * as React from 'react';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Layers, Plus, Loader2, Trash2, ChevronRight, Award, Users, BookOpen } from 'lucide-react';
import { Button } from '@shared/components/ui/button';
import { useTranslation } from '@shared/components/LocaleProvider';
import { toast } from 'sonner';
import { quizCollectionApi, certificateApi } from '@/lib/api/quiz-collection';
import type { QuizCollection, Certificate } from '@/lib/api/types';
import { CreateCollectionDialog } from '@/components/quiz-collection/CreateCollectionDialog';

export default function QuizCollectionsPage() {
  const router = useRouter();
  const { t } = useTranslation();
  const [collections, setCollections] = useState<QuizCollection[]>([]);
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);

  const load = async () => {
    try {
      setLoading(true);
      const [c, certs] = await Promise.all([
        quizCollectionApi.list(),
        certificateApi.list(),
      ]);
      setCollections(c);
      setCertificates(certs);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : t('quizCollection.load_error'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void load(); }, []);

  const handleDelete = async (c: QuizCollection) => {
    if (!window.confirm(t('quizCollection.delete_confirm', undefined, { title: c.title }))) return;
    try {
      await quizCollectionApi.deleteCollection(c.uid);
      setCollections(prev => prev.filter(x => x.uid !== c.uid));
      toast.success(t('quizCollection.delete_success'));
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : t('quizCollection.delete_error'));
    }
  };

  const certName = (id: string | null) => certificates.find(x => x.uid === id)?.name ?? t('quizCollection.library.card_no_certificate');
  const statusClass = (s: string) =>
    s === 'published'
      ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'
      : s === 'archived'
      ? 'bg-muted text-muted-foreground border-border'
      : 'bg-amber-500/10 text-amber-600 border-amber-500/20';

  return (
    <div className="max-w-6xl mx-auto py-8 px-4 space-y-6 animate-in fade-in duration-300">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-foreground tracking-tight">{t('quizCollection.title')}</h1>
          <p className="text-sm text-muted-foreground font-medium mt-1">{t('quizCollection.subtitle')}</p>
        </div>
        <Button
          onClick={() => setShowCreate(true)}
          className="bg-primary-brand hover:bg-primary-brand-dark text-white font-bold text-xs rounded-xl h-10 px-5 gap-2 shadow-lg shadow-primary-brand/20"
        >
          <Plus size={16} />
          {t('quizCollection.create_btn')}
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-32 text-muted-foreground">
          <Loader2 size={36} className="animate-spin" />
        </div>
      ) : collections.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-32 text-muted-foreground border-2 border-dashed border-border rounded-3xl">
          <Layers size={48} className="mb-4 opacity-30" />
          <p className="text-sm font-medium">{t('quizCollection.empty')}</p>
          <p className="text-xs mt-1 mb-6">{t('quizCollection.empty_hint')}</p>
          <Button onClick={() => setShowCreate(true)} variant="outline" className="rounded-xl gap-2 font-bold text-xs">
            <Plus size={16} /> {t('quizCollection.create_first_btn')}
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {collections.map(c => (
            <div
              key={c.uid}
              onClick={() => router.push(`/space/quiz-collections/${c.uid}`)}
              className="bg-card border border-border rounded-2xl shadow-sm hover:shadow-md hover:border-primary-brand/50 transition-all group p-5 flex flex-col gap-4 cursor-pointer"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary-brand/10 flex items-center justify-center text-primary-brand shrink-0">
                  <Layers size={20} />
                </div>
                <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full border ${statusClass(c.status)}`}>
                  {t(`quizCollection.status.${c.status}`)}
                </span>
              </div>

              <div className="flex-1">
                <h3 className="font-black text-foreground text-sm leading-snug line-clamp-2">{c.title}</h3>
                {c.description && (
                  <p className="text-xs text-muted-foreground font-medium mt-1 line-clamp-2">{c.description}</p>
                )}
              </div>

              <div className="flex items-center gap-3 text-xs text-muted-foreground font-medium">
                <span className="flex items-center gap-1">
                  <BookOpen size={12} />
                  {t('quizCollection.library.card_quiz_count', undefined, { count: c.quiz_count })}
                </span>
                <span className="flex items-center gap-1">
                  <Users size={12} />
                  {t('quizCollection.library.card_class_count', undefined, { count: (c as any).class_count ?? 0 })}
                </span>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-border">
                <span className="flex items-center gap-1 text-xs font-bold text-primary-brand">
                  <Award size={12} />
                  <span className="line-clamp-1">{certName(c.certificate_id)}</span>
                </span>
                <div className="flex items-center gap-2">
                  <Button
                    onClick={(e) => { e.stopPropagation(); void handleDelete(c); }}
                    className="text-muted-foreground hover:text-red-500 transition-colors p-1"
                    title="Delete"
                  >
                    <Trash2 size={14} />
                  </Button>
                  <ChevronRight size={16} className="text-muted-foreground group-hover:text-primary-brand group-hover:translate-x-1 transition-all" />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <CreateCollectionDialog
        open={showCreate}
        onOpenChange={setShowCreate}
        certificates={certificates}
        onCreated={(c) => {
          setCollections(prev => [c, ...prev]);
          setShowCreate(false);
          toast.success(t('quizCollection.create_success', undefined, { title: c.title }));
          router.push(`/space/quiz-collections/${c.uid}`);
        }}
      />
    </div>
  );
}
