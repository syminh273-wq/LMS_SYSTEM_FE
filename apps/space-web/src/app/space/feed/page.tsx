'use client';

import * as React from 'react';
import { Button } from '@shared/components/ui/button';
import { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useSelector } from 'react-redux';
import { socialApi } from '@/lib/api/social';
import type { Post } from '@/lib/api/types';
import type { RootState } from '@/lib/redux/store';
import { Loader2, ChevronDown, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { CreatePost } from './CreatePost';
import { PostCard } from './PostCard';
import { ConnectSuggestions } from './ConnectSuggestions';
import { WorkspaceShell } from '@/components/WorkspaceShell';
import { FeedLeftSidebar } from './FeedLeftSidebar';
import { Skeleton } from '@shared/components/ui/skeleton';

export default function FeedPage() {
  const router = useRouter();
  const account = useSelector((s: RootState) => s.user.profile);
  const workspace = useSelector((s: RootState) => s.socialProfile.profile);
  const [mounted, setMounted] = useState(false);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const PAGE = 15;

  const profile = useMemo(() => {
    if (!account) return null;
    return {
      full_name: account.full_name,
      avatar_url: workspace?.avatar_url || account.avatar_url || '',
      uid: String(account.uid),
      email: account.email,
      username: account.username,
      created_at: account.created_at,
    };
  }, [account, workspace]);
  const followingCount = workspace?.following_count ?? 0;

  const fetchFeed = useCallback(async () => {
    setLoading(true);
    try {
      const feed = await socialApi.getFeed(PAGE);
      setPosts(feed);
      setHasMore(feed.length === PAGE);
    } catch { toast.error('Không thể tải feed'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
    if (!localStorage.getItem('accessToken')) { router.push('/space/login'); return; }
    fetchFeed();
  }, [router, fetchFeed]);

  const loadMore = async () => {
    if (loadingMore || !hasMore || posts.length === 0) return;
    setLoadingMore(true);
    try {
      const before = posts[posts.length - 1].created_at;
      const more = await socialApi.getFeed(PAGE, before);
      setPosts(prev => [...prev, ...more]);
      setHasMore(more.length === PAGE);
    } catch {}
    finally { setLoadingMore(false); }
  };

  const handleLike = (uid: string, liked: boolean, count: number) => {
    setPosts(prev => prev.map(p => p.uid === uid ? { ...p, liked_by_me: liked, likes_count: count } : p));
  };
  const handleDelete = (uid: string) => setPosts(prev => prev.filter(p => p.uid !== uid));
  const handleCreated = (post: Post) => setPosts(prev => [post, ...prev]);

  if (!mounted) return null;

  return (
    <WorkspaceShell>
      <div className="mx-auto w-full max-w-[90vw] grid grid-cols-1 lg:grid-cols-[280px_minmax(0,1fr)_300px] gap-6 py-6 sm:py-8">
        {profile ? (
          <FeedLeftSidebar profile={profile} followingCount={followingCount} />
        ) : (
          <aside className="hidden lg:block lg:col-start-1 space-y-4">
            <Skeleton className="h-56 rounded-xl" />
            <Skeleton className="h-40 rounded-xl" />
          </aside>
        )}

        <div className="space-y-4 sm:space-y-5 min-w-0 lg:col-start-2">
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
              <p className="text-[13px] text-slate-500 mt-1">Hãy là người đầu tiên chia sẻ!</p>
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
                  <Button
                    onClick={loadMore}
                    disabled={loadingMore}
                    className="inline-flex items-center gap-1.5 px-5 h-10 bg-white border border-slate-200 rounded-full text-[13px] font-semibold text-slate-600 hover:bg-slate-50 transition-colors disabled:opacity-60"
                  >
                    {loadingMore ? <Loader2 size={14} className="animate-spin" /> : <ChevronDown size={14} />}
                    Xem thêm
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>

        <ConnectSuggestions />
      </div>
    </WorkspaceShell>
  );
}
