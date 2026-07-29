import * as React from 'react';
import { Wand2, Plus, Gamepad2, Clock, RefreshCw, Trophy, X, Loader2 } from 'lucide-react';
import { Button } from '@shared/components/ui/button';
import type { Quiz } from '@/lib/api/types';
import type { AppRouterInstance } from 'next/dist/shared/lib/app-router-context.shared-runtime';

interface QuizTabProps {
  assignedQuizzes: Quiz[];
  loadingQuizzes: boolean;
  setShowAssignModal: (show: boolean) => void;
  unassigningUid: string | null;
  handleUnassignQuiz: (quiz: Quiz) => Promise<void> | void;
  setLeaderboardQuiz: (quiz: Quiz | null) => void;
  router: AppRouterInstance;
  t: (key: string, fallback?: string, vars?: Record<string, unknown>) => string;
}

export default function QuizTab({
  assignedQuizzes,
  loadingQuizzes,
  setShowAssignModal,
  unassigningUid,
  handleUnassignQuiz,
  setLeaderboardQuiz,
  router,
  t,
}: QuizTabProps) {
  return (
    <div className="flex flex-col h-full animate-in fade-in duration-300 bg-card rounded-[32px] overflow-hidden shadow-sm">
      <div className="p-10 bg-muted/50 flex flex-col gap-6 xl:flex-row xl:items-center xl:justify-between">
        <div>
          <h3 className="text-xl font-bold text-foreground">{t('classroom.ui.quiz_section_title')}</h3>
          <p className="text-sm text-muted-foreground font-medium mt-1">{t('classroom.ui.quiz_section_subtitle')}</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button
            variant="outline"
            onClick={() => router.push('/space/quizzes')}
            className="h-12 rounded-2xl px-6 gap-3 text-xs font-bold uppercase tracking-widest transition-all"
          >
            <Wand2 size={18} />
            {t('classroom.ui.quiz_create_new_btn')}
          </Button>
          <Button
            onClick={() => setShowAssignModal(true)}
            className="h-12 rounded-2xl bg-primary-brand px-8 gap-3 text-xs font-bold text-white shadow-lg shadow-primary-brand/10 hover:bg-primary-brand-dark uppercase tracking-widest transition-all"
          >
            <Plus size={20} />
            {t('classroom.ui.quiz_assign_new_btn')}
          </Button>
        </div>
      </div>

      <div className="p-10 flex-1 overflow-y-auto space-y-4">
        {loadingQuizzes ? (
          <div className="flex h-40 items-center justify-center text-muted-foreground/50">
            <Loader2 size={32} className="animate-spin" />
          </div>
        ) : assignedQuizzes.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-muted-foreground/50 bg-muted/30 rounded-[32px]">
            <div className="w-16 h-16 rounded-full bg-card flex items-center justify-center mb-4 shadow-sm">
              <Gamepad2 size={24} className="opacity-40" />
            </div>
            <p className="text-sm font-bold text-foreground uppercase tracking-widest">{t('classroom.ui.quiz_empty_title')}</p>
            <p className="text-xs font-medium mt-1">{t('classroom.ui.quiz_empty_hint')}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {assignedQuizzes.map(quiz => {
              const assignment = quiz.assigned_classrooms?.[0];
              const timeLimitMin = assignment?.time_limit_seconds ? Math.round(assignment.time_limit_seconds / 60) : 0;
              return (
                <div key={quiz.uid} className="bg-card p-6 rounded-[24px] shadow-sm flex items-center gap-6 group transition-all hover:shadow-lg">
                  <div className="w-14 h-14 rounded-2xl bg-primary-brand-light text-primary-brand flex items-center justify-center shadow-sm transition-all group-hover:scale-110">
                    <Gamepad2 size={24} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-base font-bold text-foreground group-hover:text-primary-brand transition-colors mb-1.5">{quiz.title}</h4>
                    <div className="flex items-center gap-4 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                      <span className="bg-muted px-2 py-0.5 rounded text-muted-foreground">{t('classroom.ui.quiz_questions_count', undefined, { count: quiz.questions_count })}</span>
                      <span className="flex items-center gap-1.5"><Clock size={12} /> {timeLimitMin > 0 ? t('classroom.ui.quiz_time_limit_value', undefined, { count: timeLimitMin }) : t('classroom.ui.quiz_no_limit')}</span>
                      <span className="flex items-center gap-1.5"><RefreshCw size={12} /> {assignment?.max_attempts ? t('classroom.ui.quiz_max_attempts_value', undefined, { count: assignment.max_attempts }) : t('classroom.ui.quiz_unlimited')}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-10 rounded-xl px-4 gap-2 text-xs font-black uppercase tracking-wider text-amber-600 hover:bg-amber-50"
                      onClick={() => setLeaderboardQuiz(quiz)}
                    >
                      <Trophy size={14} />
                      Bảng vàng
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-11 w-11 rounded-xl text-muted-foreground/50 hover:text-rose-500 hover:bg-rose-50"
                      onClick={() => void handleUnassignQuiz(quiz)}
                      disabled={unassigningUid === quiz.uid}
                    >
                      {unassigningUid === quiz.uid ? <Loader2 size={18} className="animate-spin" /> : <X size={20} />}
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
