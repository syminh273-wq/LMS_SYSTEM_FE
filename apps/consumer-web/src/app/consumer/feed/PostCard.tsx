'use client';

import * as React from 'react';
import { useState } from 'react';
import { socialApi } from '@/lib/api/social';
import type { Post, PostComment, PostEmotion, PostVisibility } from '@/lib/api/types';
import {
  Heart, MessageCircle, Share2, Globe, Lock, Users,
  Send, Loader2, Trash2, MoreHorizontal,
} from 'lucide-react';
import { toast } from 'sonner';
import parse from 'html-react-parser';

const EMOTIONS = [
  { key: 'happy',       emoji: '😊', label: 'Đang vui' },
  { key: 'sad',         emoji: '😢', label: 'Buồn' },
  { key: 'motivated',   emoji: '💪', label: 'Cố lên' },
  { key: 'excited',     emoji: '🔥', label: 'Hào hứng' },
  { key: 'tired',       emoji: '😴', label: 'Mệt mỏi' },
  { key: 'thinking',    emoji: '🤔', label: 'Suy nghĩ' },
  { key: 'confident',   emoji: '😎', label: 'Tự tin' },
  { key: 'celebrating', emoji: '🎉', label: 'Ăn mừng' },
  { key: 'stressed',    emoji: '😤', label: 'Căng thẳng' },
  { key: 'loved',       emoji: '❤️', label: 'Yêu thương' },
];

const EMOTION_MAP = Object.fromEntries(EMOTIONS.map(e => [e.key, e]));

const VISIBILITY_OPTIONS = [
  { key: 'public',  icon: Globe,  label: 'Công khai' },
  { key: 'friends', icon: Users,  label: 'Bạn bè' },
  { key: 'private', icon: Lock,   label: 'Chỉ mình tôi' },
];

