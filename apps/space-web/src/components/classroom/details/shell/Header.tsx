'use client';

import * as React from 'react';
import { ArrowLeft, Settings, Users } from 'lucide-react';
import { Button } from '@shared/components/ui/button';
import type { AppRouterInstance } from 'next/dist/shared/lib/app-router-context.shared-runtime';
import type { Classroom } from '@/lib/api';

interface HeaderProps {
  classroom: Classroom;
  pendingMembersCount: number;
  onOpenPendingSheet: () => void;
  onLoadPendingMembers: () => void;
  router: AppRouterInstance;
  t: (key: string, fallback?: string, vars?: Record<string, unknown>) => string;
}

export default function Header({
  classroom,
  pendingMembersCount,
  onOpenPendingSheet,
  onLoadPendingMembers,
  router,
  t,
}: HeaderProps) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-6">
        <Button
          variant="outline"
          size="icon"
          onClick={() => router.push('/space/classrooms')}
          className="w-12 h-12 rounded-full bg-card shadow-sm hover:bg-accent transition-all hover:scale-110 active:scale-95"
        >
          <ArrowLeft size={20} className="text-muted-foreground" />
        </Button>
        <div>
          <div className="flex items-center gap-3 mb-1">
            <span className="text-[10px] font-black bg-primary-brand text-white px-2.5 py-1 rounded-md uppercase tracking-widest shadow-sm">
              {t('classroom.ui.classroom_id_badge', undefined, { id: classroom.pid })}
            </span>
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.3em]">
              {t('classroom.ui.page_subtitle')}
            </span>
          </div>
          <h1 className="text-3xl font-bold text-foreground tracking-tight">{classroom.name}</h1>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <Button
          variant="outline"
          onClick={() => router.push(`/space/classrooms/edit/${classroom.uid}`)}
          className="h-12 rounded-xl px-6 gap-2.5 font-bold text-xs hover:bg-card text-muted-foreground uppercase tracking-widest bg-muted/50"
        >
          <Settings size={18} />
          {t('classroom.ui.settings_btn')}
        </Button>
        <Button
          onClick={() => { onOpenPendingSheet(); onLoadPendingMembers(); }}
          className="relative h-12 bg-amber-500 hover:bg-amber-600 text-white rounded-xl px-6 gap-2.5 font-bold text-xs shadow-lg shadow-amber-500/20 uppercase tracking-widest transition-all hover:scale-[1.02] active:scale-[0.98]"
        >
          <Users size={18} />
          {t('classroom.ui.approve_btn')}
          {pendingMembersCount > 0 && (
            <span className="absolute -top-2 -right-2 min-w-[20px] h-5 rounded-full bg-rose-500 text-white text-[10px] font-black flex items-center justify-center px-1 shadow">
              {pendingMembersCount}
            </span>
          )}
        </Button>
      </div>
    </div>
  );
}
