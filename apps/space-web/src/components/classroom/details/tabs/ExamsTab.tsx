import * as React from 'react';
import { useMemo } from 'react';
import { Plus, FileText, Clock, Calendar, MoreVertical, Pencil, Trash2, ClipboardList, Loader2 } from 'lucide-react';
import { Button } from '@shared/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@shared/components/ui/dropdown-menu';
import type { Exam } from '@/lib/api';
import type { AppRouterInstance } from 'next/dist/shared/lib/app-router-context.shared-runtime';
import { ExamKind, isExamInKind } from '../utils/exam';

interface ExamsTabProps {
  exams: Exam[];
  loadingExams: boolean;
  canManageExams: boolean;
  selectedExamKind: ExamKind;
  goToExamKind: (kind: ExamKind) => void;
  handleDeleteExam: (exam: Exam) => Promise<void> | void;
  formatDateTime: (v: string) => string;
  formatDate: (v: string | null | undefined) => string;
  router: AppRouterInstance;
  classroomUid: string;
  t: (key: string, fallback?: string, vars?: Record<string, unknown>) => string;
}

export default function ExamsTab({
  exams,
  loadingExams,
  canManageExams,
  selectedExamKind,
  goToExamKind,
  handleDeleteExam,
  formatDateTime,
  formatDate,
  router,
  classroomUid,
  t,
}: ExamsTabProps) {
  const selectedKind: ExamKind = (['midterm', 'final', 'regular'] as ExamKind[]).includes(selectedExamKind) ? selectedExamKind : 'midterm';
  const filteredExams = useMemo(() => exams.filter(e => isExamInKind(e, selectedKind)), [exams, selectedKind]);

  return (
    <div className="flex flex-col h-full animate-in fade-in duration-300 bg-card rounded-[32px] overflow-hidden shadow-sm">
      <div className="p-10 bg-muted/50 flex flex-col gap-6 xl:flex-row xl:items-center xl:justify-between">
        <div>
          <h3 className="text-xl font-bold text-foreground">{t('classroom.ui.exams_title')}</h3>
          <p className="text-sm text-muted-foreground font-medium mt-1">{t('classroom.ui.exams_subtitle')}</p>
        </div>
        {canManageExams && (
          <Button
            onClick={() => router.push(`/space/classrooms/${classroomUid}/exams/create`)}
            className="h-12 rounded-2xl bg-primary-brand px-8 gap-3 text-xs font-bold text-white shadow-lg shadow-primary-brand/20 hover:bg-primary-brand-dark uppercase tracking-widest transition-all"
          >
            <Plus size={20} />
            {t('classroom.ui.exams_create')}
          </Button>
        )}
      </div>

      <div className="p-10 flex-1 overflow-y-auto space-y-8">
        <div className="flex flex-wrap items-center gap-3 bg-muted p-1.5 rounded-2xl w-fit">
          {(['midterm', 'final', 'regular'] as ExamKind[]).map(kind => (
            <Button
              key={kind}
              variant="ghost"
              onClick={() => goToExamKind(kind)}
              className={`px-6 py-2.5 rounded-xl text-[11px] font-bold uppercase tracking-widest transition-all ${
                selectedExamKind === kind
                  ? '!bg-card !text-primary-brand shadow-sm hover:!bg-card hover:!text-primary-brand'
                  : '!bg-transparent !text-muted-foreground hover:!bg-transparent hover:!text-foreground'
              }`}
            >
              {t(`classroom.ui.exam_kind_${kind}`)}
            </Button>
          ))}
        </div>

        <div className="space-y-4">
          {loadingExams ? (
            <div className="flex h-40 items-center justify-center text-muted-foreground/50">
              <Loader2 size={32} className="animate-spin" />
            </div>
          ) : filteredExams.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-muted-foreground/50 bg-muted/30 rounded-[32px]">
              <div className="w-16 h-16 rounded-full bg-card flex items-center justify-center mb-4 shadow-sm">
                <ClipboardList size={24} className="opacity-40" />
              </div>
              <p className="text-sm font-bold text-foreground uppercase tracking-widest">{t('classroom.ui.exams_empty')}</p>
              <p className="text-xs font-medium mt-1">{t('classroom.ui.exams_empty_kind', undefined, { kind: t(`classroom.ui.exam_kind_${selectedKind}`).toLowerCase() })}</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {filteredExams.map(exam => (
                <div key={exam.uid} className="bg-card p-6 rounded-[24px] shadow-sm flex items-center gap-6 group transition-all hover:shadow-lg">
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-sm transition-all group-hover:scale-110 ${
                    exam.status === 'published' ? 'bg-primary-brand-light text-primary-brand' : 'bg-muted text-muted-foreground'
                  }`}>
                    <FileText size={24} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-1">
                      <h4 className="text-base font-bold text-foreground group-hover:text-primary-brand transition-colors">{exam.title}</h4>
                      <span className={`text-[9px] font-black px-2 py-0.5 rounded uppercase tracking-wider ${
                        exam.status === 'published' ? 'bg-emerald-50 text-emerald-600' : 'bg-muted text-muted-foreground'
                      }`}>
                        {exam.status === 'published' ? t('classroom.ui.exams_published') : t('classroom.ui.exams_draft')}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                      <span className="flex items-center gap-1.5"><FileText size={12} /> {exam.content_type}</span>
                      <span className="flex items-center gap-1.5"><Clock size={12} /> {formatDateTime(exam.due_date)}</span>
                      {exam.created_at && (
                        <span className="flex items-center gap-1.5"><Calendar size={12} /> {formatDate(exam.created_at)}</span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      onClick={() => router.push(`/space/classrooms/${classroomUid}/exams/${exam.uid}`)}
                      className="h-10 rounded-xl px-4 font-bold text-xs bg-muted hover:bg-primary-brand hover:text-white text-muted-foreground transition-all uppercase tracking-widest"
                    >
                      {t('classroom.ui.exams_view_detail')}
                    </Button>
                    {canManageExams && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl text-muted-foreground/50 hover:text-foreground transition-colors">
                            <MoreVertical size={20} />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-56 p-2 rounded-2xl shadow-xl">
                          <DropdownMenuItem className="rounded-xl px-3 py-2.5 font-bold text-xs uppercase text-muted-foreground hover:text-primary-brand cursor-pointer" onClick={() => router.push(`/space/classrooms/${classroomUid}/exams/edit/${exam.uid}`)}>
                            <Pencil size={16} className="mr-3 text-muted-foreground" />
                            {t('classroom.ui.exams_edit')}
                          </DropdownMenuItem>
                          <DropdownMenuSeparator className="my-2 bg-muted" />
                          <DropdownMenuItem
                            className="rounded-xl px-3 py-2.5 font-bold text-xs uppercase text-rose-600 cursor-pointer"
                            onClick={() => void handleDeleteExam(exam)}
                          >
                            <Trash2 size={16} className="mr-3" />
                            {t('classroom.ui.exams_delete')}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