function timeAgo(iso: string) {
  const d = Date.now() - new Date(iso).getTime();
  const m = Math.floor(d / 60000);
  if (m < 1) return 'Vừa xong';
  if (m < 60) return `${m} phút trước`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} giờ trước`;
  return `${Math.floor(h / 24)} ngày trước`;
}

export function PostCard({
  post,
  currentUserId,
  onLike,
  onDelete,
}: {
  post: Post;
  currentUserId: string | null;
  onLike: (uid: string, liked: boolean, count: number) => void;
  onDelete: (uid: string) => void;
}) {
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState<PostComment[]>([]);
  const [loadingComments, setLoadingComments] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const isMe = currentUserId === post.consumer_uid;
  const emotion = post.emotion ? EMOTION_MAP[post.emotion] : null;
  const VisIcon = VISIBILITY_OPTIONS.find(v => v.key === post.visibility)?.icon ?? Globe;

  const loadComments = async () => {
    if (loadingComments) return;
    setLoadingComments(true);
    try {
      const data = await socialApi.getComments(post.uid);
      setComments(data);
    } catch { toast.error('Không thể tải bình luận'); }
    finally { setLoadingComments(false); }
  };

  const toggleComments = () => {
    setShowComments(prev => {
      if (!prev && comments.length === 0) loadComments();
      return !prev;
    });
  };

  const handleLike = async () => {
    try {
      const res = await socialApi.toggleLike(post.uid);
      onLike(post.uid, res.liked, res.likes_count);
    } catch { toast.error('Thao tác thất bại'); }
  };

  const handleComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || submitting) return;
    setSubmitting(true);
    try {
      const c = await socialApi.addComment(post.uid, newComment.trim());
      setComments(prev => [...prev, c]);
      setNewComment('');
    } catch { toast.error('Không thể gửi bình luận'); }
    finally { setSubmitting(false); }
  };

  const handleDelete = async () => {
    if (!confirm('Xóa bài đăng này?')) return;
    try {
      await socialApi.deletePost(post.uid);
      onDelete(post.uid);
      toast.success('Đã xóa bài đăng');
    } catch { toast.error('Không thể xóa'); }
  };

  return (
    <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
      <div className="flex items-start justify-between p-4 pb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-accent flex items-center justify-center text-accent-foreground font-black text-sm shrink-0 overflow-hidden">
            {post.author_avatar
              ? <img src={post.author_avatar} alt="" className="w-full h-full object-cover" />
              : post.author_name.slice(0, 2).toUpperCase()
            }
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <p className="text-sm font-bold text-foreground leading-none">{post.author_name || 'Ẩn danh'}</p>
              {emotion && (
                <span className="text-xs text-muted-foreground">đang {emotion.label} {emotion.emoji}</span>
              )}
            </div>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="text-[11px] text-muted-foreground">{timeAgo(post.created_at)}</span>
              <span className="text-border">·</span>
              <VisIcon size={11} className="text-muted-foreground" />
            </div>
          </div>
        </div>

        {isMe && (
          <div className="relative">
            <button onClick={() => setMenuOpen(p => !p)} className="p-1.5 rounded-full hover:bg-accent transition-colors">
              <MoreHorizontal size={18} className="text-muted-foreground" />
            </button>
            {menuOpen && (
              <div className="absolute right-0 top-8 bg-card border border-border rounded-xl shadow-lg p-1 z-10 w-36">
                <button onClick={() => { setMenuOpen(false); handleDelete(); }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-500 hover:bg-red-500/10 rounded-lg">
                  <Trash2 size={14} /> Xóa bài
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {post.content && (
        <div className="px-4 pb-3 text-sm text-foreground leading-relaxed prose dark:prose-invert max-w-none">
          {parse(post.content)}
        </div>
      )}

      {post.image_url && (
        <div className="mx-4 mb-3 rounded-xl overflow-hidden bg-accent/20">
          <img src={post.image_url} alt="" className="w-full max-h-96 object-cover" />
        </div>
      )}

      {(post.likes_count > 0 || post.comments_count > 0) && (
        <div className="flex items-center justify-between px-4 py-2 text-xs text-muted-foreground border-t border-border/50">
          {post.likes_count > 0 && (
            <span className="flex items-center gap-1">
              <span className="w-4 h-4 bg-rose-500 rounded-full flex items-center justify-center text-white text-[8px]">♥</span>
              {post.likes_count}
            </span>
          )}
          {post.comments_count > 0 && (
            <button onClick={toggleComments} className="hover:underline ml-auto">
              {post.comments_count} bình luận
            </button>
          )}
        </div>
      )}

      <div className="flex border-t border-border mx-4">
        <button
          onClick={handleLike}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-sm font-medium transition-colors ${
            post.liked_by_me ? 'text-rose-500' : 'text-muted-foreground hover:bg-accent'
          }`}
        >
          <Heart size={18} fill={post.liked_by_me ? 'currentColor' : 'none'} />
          Thích
        </button>
        <button
          onClick={toggleComments}
          className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:bg-accent transition-colors"
        >
          <MessageCircle size={18} />
          Bình luận
        </button>
        <button className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:bg-accent transition-colors">
          <Share2 size={18} />
          Chia sẻ
        </button>
      </div>

      {showComments && (
        <div className="border-t border-border p-4 space-y-3">
          {loadingComments ? (
            <div className="flex justify-center py-4">
              <Loader2 size={20} className="animate-spin text-primary" />
            </div>
          ) : (
            comments.map(c => (
              <div key={c.uid} className="flex items-start gap-2.5">
                <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center text-accent-foreground font-bold text-xs shrink-0 overflow-hidden">
                  {c.author_avatar
                    ? <img src={c.author_avatar} alt="" className="w-full h-full object-cover" />
                    : c.author_name.slice(0, 2).toUpperCase()
                  }
                </div>
                <div className="bg-accent/50 rounded-2xl px-3 py-2 flex-1">
                  <p className="text-xs font-bold text-foreground">{c.author_name}</p>
                  <p className="text-sm text-foreground/90 mt-0.5">{c.content}</p>
                </div>
              </div>
            ))
          )}

          <form onSubmit={handleComment} className="flex items-center gap-2 mt-2">
            <input
              value={newComment}
              onChange={e => setNewComment(e.target.value)}
              placeholder="Viết bình luận..."
              className="flex-1 text-sm bg-accent/30 border border-border rounded-full px-4 py-2 outline-none focus:border-primary focus:bg-accent/50 transition-all text-foreground"
            />
            <button type="submit" disabled={!newComment.trim() || submitting}
              className="w-9 h-9 rounded-full bg-primary flex items-center justify-center text-primary-foreground disabled:opacity-40 hover:bg-primary/90 transition-colors">
              {submitting ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
