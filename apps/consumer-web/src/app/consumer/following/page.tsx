'use client';

import { useEffect, useMemo, useState } from 'react';
import { Button } from '@shared/components/ui/button';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Loader2, Mail, Search, UserCheck, X } from 'lucide-react';
import { toast } from 'sonner';

import { WorkspaceShell } from '@/components/WorkspaceShell';
import { Avatar, AvatarFallback, AvatarImage } from '@shared/components/ui/avatar';
import { accountService, type UserProfile } from '@/lib/api/account';
import { socialApi } from '@/lib/api/social';
import { cn } from '@shared/lib/utils';

type FollowedUser = {
  consumer_uid: string;
  name: string;
  avatar: string;
  created_at?: string | null;
};

export default function FollowingPage() {
  const router = useRouter();
  const [me, setMe] = useState<UserProfile | null>(null);
  const [users, setUsers] = useState<FollowedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [count, setCount] = useState<number>(0);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!localStorage.getItem('accessToken')) {
      router.replace('/auth/login');
      return;
    }
    let mounted = true;
    (async () => {
      try {
        const prof = await accountService.getProfile();
        if (!mounted) return;
        setMe(prof);
        const list = (await socialApi.getFollowing(String(prof.uid), 100)) as FollowedUser[];
        if (!mounted) return;
        setUsers(Array.isArray(list) ? list : []);
        setCount(Array.isArray(list) ? list.length : 0);
      } catch (err) {
        console.error(err);
        setError('Không thể tải danh sách đang theo dõi');
        toast.error('Lỗi khi tải đang theo dõi');
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [router]);

  const filtered = useMemo(() => {
    if (!query.trim()) return users;
    const q = query.trim().toLowerCase();
    return users.filter((u) => (u.name || '').toLowerCase().includes(q));
  }, [users, query]);

  const handleUnfollow = async (targetUid: string) => {
    setPendingId(targetUid);
    try {
      await socialApi.toggleFollow(targetUid);
      setUsers((prev) => prev.filter((u) => u.consumer_uid !== targetUid));
      setCount((c) => Math.max(0, c - 1));
      window.dispatchEvent(
        new CustomEvent('community:profile-updated', { detail: { following_count_delta: -1 } }),
      );
      toast.success('Đã hủy theo dõi');
    } catch {
      toast.error('Thao tác thất bại');
    } finally {
      setPendingId(null);
    }
  };

  const handleMessage = (uid: string) => {
    router.push(`/consumer/messages/${uid}`);
  };

  return (
    <WorkspaceShell>
      <div className="mx-auto w-full max-w-2xl py-6 sm:py-8">
        <div className="mb-4 flex items-center gap-3">
          <Button
            onClick={() => router.back()}
            className="h-9 w-9 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-50 transition-colors"
            aria-label="Quay lại"
          >
            <ArrowLeft size={16} />
          </Button>
          <div className="flex-1 min-w-0">
            <h1 className="text-[20px] font-bold text-slate-900 flex items-center gap-2">
              <UserCheck size={18} className="text-indigo-600" />
              Đang theo dõi
            </h1>
            <p className="text-[12.5px] text-slate-500">
              {me ? `${me.full_name || me.username || 'Bạn'} · ` : ''}
              {count} người
            </p>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl card-elevated overflow-hidden">
          <div className="p-3 border-b border-slate-200">
            <div className="relative">
              <Search
                size={14}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
              />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Tìm trong danh sách..."
                className="w-full h-10 pl-9 pr-9 rounded-lg bg-slate-50 border border-slate-200 text-[13.5px] outline-none focus:bg-white focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100 transition-colors"
              />
              {query && (
                <Button
                  onClick={() => setQuery('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 h-6 w-6 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 flex items-center justify-center"
                  aria-label="Xóa"
                >
                  <X size={12} />
                </Button>
              )}
            </div>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <Loader2 size={24} className="animate-spin text-indigo-600" />
              <p className="text-[12.5px] text-slate-500">Đang tải...</p>
            </div>
          ) : error ? (
            <div className="py-16 text-center">
              <p className="text-[13.5px] text-slate-600 mb-3">{error}</p>
              <Button
                onClick={() => window.location.reload()}
                className="inline-flex items-center h-9 px-4 rounded-full bg-indigo-600 text-white text-[12.5px] font-semibold hover:bg-indigo-700"
              >
                Thử lại
              </Button>
            </div>
          ) : users.length === 0 ? (
            <div className="py-16 text-center px-6">
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-slate-100 flex items-center justify-center">
                <UserCheck size={28} className="text-slate-400" />
              </div>
              <p className="font-semibold text-slate-900 text-[15px]">Bạn chưa theo dõi ai</p>
              <p className="text-[13px] text-slate-500 mt-1 mb-4">
                Khám phá những người bạn có thể quan tâm.
              </p>
              <Link
                href="/consumer/feed"
                className="inline-flex items-center h-10 px-5 rounded-full bg-indigo-600 text-white text-[13px] font-semibold hover:bg-indigo-700"
              >
                Khám phá gợi ý
              </Link>
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-12 text-center text-[13px] text-slate-500">
              Không tìm thấy kết quả cho &ldquo;{query}&rdquo;
            </div>
          ) : (
            <ul className="divide-y divide-slate-100">
              {filtered.map((u) => {
                const isPending = pendingId === u.consumer_uid;
                const initials = (u.name || '?').slice(0, 2).toUpperCase();
                return (
                  <li
                    key={u.consumer_uid}
                    className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50 transition-colors"
                  >
                    <Link
                      href={`/consumer/profile/${u.consumer_uid}`}
                      className="flex items-center gap-3 flex-1 min-w-0"
                    >
                      <Avatar className="h-11 w-11 ring-2 ring-white shadow-sm shrink-0">
                        <AvatarImage src={u.avatar || ''} alt={u.name} />
                        <AvatarFallback className="bg-gradient-to-br from-indigo-600 to-violet-600 text-[12px] font-black text-white">
                          {initials}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 flex-1">
                        <p className="text-[14px] font-semibold text-slate-900 truncate">
                          {u.name || 'Người dùng'}
                        </p>
                        <p className="text-[11.5px] text-slate-500 truncate">
                          Học sinh
                        </p>
                      </div>
                    </Link>
                    <div className="flex items-center gap-2 shrink-0">
                      <Button
                        onClick={() => handleMessage(u.consumer_uid)}
                        className="inline-flex items-center gap-1.5 h-9 px-3 rounded-full border border-slate-200 text-[12.5px] font-semibold text-slate-700 hover:bg-slate-50 hover:text-indigo-600 transition-colors"
                        title="Nhắn tin"
                      >
                        <Mail size={13} />
                        <span className="hidden sm:inline">Nhắn tin</span>
                      </Button>
                      <Button
                        onClick={() => handleUnfollow(u.consumer_uid)}
                        disabled={isPending}
                        className={cn(
                          'inline-flex items-center gap-1.5 h-9 px-3 rounded-full text-[12.5px] font-semibold transition-colors disabled:opacity-60',
                          'bg-indigo-50 text-indigo-700 hover:bg-rose-50 hover:text-rose-600',
                        )}
                        title="Bỏ theo dõi"
                      >
                        {isPending ? (
                          <Loader2 size={13} className="animate-spin" />
                        ) : (
                          <UserCheck size={13} />
                        )}
                        <span className="hidden sm:inline">
                          {isPending ? 'Đang xử lý' : 'Đang theo dõi'}
                        </span>
                      </Button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </WorkspaceShell>
  );
}
