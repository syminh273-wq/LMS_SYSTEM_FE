'use client';

import * as React from 'react';
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Loader2, Plus, Trash2, GripVertical, Award, BookOpen, Users, Edit3, Check, X, Send, ChevronDown, AlertTriangle } from 'lucide-react';
import { Button } from '@shared/components/ui/button';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useTranslation } from '@shared/components/LocaleProvider';
import { toast } from 'sonner';
import { quizCollectionApi, certificateApi } from '@/lib/api/quiz-collection';
import { quizApi } from '@/lib/api/quiz';
import { classroomApi } from '@/lib/api/classroom';
import type {
  QuizCollectionDetail,
  QuizCollectionItem,
  Certificate,
  Classroom,
  Quiz,
} from '@/lib/api/types';
import { AddQuizDialog } from '@/components/quiz-collection/AddQuizDialog';
import { AssignCertificateDialog } from '@/components/quiz-collection/AssignCertificateDialog';
import { AssignToClassroomDialog } from '@/components/quiz-collection/AssignToClassroomDialog';

interface Props {
  params: Promise<{ collectionUid: string }>;
}

interface SortableRowProps {
  item: QuizCollectionItem;
  quiz?: Quiz;
  onRemove: (quizId: string) => void;
}

function SortableRow({ item, quiz, onRemove }: SortableRowProps) {
  const { t } = useTranslation();
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: item.quiz_id });
  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.6 : 1,
  };
  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-3 px-4 py-3 rounded-xl border border-border bg-card hover:bg-muted/30 transition-colors"
    >
      <button
        {...attributes}
        {...listeners}
        className="text-muted-foreground hover:text-foreground cursor-grab active:cursor-grabbing"
        title={t('quizCollection.detail.reorder_hint')}
      >
        <GripVertical size={18} />
      </button>
      <div className="w-7 h-7 rounded-lg bg-primary-brand/10 text-primary-brand text-xs font-black flex items-center justify-center shrink-0">
        {item.order + 1}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold text-foreground truncate">{quiz?.title ?? item.quiz_id}</p>
        {quiz && (
          <p className="text-[11px] text-muted-foreground font-medium mt-0.5">
            {t('quizCollection.library.card_quiz_count', undefined, { count: quiz.questions_count })}
          </p>
        )}
      </div>
      <button
        onClick={() => onRemove(item.quiz_id)}
        className="text-muted-foreground hover:text-red-500 p-1.5 transition-colors"
        title="Remove"
      >
        <Trash2 size={14} />
      </button>
    </div>
  );
}

