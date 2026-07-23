'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { Layers, Loader2, ArrowLeft, Users, Award, ChevronRight } from 'lucide-react';
import { useTranslation } from '@shared/components/LocaleProvider';
import { toast } from 'sonner';
import { quizCollectionApi, certificateApi } from '@/lib/api/quiz-collection';
import { classroomApi } from '@/lib/api/classroom';
import type { QuizCollection, Certificate, Classroom, QuizCollectionAssignment } from '@/lib/api/types';

interface Props {
  params: Promise<{ uid: string }>;
}

export default function ClassroomCollectionsPage({ params }: Props) {
  const router = useRouter();
  const { t } = useTranslation();
  const classroomUid = use(params).uid;
  const [classroom, setClassroom] = useState<Classroom | null>(null);
  const [collections, setCollections] = useState<QuizCollection[]>([]);
  const [assignments, setAssignments] = useState<Record<string, QuizCollectionAssignment[]>>({});
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const [cls, myCollections, certs] = await Promise.all([
          classroomApi.retrieve(classroomUid),
          quizCollectionApi.list(),
          certificateApi.list(),
        ]);
        setClassroom(cls);
        setCertificates(certs);
        const assigned: QuizCollection[] = [];
        const assignmentMap: Record<string, QuizCollectionAssignment[]> = {};
        for (const c of myCollections) {
          const list = await quizCollectionApi.listAssignments(c.uid);
          const inThisClass = list.filter(a => a.classroom_id === classroomUid);
          if (inThisClass.length > 0) {
            assigned.push(c);
            assignmentMap[c.uid] = inThisClass;
          }
        }
        setCollections(assigned);
        setAssignments(assignmentMap);
      } catch (err: unknown) {
        toast.error(err instanceof Error ? err.message : t('quizCollection.load_error'));
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, [classroomUid, t]);

  const certName = (id: string | null) => certificates.find(c => c.uid === id)?.name ?? t('quizCollection.library.card_no_certificate');

  return (
    <div className="max-w-5xl mx-auto py-8 px-4 space-y-6 animate-in fade-in duration-300">
      <button
        onClick={() => router.push(`/space/classrooms/${classroomUid}/details?tab=quiz`)}
        className="flex items-center gap-1 text-xs font-bold text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft size={14} />
        {classroom?.name ?? '...'}
      </button>

      <div>
        <h1 className="text-2xl font-black text-foreground tracking-tight">{t('quizCollection.title')}</h1>
        {classroom && (
          <p className="text-sm text-muted-foreground font-medium mt-1">
            {t('quizCollection.detail.assignments_section')} · {classroom.name}
          </p>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-32 text-muted-foreground">
          <Loader2 size={36} className="animate-spin" />
        </div>
      ) : collections.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-32 text-muted-foreground border-2 border-dashed border-border rounded-3xl">
          <Layers size={48} className="mb-4 opacity-30" />
          <p className="text-sm font-medium">{t('quizCollection.detail.no_assignments')}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {collections.map(c => (
            <div
              key={c.uid}
              onClick={() => router.push(`/space/quiz-collections/${c.uid}`)}
              className="bg-card border border-border rounded-2xl shadow-sm hover:shadow-md hover:border-primary-brand/50 transition-all p-5 flex flex-col gap-3 cursor-pointer group"
            >
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary-brand/10 flex items-center justify-center text-primary-brand shrink-0">
                  <Layers size={20} />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-black text-foreground text-sm leading-snug truncate">{c.title}</h3>
                  {c.description && <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{c.description}</p>}
                </div>
                <ChevronRight size={16} className="text-muted-foreground group-hover:text-primary-brand group-hover:translate-x-1 transition-all" />
              </div>
              <div className="flex items-center gap-3 text-xs text-muted-foreground pt-2 border-t border-border">
                <span className="flex items-center gap-1">
                  <Award size={12} className="text-amber-500" />
                  <span className="line-clamp-1">{certName(c.certificate_id)}</span>
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
