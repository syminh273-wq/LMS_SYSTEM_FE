'use client';

import { useEffect, useState, useCallback } from 'react';
import { Loader2, Plus, Sparkles, X } from 'lucide-react';
import { toast } from 'sonner';
import { socialApi } from '@/lib/api/social';
import type { Post } from '@/lib/api/types';
import { CreatePost } from '@/app/consumer/feed/CreatePost';
import { PostCard } from '@/app/consumer/feed/PostCard';

type ProfileLite = {
  uid: string;
  full_name: string;
  avatar_url: string;
};

const PAGE = 10;

type Props = {
  profile: ProfileLite;
  onCountChange?: (count: number) => void;
};

export function MyPostsSection({ profile, onCountChange }: Props) {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [composerOpen, setComposerOpen] = useState(false);

  const fetchPosts = useCallback(async () => {
    setLoading(true);
    try {
      const list = await socialApi.getMyPosts(PAGE);
      setPosts(list);
      setHasMore(list.length === PAGE);
      onCountChange?.(list.length);
    } catch {
      toast.error('Không thể tải bài đăng');
    } finally {
      setLoading(false);
    }
  }, [onCountChange]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchPosts();
  }, [fetchPosts]);

  const loadMore = async () => {
    if (loadingMore || !hasMore || posts.length === 0) return;
    setLoadingMore(true);
    try {
      const before = posts[posts.length - 1].created_at;
      const more = await socialApi.getMyPosts(PAGE, before);
      setPosts((prev) => [...prev, ...more]);
      setHasMore(more.length === PAGE);
    } catch {
      toast.error('Không thể tải thêm bài đăng');
    } finally {
      setLoadingMore(false);
    }
  };

  const handleLike = (uid: string, liked: boolean, count: number) => {
    setPosts((prev) =>
      prev.map((p) => (p.uid === uid ? { ...p, liked_by_me: liked, likes_count: count } : p)),
    );
  };

  const handleDelete = (uid: string) => {
    setPosts((prev) => prev.filter((p) => p.uid !== uid));
  };

  const handleCreated = (post: Post) => {
    setPosts((prev) => [post, ...prev]);
    setComposerOpen(false);
  };

  return (
    <section className="space-y-3">
      {composerOpen && (
        <div className="bg-white rounded-lg border border-slate-200 p-6">
          <CreatePost
            profile={{ full_name: profile.full_name, avatar_url: profile.avatar_url }}
            onCreated={handleCreated}
          />
        </div>
      )}

      {!composerOpen && (
        <div className="flex items-center justify-end">
          <button
            type="button"
            onClick={() => setComposerOpen(true)}
            className="inline-flex items-center gap-1.5 px-4 h-10 bg-white border border-slate-200 rounded-full text-[13px] font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
          >
            <Plus className="size-4" />
            Tạo bài đăng
          </button>
        </div>
      )}

      {loading ? (
        <div className="flex flex-col items-center justify-center py-16 gap-3">
          <Loader2 size={24} className="animate-spin text-indigo-600" />
          <p className="text-[12.5px] text-slate-500">Đang tải bài đăng...</p>
        </div>
      ) : posts.length === 0 ? (
        <div className="text-center py-12 bg-slate-50 border border-dashed border-slate-200 rounded-xl">
          <div className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-white flex items-center justify-center">
            <Sparkles size={24} className="text-slate-400" />
          </div>
          <p className="font-semibold text-slate-900 text-[14px]">Chưa có bài đăng nào</p>
          <p className="text-[12.5px] text-slate-500 mt-1">Nhấn "Tạo bài đăng" để chia sẻ bài đăng đầu tiên.</p>
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
                currentUserId={profile.uid}
                onLike={handleLike}
                onDelete={handleDelete}
              />
            </div>
          ))}
          {hasMore && (
            <div className="flex justify-center pt-2">
              <button
                type="button"
                onClick={loadMore}
                disabled={loadingMore}
                className="inline-flex items-center gap-1.5 px-5 h-10 bg-white border border-slate-200 rounded-full text-[13px] font-semibold text-slate-600 hover:bg-slate-50 transition-colors disabled:opacity-60"
              >
                {loadingMore ? <Loader2 size={14} className="animate-spin" /> : null}
                Xem thêm
              </button>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
