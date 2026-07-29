import * as React from 'react';
import { Loader2 } from 'lucide-react';
import ClassroomChatPanel from '@/components/chat/ClassroomChatPanel';

interface ChatTabProps {
  conversationUid: string | null;
  classroomUid: string;
  activeTab: string;
  t: (key: string, fallback?: string, vars?: Record<string, unknown>) => string;
}

export default function ChatTab({
  conversationUid,
  classroomUid,
  activeTab,
  t,
}: ChatTabProps) {
  return (
    <div className="bg-card rounded-[32px] overflow-hidden shadow-sm h-[calc(100vh-260px)] flex flex-col">
      {conversationUid ? (
        <ClassroomChatPanel
          conversationUid={conversationUid}
          classroomUid={classroomUid}
          active={activeTab === 'chat'}
        />
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground">
          <Loader2 className="animate-spin mb-4 text-primary-brand" size={40} />
          <p className="text-sm font-bold uppercase tracking-widest">{t('classroom.labels.chat_loading')}</p>
        </div>
      )}
    </div>
  );
}
