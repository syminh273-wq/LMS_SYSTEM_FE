'use client';

import { useEffect, useState, useCallback } from 'react';
import { Loader2, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { socialApi } from '@/lib/api/social';
import type { Post } from '@/lib/api/types';
import { PostCard } from '@/app/consumer/feed/PostCard';

type ProfileLite = {
  uid: string;
  full_name: string;
  avatar_url: string;
};

const PAGE = 10;

type Props = {
  profile: ProfileLite;
  currentUserId: string | null;
  onCountChange?: (count: number) => void;
};

export function UserPostsSection({ profile, currentUserId, onCountChange }: Props) {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPosts = useCallback(async () => {
    if (!profile.uid) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const list = await socialApi.getUserPosts(profile.uid, PAGE);
      setPosts(list);
      onCountChange?.(list.length);
    } catch {
      toast.error('Không thể tải bài đăng');
    } finally {
      setLoading(false);
    }
  }, [profile.uid, onCountChange]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchPosts();
  }, [fetchPosts]);

  const handleLike = (uid: string, liked: boolean, count: number) => {
    setPosts((prev) =>
      prev.map((p) => (p.uid === uid ? { ...p, liked_by_me: liked, likes_count: count } : p)),
    );
  };

  const handleDelete = (uid: string) => {
    setPosts((prev) => prev.filter((p) => p.uid !== uid));
  };

  if (loading) {
    return (
      <section className="space-y-3">
        <div className="flex flex-col items-center justify-center py-16 gap-3">
          <Loader2 size={24} className="animate-spin text-indigo-600" />
          <p className="text-[12.5px] text-slate-500">Đang tải bài đăng...</p>
        </div>
      </section>
    );
  }

  if (posts.length === 0) {
    return (
      <section className="space-y-3">
        <div className="text-center py-12 bg-slate-50 border border-dashed border-slate-200 rounded-xl">
          <div className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-white flex items-center justify-center">
            <Sparkles size={24} className="text-slate-400" />
          </div>
          <p className="font-semibold text-slate-900 text-[14px]">Chưa có bài đăng nào</p>
          <p className="text-[12.5px] text-slate-500 mt-1">Người dùng này chưa đăng bài viết nào.</p>
        </div>
      </section>
    );
  }

  return (
    <section className="space-y-3 sm:space-y-4">
      {posts.map((post, idx) => (
        <div
          key={post.uid}
          style={{ animationDelay: `${Math.min(idx, 5) * 40}ms` }}
          className="animate-fade-up"
        >
          <PostCard
            post={post}
            currentUserId={currentUserId}
            onLike={handleLike}
            onDelete={handleDelete}
          />
        </div>
      ))}
    </section>
  );
}
