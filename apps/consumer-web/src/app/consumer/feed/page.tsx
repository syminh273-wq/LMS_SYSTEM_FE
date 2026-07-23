'use client';

import * as React from 'react';
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { socialApi } from '@/lib/api/social';
import { accountService } from '@/lib/api/account';
import type { Post } from '@/lib/api/types';
import { Users, Loader2, ChevronDown, Sparkles, TrendingUp } from 'lucide-react';
import { toast } from 'sonner';
import { CreatePost } from './CreatePost';
import { PostCard } from './PostCard';
import { cn } from '@shared/lib/utils';
import { WorkspaceShell } from '@/components/WorkspaceShell';

export default function FeedPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [profile, setProfile] = useState<{ full_name: string; avatar_url: string; uid: string } | null>(null);
  const [feedTab, setFeedTab] = useState<'all' | 'following'>('all');
  const PAGE = 15;

  const fetchFeed = useCallback(async (tab: 'all' | 'following') => {
    setLoading(true);
    try {
      const feed = tab === 'all'
        ? await socialApi.getFeed(PAGE)
        : await socialApi.getFollowingFeed(PAGE);
      setPosts(feed);
      setHasMore(feed.length === PAGE);
    } catch { toast.error('Không thể tải feed'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
    if (!localStorage.getItem('accessToken')) { router.push('/consumer/login'); return; }
    const init = async () => {
      try {
        const prof = await accountService.getProfile();
        setProfile({ full_name: prof.full_name, avatar_url: prof.avatar_url, uid: String(prof.uid) });
        await fetchFeed(feedTab);
      } catch { toast.error('Lỗi khởi tạo'); }
    };
    init();
  }, [router, fetchFeed]);

  const handleTabChange = (tab: 'all' | 'following') => {
    if (tab === feedTab) return;
    setFeedTab(tab);
    fetchFeed(tab);
  };

  const loadMore = async () => {
    if (loadingMore || !hasMore || posts.length === 0) return;
    setLoadingMore(true);
    try {
      const before = posts[posts.length - 1].created_at;
      const more = feedTab === 'all'
        ? await socialApi.getFeed(PAGE, before)
        : await socialApi.getFollowingFeed(PAGE);
      setPosts(prev => [...prev, ...more]);
      setHasMore(more.length === PAGE);
    } catch (err: unknown) { void err; }
    finally { setLoadingMore(false); }
  };

  const handleLike = (uid: string, liked: boolean, count: number) => {
    setPosts(prev => prev.map(p => p.uid === uid ? { ...p, liked_by_me: liked, likes_count: count } : p));
  };

  const handleDelete = (uid: string) => {
    setPosts(prev => prev.filter(p => p.uid !== uid));
  };

  const handleCreated = (post: Post) => {
    setPosts(prev => [post, ...prev]);
  };

  if (!mounted) return null;

  return (
    <WorkspaceShell>
      <div className="max-w-2xl mx-auto px-4 sm:px-0 py-6 sm:py-8 space-y-4 sm:space-y-5">
        <div className="px-1">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-700 text-[11px] font-semibold mb-2">
            <Sparkles size={11} />
            Cộng đồng
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight text-balance">Bảng tin</h1>
          <p className="text-slate-600 text-[14px] mt-1">Cập nhật từ bạn bè và lớp học của bạn</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-1 flex card-elevated">
          {[
            { key: 'all' as const, label: 'Tất cả', icon: TrendingUp },
            { key: 'following' as const, label: 'Đang theo dõi', icon: Users },
          ].map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => handleTabChange(key)}
              className={cn(
                "flex-1 flex items-center justify-center gap-1.5 py-2 text-[13px] font-semibold rounded-lg transition-colors",
                feedTab === key
                  ? "bg-indigo-600 text-white"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
              )}
            >
              <Icon size={14} strokeWidth={2.2} />
              {label}
            </button>
          ))}
        </div>

        <CreatePost profile={profile} onCreated={handleCreated} />

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <Loader2 size={28} className="animate-spin text-indigo-600" />
            <p className="text-[12.5px] text-slate-500">Đang tải bảng tin...</p>
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-20 bg-white border-2 border-dashed border-slate-200 rounded-xl">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-slate-100 flex items-center justify-center">
              <Sparkles size={28} className="text-slate-400" />
            </div>
            <p className="font-semibold text-slate-900 text-[15px]">Chưa có bài đăng nào</p>
            <p className="text-[13px] text-slate-500 mt-1">Hãy là người đầu tiên chia sẻ điều gì đó!</p>
          </div>
        ) : (
          <div className="space-y-3 sm:space-y-4">
            {posts.map((post, idx) => (
              <div
                key={post.uid}
                style={{ animationDelay: `${Math.min(idx, 5) * 40}ms` }}
                className="animate-fade-up"
              >
                <PostCard
                  post={post}
                  currentUserId={profile?.uid ?? null}
                  onLike={handleLike}
                  onDelete={handleDelete}
                />
              </div>
            ))}
            {hasMore && (
              <div className="flex justify-center pt-2">
                <button
                  onClick={loadMore}
                  disabled={loadingMore}
                  className="inline-flex items-center gap-1.5 px-5 h-10 bg-white border border-slate-200 rounded-full text-[13px] font-semibold text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors disabled:opacity-60"
                >
                  {loadingMore ? <Loader2 size={14} className="animate-spin" /> : <ChevronDown size={14} />}
                  Xem thêm
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </WorkspaceShell>
  );
}
