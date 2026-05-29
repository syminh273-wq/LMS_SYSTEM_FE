'use client';

import * as React from 'react';
import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { socialApi } from '@/lib/api/social';
import { accountService } from '@/lib/api/account';
import type { Post, PostComment, PostEmotion, PostVisibility } from '@/lib/api/types';
import {
  Users, Loader2, ChevronDown,
  Home, BookOpen, User,
} from 'lucide-react';
import { toast } from 'sonner';
import { CreatePost } from './CreatePost';
import { PostCard } from './PostCard';

// ── Main Feed Page ────────────────────────────────────────────────────────────

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
  }, [router, fetchFeed]); // Removed feedTab from dependency to avoid double fetch if init handles it

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
        : await socialApi.getFollowingFeed(PAGE); // Note: Following feed might not support 'before' yet but good for consistency
      setPosts(prev => [...prev, ...more]);
      setHasMore(more.length === PAGE);
    } catch { }
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
    <div className="min-h-screen bg-gray-50">
      {/* Top nav */}
      <header className="sticky top-0 z-30 bg-white border-b border-gray-100 shadow-sm">
        <div className="max-w-2xl mx-auto flex items-center justify-between px-4 h-14">
          <Image src="/logo.jpg" alt="LMS" width={80} height={28} className="h-7 w-auto object-contain cursor-pointer" onClick={() => router.push('/consumer/dashboard')} />
          <nav className="flex items-center gap-1">
            <button onClick={() => router.push('/consumer/dashboard')}
              className="flex flex-col items-center px-5 py-1 text-gray-400 hover:text-indigo-600 transition-colors">
              <Home size={22} />
            </button>
            <button className="flex flex-col items-center px-5 py-1 text-indigo-600 border-b-2 border-indigo-600">
              <Users size={22} />
            </button>
            <button onClick={() => router.push('/consumer/classroom')}
              className="flex flex-col items-center px-5 py-1 text-gray-400 hover:text-indigo-600 transition-colors">
              <BookOpen size={22} />
            </button>
            <button onClick={() => router.push('/consumer/profile')}
              className="flex flex-col items-center px-5 py-1 text-gray-400 hover:text-indigo-600 transition-colors">
              <User size={22} />
            </button>
          </nav>
        </div>
      </header>

      {/* Feed */}
      <main className="max-w-2xl mx-auto px-4 py-4 space-y-3">
        {/* Tabs */}
        <div className="flex bg-white rounded-2xl p-1 border border-gray-100 shadow-sm">
          <button
            onClick={() => handleTabChange('all')}
            className={`flex-1 py-2 text-sm font-bold rounded-xl transition-all ${
              feedTab === 'all' ? 'bg-indigo-600 text-white shadow-md' : 'text-gray-500 hover:bg-gray-50'
            }`}
          >
            Tất cả
          </button>
          <button
            onClick={() => handleTabChange('following')}
            className={`flex-1 py-2 text-sm font-bold rounded-xl transition-all ${
              feedTab === 'following' ? 'bg-indigo-600 text-white shadow-md' : 'text-gray-500 hover:bg-gray-50'
            }`}
          >
            Đang theo dõi
          </button>
        </div>

        <CreatePost profile={profile} onCreated={handleCreated} />

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 size={36} className="animate-spin text-indigo-400" />
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl border border-gray-100 shadow-sm">
            <div className="text-5xl mb-4">📭</div>
            <p className="font-bold text-gray-900 text-lg">Chưa có bài đăng nào</p>
            <p className="text-sm text-gray-500 mt-1">Hãy là người đầu tiên chia sẻ điều gì đó!</p>
          </div>
        ) : (
          <>
            {posts.map(post => (
              <PostCard
                key={post.uid}
                post={post}
                currentUserId={profile?.uid ?? null}
                onLike={handleLike}
                onDelete={handleDelete}
              />
            ))}
            {hasMore && (
              <div className="flex justify-center py-4">
                <button onClick={loadMore} disabled={loadingMore}
                  className="flex items-center gap-2 px-6 py-2.5 bg-white border border-gray-200 rounded-full text-sm font-bold text-gray-600 hover:bg-gray-50 shadow-sm transition-all disabled:opacity-60">
                  {loadingMore ? <Loader2 size={16} className="animate-spin" /> : <ChevronDown size={16} />}
                  Xem thêm
                </button>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
