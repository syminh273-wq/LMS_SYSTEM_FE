import * as React from 'react';
import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import ClassroomChatPanel from '@/components/chat/ClassroomChatPanel';
import { chatApi } from '@/lib/api/chat';

interface ChatTabProps {
  classroomUid: string;
  t: (key: string, fallback?: string, vars?: Record<string, unknown>) => string;
}

export default function ChatTab({
  classroomUid,
  t,
}: ChatTabProps) {
  const [conversationUid, setConversationUid] = useState<string | null>(null);

  // Load or create conversation on mount (tab only mounts while chat is active)
  useEffect(() => {
    if (conversationUid) return;
    chatApi
      .getConversations(classroomUid)
      .then((convs) => {
        if (convs && convs.length > 0) {
          setConversationUid(convs[0].uid);
        } else {
          return chatApi.getConversations(classroomUid).then((created) => {
            if (created && created.length > 0) {
              setConversationUid(created[0].uid);
            }
          });
        }
      })
      .catch(() => {
        toast.error(t('classroom.messages.chat_load_error'));
      });
  }, [classroomUid, conversationUid, t]);

  return (
    <div className="bg-card rounded-[32px] overflow-hidden shadow-sm h-[calc(100vh-260px)] flex flex-col">
      {conversationUid ? (
        <ClassroomChatPanel
          conversationUid={conversationUid}
          classroomUid={classroomUid}
          active={true}
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
