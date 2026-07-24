'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, MessageCircle } from 'lucide-react';
import { useSelector } from 'react-redux';
import { toast } from 'sonner';
import { communityApi, type DirectConversation } from '@/lib/api/community';
import { useTranslation } from '@shared/components/LocaleProvider';
import { WorkspaceShell } from '@/components/WorkspaceShell';
import { cn } from '@shared/lib/utils';
import type { RootState } from '@/lib/redux/store';

function timeAgo(iso: string | null): string {
  if (!iso) return '';
  const d = Date.now() - new Date(iso).getTime();
  const m = Math.floor(d / 60000);
  if (m < 1) return 'Vừa xong';
  if (m < 60) return `${m} phút`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} giờ`;
  return `${Math.floor(h / 24)} ngày`;
}

export default function MessagesPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const [list, setList] = useState<DirectConversation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
    if (!token) {
      router.replace('/space/login');
      return;
    }
    communityApi.listDirectConversations()
      .then(setList)
      .catch(() => toast.error(t('workspace.messages.load_error')))
      .finally(() => setLoading(false));
  }, [router, t]);

  return (
    <WorkspaceShell>
      <div className="max-w-[75vw] mx-auto">
        <div className="flex items-center gap-2 mb-4">
          <MessageCircle size={22} className="text-indigo-600" />
          <h1 className="text-2xl font-bold text-slate-900">{t('workspace.messages.title')}</h1>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="animate-spin text-indigo-600" size={28} />
            </div>
          ) : list.length === 0 ? (
            <div className="text-center py-16 px-4">
              <div className="w-16 h-16 mx-auto mb-3 rounded-2xl bg-slate-100 flex items-center justify-center">
                <MessageCircle size={28} className="text-slate-400" />
              </div>
              <p className="font-semibold text-slate-900 text-[15px]">{t('workspace.messages.empty_list')}</p>
              <p className="text-[13px] text-slate-500 mt-1">{t('workspace.messages.empty_list_desc')}</p>
            </div>
          ) : (
            <ul>
              {list.map((c) => (
                <li
                  key={c.conversation_uid}
                  onClick={() => router.push(`/space/messages/c/${c.conversation_uid}`)}
                  className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50 cursor-pointer border-b border-slate-100 last:border-b-0 transition-colors"
                >
                  {c.other_user.avatar ? (
                    <img src={c.other_user.avatar} alt={c.other_user.name} className="w-12 h-12 rounded-full object-cover" />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center text-white font-black text-sm">
                      {(c.other_user.name || '??').slice(0, 2).toUpperCase()}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-semibold text-[14px] text-slate-900 truncate">
                        {c.other_user.name || 'User'}
                      </p>
                      {c.last_msg?.at && (
                        <span className="text-[11px] text-slate-400 shrink-0">{timeAgo(c.last_msg.at)}</span>
                      )}
                    </div>
                    <div className="flex items-center justify-between gap-2 mt-0.5">
                      <p className={cn(
                        "text-[12.5px] truncate",
                        c.unread_count > 0 ? "text-slate-900 font-semibold" : "text-slate-500"
                      )}>
                        {c.last_msg?.text || 'Chưa có tin nhắn'}
                      </p>
                      {c.unread_count > 0 && (
                        <span className="shrink-0 min-w-[20px] h-5 px-1.5 rounded-full bg-indigo-600 text-white text-[10px] font-black flex items-center justify-center">
                          {c.unread_count > 99 ? '99+' : c.unread_count}
                        </span>
                      )}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </WorkspaceShell>
  );
}