export default function CollectionDetailPage({ params }: Props) {
  const router = useRouter();
  const { t } = useTranslation();
  const [uid, setUid] = useState<string | null>(null);
  const [detail, setDetail] = useState<QuizCollectionDetail | null>(null);
  const [quizzes, setQuizzes] = useState<Record<string, Quiz>>({});
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleDraft, setTitleDraft] = useState('');
  const [showAddQuiz, setShowAddQuiz] = useState(false);
  const [showAssignCert, setShowAssignCert] = useState(false);
  const [showAssignClass, setShowAssignClass] = useState(false);
  const [items, setItems] = useState<QuizCollectionItem[]>([]);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  useEffect(() => {
    params.then(p => setUid(p.collectionUid));
  }, [params]);

  const load = useCallback(async () => {
    if (!uid) return;
    try {
      setLoading(true);
      const [d, certs, cls] = await Promise.all([
        quizCollectionApi.retrieve(uid),
        certificateApi.list(),
        classroomApi.list().then(r => Array.isArray(r) ? r : r.results),
      ]);
      setDetail(d);
      setItems(d.items);
      setCertificates(certs);
      setClassrooms(cls);
      const allQuizzes = await quizApi.list();
      const map: Record<string, Quiz> = {};
      allQuizzes.forEach((q: Quiz) => { map[q.uid] = q; });
      setQuizzes(map);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : t('quizCollection.load_error'));
    } finally {
      setLoading(false);
    }
  }, [uid, t]);

  useEffect(() => { void load(); }, [load]);

  const persistOrder = async (newItems: QuizCollectionItem[]) => {
    if (!uid) return;
    try {
      await quizCollectionApi.reorder(uid, { ordered_quiz_ids: newItems.map(i => i.quiz_id) });
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : t('quizCollection.detail.save_error'));
    }
  };

  const onDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = items.findIndex(i => i.quiz_id === active.id);
    const newIndex = items.findIndex(i => i.quiz_id === over.id);
    const newItems = arrayMove(items, oldIndex, newIndex).map((it, idx) => ({ ...it, order: idx }));
    setItems(newItems);
    void persistOrder(newItems);
  };

  const handleRemoveItem = async (quizId: string) => {
    if (!uid) return;
    try {
      await quizCollectionApi.removeItem(uid, quizId);
      setItems(prev => prev.filter(i => i.quiz_id !== quizId).map((it, idx) => ({ ...it, order: idx })));
      if (detail) setDetail({ ...detail, quiz_count: detail.quiz_count - 1 });
      toast.success(t('quizCollection.detail.save_success'));
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : t('quizCollection.detail.save_error'));
    }
  };

  const handleAddItems = async (quizIds: string[]) => {
    if (!uid) return;
    try {
      const res = await quizCollectionApi.addItems(uid, { quiz_ids: quizIds });
      const newItems: QuizCollectionItem[] = res.added.map((qid, idx) => ({
        quiz_id: qid,
        order: items.length + idx,
        added_at: new Date().toISOString(),
      }));
      setItems(prev => [...prev, ...newItems]);
      if (detail) setDetail({ ...detail, quiz_count: detail.quiz_count + res.added.length });
      toast.success(t('quizCollection.detail.save_success'));
      setShowAddQuiz(false);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : t('quizCollection.detail.save_error'));
    }
  };

  const handleSaveTitle = async () => {
    if (!detail || !titleDraft.trim()) return;
    try {
      const updated = await quizCollectionApi.update(detail.uid, { title: titleDraft.trim() });
      setDetail({ ...detail, title: updated.title });
      setEditingTitle(false);
      toast.success(t('quizCollection.update_success'));
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : t('quizCollection.detail.save_error'));
    }
  };

  const handleSetCertificate = async (certId: string | null) => {
    if (!detail) return;
    try {
      const updated = await quizCollectionApi.update(detail.uid, { certificate_id: certId });
      setDetail({ ...detail, certificate_id: updated.certificate_id });
      toast.success(t('quizCollection.certificate_modal.save_success'));
      setShowAssignCert(false);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : t('quizCollection.detail.save_error'));
    }
  };

  const handleAssignToClass = async (classroomId: string) => {
    if (!uid) return;
    try {
      await quizCollectionApi.assign(uid, { classroom_id: classroomId });
      const d = await quizCollectionApi.retrieve(uid);
      setDetail(d);
      toast.success(t('quizCollection.assign_modal.assign_success'));
      setShowAssignClass(false);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : t('quizCollection.detail.save_error'));
    }
  };

  const handleUnassign = async (classroomId: string) => {
    if (!uid) return;
    try {
      await quizCollectionApi.unassign(uid, classroomId);
      const d = await quizCollectionApi.retrieve(uid);
      setDetail(d);
      toast.success(t('quizCollection.detail.save_success'));
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : t('quizCollection.detail.save_error'));
    }
  };

  if (loading || !detail) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] text-muted-foreground">
        <Loader2 size={36} className="animate-spin" />
      </div>
    );
  }

  const cert = detail.certificate_id ? certificates.find(c => c.uid === detail.certificate_id) : null;

  return (
    <div className="max-w-5xl mx-auto py-8 px-4 space-y-6 animate-in fade-in duration-300">
      <button
        onClick={() => router.push('/space/quiz-collections')}
        className="flex items-center gap-1 text-xs font-bold text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft size={14} />
        {t('quizCollection.detail.back')}
      </button>

      {/* General info */}
      <section className="bg-card border border-border rounded-2xl p-5 space-y-3">
        <h2 className="text-xs font-black uppercase tracking-wider text-muted-foreground">
          {t('quizCollection.detail.info_section')}
        </h2>
        {editingTitle ? (
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={titleDraft}
              onChange={(e) => setTitleDraft(e.target.value)}
              className="flex-1 px-3 py-2 rounded-lg border border-border bg-background text-lg font-black"
              autoFocus
            />
            <Button size="icon" onClick={handleSaveTitle} className="bg-emerald-500 hover:bg-emerald-600 text-white">
              <Check size={16} />
            </Button>
            <Button size="icon" variant="outline" onClick={() => setEditingTitle(false)}>
              <X size={16} />
            </Button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <h1 className="flex-1 text-2xl font-black text-foreground">{detail.title}</h1>
            <Button
              size="icon"
              variant="ghost"
              onClick={() => { setTitleDraft(detail.title); setEditingTitle(true); }}
            >
              <Edit3 size={14} />
            </Button>
          </div>
        )}
        {detail.description && (
          <p className="text-sm text-muted-foreground">{detail.description}</p>
        )}
      </section>

      {/* Items */}
      <section className="bg-card border border-border rounded-2xl p-5 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-black uppercase tracking-wider text-muted-foreground">
            {t('quizCollection.detail.items_section')}
          </h2>
          <Button onClick={() => setShowAddQuiz(true)} size="sm" className="bg-primary-brand hover:bg-primary-brand-dark text-white gap-2 font-bold text-xs">
            <Plus size={14} />
            {t('quizCollection.detail.add_quiz_btn')}
          </Button>
        </div>
        {items.length === 0 ? (
          <p className="text-sm text-muted-foreground py-6 text-center">{t('quizCollection.detail.items_empty')}</p>
        ) : (
          <>
            <p className="text-[11px] text-muted-foreground italic">{t('quizCollection.detail.reorder_hint')}</p>
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
              <SortableContext items={items.map(i => i.quiz_id)} strategy={verticalListSortingStrategy}>
                <div className="space-y-2">
                  {items.map(item => (
                    <SortableRow key={item.quiz_id} item={item} quiz={quizzes[item.quiz_id]} onRemove={handleRemoveItem} />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          </>
        )}
      </section>

      {/* Certificate */}
      <section className="bg-card border border-border rounded-2xl p-5 space-y-3">
        <h2 className="text-xs font-black uppercase tracking-wider text-muted-foreground flex items-center gap-2">
          <Award size={14} />
          {t('quizCollection.detail.certificate_section')}
        </h2>
        {cert ? (
          <div className="flex items-center justify-between p-3 rounded-xl border border-border bg-muted/30">
            <div>
              <p className="font-bold text-foreground">{cert.name}</p>
              {cert.description && <p className="text-xs text-muted-foreground mt-0.5">{cert.description}</p>}
            </div>
            <div className="flex items-center gap-2">
              <Button size="sm" variant="outline" onClick={() => setShowAssignCert(true)}>
                {t('quizCollection.detail.change_certificate_btn')}
              </Button>
              <Button size="sm" variant="ghost" onClick={() => handleSetCertificate(null)}>
                {t('quizCollection.detail.remove_certificate_btn')}
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            <div className="flex items-center gap-2 rounded-xl border border-amber-300 bg-amber-50 px-3 py-2.5 text-amber-800">
              <AlertTriangle size={16} className="shrink-0" />
              <p className="text-[12px] font-bold leading-snug flex-1">
                {t('quizCollection.detail.no_certificate_warning')}
              </p>
            </div>
            <div className="flex items-center justify-between p-3 rounded-xl border border-dashed border-border">
              <p className="text-sm text-muted-foreground">{t('quizCollection.detail.no_certificate')}</p>
              <Button size="sm" onClick={() => setShowAssignCert(true)} className="bg-primary-brand hover:bg-primary-brand-dark text-white gap-2 font-bold text-xs">
                <Plus size={14} />
                {t('quizCollection.detail.assign_certificate_btn')}
              </Button>
            </div>
          </div>
        )}
      </section>

      {/* Assignments */}
      <section className="bg-card border border-border rounded-2xl p-5 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-black uppercase tracking-wider text-muted-foreground flex items-center gap-2">
            <Users size={14} />
            {t('quizCollection.detail.assignments_section')}
          </h2>
          <Button onClick={() => setShowAssignClass(true)} size="sm" variant="outline" className="gap-2 font-bold text-xs">
            <Plus size={14} />
            {t('quizCollection.detail.assign_to_class_btn')}
          </Button>
        </div>
        {detail.assignments.length === 0 ? (
          <p className="text-sm text-muted-foreground py-6 text-center">{t('quizCollection.detail.no_assignments')}</p>
        ) : (
          <div className="space-y-2">
            {detail.assignments.map(a => {
              const cls = classrooms.find(c => c.uid === a.classroom_id);
              return (
                <div key={a.classroom_id} className="flex items-center gap-3 px-3 py-2 rounded-xl border border-border bg-muted/30">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold truncate">{cls?.name ?? a.classroom_id}</p>
                    {cls && <p className="text-[11px] text-muted-foreground">PID: {cls.pid}</p>}
                  </div>
                  <Button size="sm" variant="ghost" onClick={() => handleUnassign(a.classroom_id)} className="text-red-500 hover:text-red-600">
                    <Trash2 size={14} />
                  </Button>
                </div>
              );
            })}
          </div>
        )}
      </section>

      <AddQuizDialog
        open={showAddQuiz}
        onOpenChange={setShowAddQuiz}
        existingQuizIds={items.map(i => i.quiz_id)}
        quizzes={Object.values(quizzes)}
        onConfirm={handleAddItems}
      />
      <AssignCertificateDialog
        open={showAssignCert}
        onOpenChange={setShowAssignCert}
        certificates={certificates}
        currentId={detail.certificate_id}
        onConfirm={handleSetCertificate}
      />
      <AssignToClassroomDialog
        open={showAssignClass}
        onOpenChange={setShowAssignClass}
        classrooms={classrooms}
        existingIds={detail.assignments.map(a => a.classroom_id)}
        onConfirm={handleAssignToClass}
      />
    </div>
  );
}
