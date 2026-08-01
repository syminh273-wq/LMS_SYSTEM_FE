import * as React from 'react';
import { ClassroomDocsManager } from '@/features/classroom/components/docs-manager/ClassroomDocsManager';

interface DocsTabProps {
  classroomUid: string;
  apiBase: string;
  isTeacher: boolean;
  t: (key: string, fallback?: string, vars?: Record<string, unknown>) => string;
}

export default function DocsTab({
  classroomUid,
  apiBase,
  isTeacher,
  t,
}: DocsTabProps) {
  return (
    <div className="flex flex-col h-full animate-in fade-in duration-300 bg-card rounded-[32px] overflow-hidden shadow-sm p-6">
      <div className="mb-4">
        <h3 className="text-xl font-bold text-foreground">{t('classroom.ui.docs_title')}</h3>
        <p className="text-sm text-muted-foreground font-medium mt-1">{t('classroom.ui.docs_subtitle')}</p>
      </div>
      <ClassroomDocsManager
        classroomUid={classroomUid}
        apiBase={apiBase}
        accessToken={typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null}
        canManage={isTeacher}
        t={t}
      />
    </div>
  );
}
