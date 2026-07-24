'use client';

import * as React from 'react';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Loader2, UserPlus, Check, User as UserIcon } from 'lucide-react';
import { toast } from 'sonner';
import { socialApi } from '@/lib/api/social';
import type { SuggestedUser } from '@/lib/api/types';
import { cn } from '@shared/lib/utils';

function roleLabel(role: string, kind?: 'consumer' | 'space') {
  if (kind === 'space' || role === 'teacher' || role === 'giáo viên') return 'Giáo viên';
  if (role === 'student') return 'Sinh viên';
  return role ? role.charAt(0).toUpperCase() + role.slice(1) : 'Thành viên';
}

export function ConnectSuggestions() {
  const [users, setUsers] = useState<SuggestedUser[]>([]);
  const [following, setFollowing] = useState<Record<string, boolean>>({});
  const [busy, setBusy] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await socialApi.getSuggestions(6);
        if (cancelled) return;
        setUsers(data?.results ?? []);
      } catch {
        if (!cancelled) return;
        setUsers([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const handleFollow = async (uid: string) => {
    if (busy[uid]) return;
    setBusy((b) => ({ ...b, [uid]: true }));
    const wasFollowing = Boolean(following[uid]);
    setFollowing((f) => ({ ...f, [uid]: !wasFollowing }));
    try {
      const res = await socialApi.toggleFollow(uid);
      setFollowing((f) => ({ ...f, [uid]: res.following }));
      toast.success(res.following ? 'Đã theo dõi' : 'Đã bỏ theo dõi');
    } catch {
      setFollowing((f) => ({ ...f, [uid]: wasFollowing }));
      toast.error('Không thể cập nhật');
    } finally {
      setBusy((b) => ({ ...b, [uid]: false }));
    }
  };

  return (
    <aside className="space-y-4 lg:sticky lg:top-20 lg:self-start">
      <div className="bg-white border border-slate-200 rounded-xl p-4 card-elevated">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-[13.5px] font-bold text-slate-900">Gợi ý kết nối</h3>
          <UserPlus size={14} className="text-indigo-600" />
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-6">
            <Loader2 size={18} className="animate-spin text-indigo-600" />
          </div>
        ) : users.length === 0 ? (
          <div className="py-6 text-center">
            <div className="w-10 h-10 mx-auto mb-2 rounded-xl bg-slate-100 flex items-center justify-center">
              <UserIcon size={18} className="text-slate-400" />
            </div>
            <p className="text-[12.5px] text-slate-500">Chưa có gợi ý mới</p>
          </div>
        ) : (
          <ul className="space-y-3">
            {users.map((u) => {
              const isFollowing = Boolean(following[u.consumer_uid]);
              const isBusy = Boolean(busy[u.consumer_uid]);
              const subtitle = u.major || u.department || roleLabel(u.role, u.kind);
              const consumerWebBase =
                process.env.NEXT_PUBLIC_CONSUMER_WEB_URL || 'http://localhost:3000';
              const profileHref =
                u.kind === 'space'
                  ? `/space/teachers/${u.consumer_uid}`
                  : `${consumerWebBase}/consumer/profile/${u.consumer_uid}`;
              const isExternal = u.kind !== 'space';
              const linkProps = isExternal
                ? { href: profileHref }
                : { href: profileHref, prefetch: false as const };
              return (
                <li key={u.consumer_uid} className="flex items-center gap-2.5">
                  <Link
                    {...linkProps}
                    className="shrink-0"
                    aria-label={`Xem trang của ${u.name || u.username}`}
                  >
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center text-white text-[12px] font-bold overflow-hidden">
                      {u.avatar ? (
                        <img src={u.avatar} alt="" className="w-full h-full object-cover" />
                      ) : (
                        (u.name || u.username || '?').slice(0, 2).toUpperCase()
                      )}
                    </div>
                  </Link>
                  <div className="min-w-0 flex-1">
                    <Link
                      {...linkProps}
                      className="block min-w-0"
                    >
                      <p className="text-[13px] font-semibold text-slate-900 truncate hover:underline flex items-center gap-1.5">
                        <span className="truncate">{u.name || u.username || 'Người dùng'}</span>
                        {u.kind === 'space' && (
                          <span className="inline-flex shrink-0 items-center px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-700 text-[9.5px] font-bold uppercase tracking-wider border border-indigo-100">
                            Giáo viên
                          </span>
                        )}
                      </p>
                      {subtitle && (
                        <p className="text-[11.5px] text-slate-500 truncate">{subtitle}</p>
                      )}
                    </Link>
                  </div>
                  <button
                    onClick={() => handleFollow(u.consumer_uid)}
                    disabled={isBusy}
                    className={cn(
                      'shrink-0 inline-flex items-center gap-1 px-2.5 h-8 rounded-full text-[11.5px] font-bold transition-colors disabled:opacity-50',
                      isFollowing
                        ? 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        : 'bg-indigo-600 text-white hover:bg-indigo-700'
                    )}
                    aria-label={isFollowing ? 'Đang theo dõi' : 'Theo dõi'}
                  >
                    {isBusy ? (
                      <Loader2 size={11} className="animate-spin" />
                    ) : isFollowing ? (
                      <Check size={11} />
                    ) : (
                      <UserPlus size={11} />
                    )}
                    <span>{isFollowing ? 'Đang theo dõi' : 'Theo dõi'}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </aside>
  );
}
