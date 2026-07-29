'use client';

import * as React from 'react';
import { Wifi, WifiOff, FileText, BarChart2, Timer, Clock, Camera, Loader2 } from 'lucide-react';
import { Button } from '@shared/components/ui/button';
import type { Exam } from '@/lib/api';
import type { AppRouterInstance } from 'next/dist/shared/lib/app-router-context.shared-runtime';

interface FinalExamsTabProps {
  exams: Exam[];
  examSubTab: 'ongoing' | 'closed';
  setExamSubTab: (tab: 'ongoing' | 'closed') => void;
  loadingExams: boolean;
  setShowOpenExamModal: (show: boolean) => void;
  handleCloseOnline: (exam: Exam) => Promise<void> | void;
  formatDateTime: (v: string) => string;
  router: AppRouterInstance;
  classroomUid: string;
  t: (key: string, fallback?: string, vars?: Record<string, unknown>) => string;
}

export default function FinalExamsTab({
  exams,
  examSubTab,
  setExamSubTab,
  loadingExams,
  setShowOpenExamModal,
  handleCloseOnline,
  formatDateTime,
  router,
  classroomUid,
  t,
}: FinalExamsTabProps) {
  const activeExams = exams.filter(e => e.status === 'ongoing');
  const completedExams = exams.filter(e => e.status === 'closed');
  const hasAnySession = activeExams.length > 0 || completedExams.length > 0;
  const tabExams = examSubTab === 'ongoing' ? activeExams : completedExams;

  return (
    <div className="flex flex-col h-full animate-in fade-in duration-300 bg-card rounded-[32px] overflow-hidden shadow-sm">
      <div className="px-10 pt-10 pb-0 bg-muted/50">
        <div className="flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between mb-6">
          <div>
            <h3 className="text-xl font-bold text-foreground">{t('classroom.ui.final_exams_title')}</h3>
            <p className="text-sm text-muted-foreground font-medium mt-1">{t('classroom.ui.final_exams_subtitle')}</p>
          </div>
          <Button
            onClick={() => setShowOpenExamModal(true)}
            className="h-12 rounded-2xl bg-primary-brand px-8 gap-3 text-xs font-bold text-white shadow-lg shadow-primary-brand/20 hover:bg-primary-brand-dark uppercase tracking-widest transition-all"
          >
            <Wifi size={20} />
            {t('classroom.ui.final_exams_open')}
          </Button>
        </div>

        <div className="flex gap-1 border-b border-border">
          <Button
            type="button"
            onClick={() => setExamSubTab('ongoing')}
            className={`relative flex items-center gap-2 px-5 py-3 text-xs font-black uppercase tracking-wider transition-colors border-0 shadow-none bg-transparent hover:bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 ${
              examSubTab === 'ongoing'
                ? 'text-primary-brand'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <span className="relative flex h-2 w-2">
              {activeExams.length > 0 && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />}
              <span className={`relative inline-flex rounded-full h-2 w-2 ${activeExams.length > 0 ? 'bg-rose-500' : 'bg-muted-foreground/30'}`} />
            </span>
            {t('classroom.ui.final_exams_ongoing')}
            <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-black ${examSubTab === 'ongoing' ? 'bg-primary-brand-light text-primary-brand' : 'bg-muted text-muted-foreground'}`}>
              {activeExams.length}
            </span>
            <span
              className={`absolute bottom-0 left-0 right-0 h-0.5 rounded-t-full bg-primary-brand transition-opacity ${
                examSubTab === 'ongoing' ? 'opacity-100' : 'opacity-0'
              }`}
            />
          </Button>
          <Button
            type="button"
            onClick={() => setExamSubTab('closed')}
            className={`relative flex items-center gap-2 px-5 py-3 text-xs font-black uppercase tracking-wider transition-colors border-0 shadow-none bg-transparent hover:bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 ${
              examSubTab === 'closed'
                ? 'text-primary-brand'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {t('classroom.ui.final_exams_closed')}
            <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-black ${examSubTab === 'closed' ? 'bg-primary-brand-light text-primary-brand' : 'bg-muted text-muted-foreground'}`}>
              {completedExams.length}
            </span>
            <span
              className={`absolute bottom-0 left-0 right-0 h-0.5 rounded-t-full bg-primary-brand transition-opacity ${
                examSubTab === 'closed' ? 'opacity-100' : 'opacity-0'
              }`}
            />
          </Button>
        </div>
      </div>

      <div className="p-10 flex-1 overflow-y-auto">
        {loadingExams ? (
          <div className="flex h-40 items-center justify-center">
            <Loader2 size={32} className="animate-spin text-muted-foreground/40" />
          </div>
        ) : !hasAnySession ? (
          <div className="flex flex-col items-center justify-center py-24 bg-muted/30 rounded-[32px]">
            <div className="w-16 h-16 rounded-full bg-card flex items-center justify-center mb-4 shadow-sm">
              <BarChart2 size={24} className="opacity-40 text-muted-foreground" />
            </div>
            <p className="text-sm font-black text-foreground uppercase tracking-widest">{t('classroom.ui.final_exams_empty')}</p>
            <p className="text-xs font-medium mt-1 mb-6 text-muted-foreground">{t('classroom.ui.final_exams_empty_hint')}</p>
            <Button
              onClick={() => setShowOpenExamModal(true)}
              className="h-10 rounded-xl bg-primary-brand px-6 gap-2 text-xs font-bold text-white hover:bg-primary-brand-dark uppercase tracking-widest"
            >
              <Wifi size={15} />
              {t('classroom.ui.final_exams_open_first')}
            </Button>
          </div>
        ) : tabExams.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 bg-muted/20 rounded-[28px]">
            <BarChart2 size={28} className="opacity-20 text-muted-foreground mb-3" />
            <p className="text-sm font-bold text-muted-foreground">
              {examSubTab === 'ongoing' ? t('classroom.ui.final_exams_no_ongoing') : t('classroom.ui.final_exams_no_closed')}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {examSubTab === 'ongoing' ? (
              tabExams.map(exam => (
                <div key={exam.uid} className="bg-card rounded-[20px] shadow-md shadow-primary-brand-light">
                  <div className="flex items-center gap-5 p-5">
                    <div className="w-12 h-12 rounded-xl bg-primary-brand text-white flex items-center justify-center shrink-0 shadow-lg shadow-primary-brand-muted">
                      <FileText size={20} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="text-sm font-black text-foreground truncate">{exam.title}</h4>
                        <span className="shrink-0 text-[9px] font-black px-2 py-0.5 rounded-full bg-rose-50 text-rose-600 uppercase animate-pulse">
                          {t('classroom.ui.final_exams_live')}
                        </span>
                      </div>
                      <p className="text-[10px] font-bold text-muted-foreground">
                        {t('classroom.ui.final_exams_start', undefined, { time: exam.opened_at ? formatDateTime(exam.opened_at) : '--' })}
                      </p>
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        <span className="flex items-center gap-1 rounded-full bg-primary-brand-light px-2 py-0.5 text-[10px] font-black text-primary-brand">
                          <Timer size={9} />
                          {exam.duration_seconds ? t('classroom.ui.final_exams_minutes', undefined, { count: Math.round(exam.duration_seconds / 60) }) : t('classroom.ui.quiz_no_limit')}
                        </span>
                        <span className="flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-black text-amber-600">
                          <Clock size={9} />
                          {exam.late_threshold_seconds ? t('classroom.ui.final_exams_late', undefined, { minutes: Math.round(exam.late_threshold_seconds / 60) }) : t('classroom.ui.final_exams_no_late')}
                        </span>
                        <span className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-black ${exam.camera_required ? 'bg-emerald-50 text-emerald-600' : 'bg-muted/50 text-muted-foreground'}`}>
                          <Camera size={9} />
                          {exam.camera_required ? t('classroom.ui.final_exams_camera') : t('classroom.ui.final_exams_no_camera')}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Button onClick={() => router.push(`/space/classrooms/${classroomUid}/exams/${exam.uid}`)} variant="outline" size="sm" className="h-9 rounded-xl px-3 font-bold text-xs gap-1.5">
                        {t('classroom.ui.exams_view_detail')}
                      </Button>
                      <Button onClick={() => void handleCloseOnline(exam)} size="sm" className="h-9 rounded-xl px-3 font-bold text-xs gap-1.5 bg-rose-600 hover:bg-rose-700 text-white">
                        <WifiOff size={13} />{t('classroom.ui.exams_close_session')}
                      </Button>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              tabExams.map(exam => (
                <div key={exam.uid} className="bg-muted/40 rounded-[20px] flex items-center gap-5 p-5 hover:bg-card transition-all group">
                  <div className="w-12 h-12 rounded-xl bg-muted text-muted-foreground flex items-center justify-center shrink-0 group-hover:bg-primary-brand-light group-hover:text-primary-brand transition-colors">
                    <FileText size={20} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-black text-foreground truncate group-hover:text-primary-brand transition-colors">{exam.title}</h4>
                    <p className="text-[10px] font-bold text-muted-foreground mt-0.5">
                      {t('classroom.ui.final_exams_done_at', undefined, { time: exam.opened_at ? formatDateTime(exam.opened_at) : '--' })}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Button onClick={() => router.push(`/space/classrooms/${classroomUid}/exams/${exam.uid}`)} variant="outline" size="sm" className="h-9 rounded-xl px-3 font-bold text-xs gap-1.5">
                      {t('classroom.ui.exams_view_detail')}
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
