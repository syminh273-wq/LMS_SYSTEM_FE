'use client';

import * as React from 'react';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { socialApi } from '@/lib/api/social';
import { classroomApi } from '@/lib/api/classroom';
import type { Post, PostComment, PostEmotion, PostVisibility } from '@/lib/api/types';
import {
  Heart, MessageCircle, Share2, Globe, Lock, Users,
  Send, Loader2, Trash2, MoreHorizontal, BookOpen, ExternalLink,
} from 'lucide-react';
import { toast } from 'sonner';
import parse from 'html-react-parser';
import { cn } from '@shared/lib/utils';
import { useImageLightbox, getPostImages } from '@shared/components/ui/image-lightbox';
import { PostImageGallery } from '@shared/components/ui/post-image-gallery';

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
] as const;

const EMOTION_MAP = Object.fromEntries(EMOTIONS.map(e => [e.key, e]));

const VISIBILITY_OPTIONS = [
  { key: 'public',  icon: Globe,  label: 'Công khai' },
  { key: 'friends', icon: Users,  label: 'Bạn bè' },
  { key: 'private', icon: Lock,   label: 'Chỉ mình tôi' },
] as const;

function timeAgo(iso: string) {
  const d = Date.now() - new Date(iso).getTime();
  const m = Math.floor(d / 60000);
  if (m < 1) return 'Vừa xong';
  if (m < 60) return `${m} phút trước`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} giờ trước`;
  return `${Math.floor(h / 24)} ngày trước`;
}

function formatFullDateTime(iso: string) {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '';
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

export function PostCard({
  post,
  currentUserId,
  onLike,
  onDelete,
  embedded = false,
}: {
  post: Post;
  currentUserId: string | null;
  onLike: (uid: string, liked: boolean, count: number) => void;
  onDelete: (uid: string) => void;
  embedded?: boolean;
}) {
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState<PostComment[]>([]);
  const [loadingComments, setLoadingComments] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [classroomNames, setClassroomNames] = useState<Record<string, string>>({});
  const lightbox = useImageLightbox();
  const postImages = getPostImages(post);
  const isMe = currentUserId === post.consumer_uid;

  useEffect(() => {
    const uids = Array.isArray(post.classroom_tag) ? post.classroom_tag : post.classroom_tag ? [post.classroom_tag] : [];
    const missing = uids.filter((u) => !classroomNames[u]);
    if (missing.length === 0) return;
    let cancelled = false;
    Promise.all(
      missing.map((u) =>
        classroomApi
          .retrieve(u)
          .then((c) => [u, c.name || c.title || 'Lớp học'] as const)
          .catch(() => [u, 'Lớp học'] as const)
      )
    ).then((entries) => {
      if (cancelled) return;
      setClassroomNames((prev) => ({ ...prev, ...Object.fromEntries(entries) }));
    });
    return () => { cancelled = true; };
  }, [post.classroom_tag, classroomNames]);
  const emotion = post.emotion ? EMOTION_MAP[post.emotion as keyof typeof EMOTION_MAP] : null;
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
    <article
      className={
        embedded
          ? 'bg-white rounded-xl overflow-hidden'
          : 'bg-white border border-slate-200 rounded-xl overflow-hidden card-elevated'
      }
    >
      <div className="flex items-start justify-between p-4 sm:p-5 pb-3">
        <div className="flex items-center gap-3 min-w-0">
          <AuthorLink post={post}>
            <div className="relative shrink-0">
              <div className="w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center text-white font-semibold text-[12px] overflow-hidden">
                {post.author_avatar
                  ? <img src={post.author_avatar} alt="" className="w-full h-full object-cover" />
                  : (post.author_name || '??').slice(0, 2).toUpperCase()
                }
              </div>
              <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 rounded-full border-2 border-white" />
            </div>
          </AuthorLink>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <AuthorLink post={post} className="min-w-0 max-w-full">
                <p className="text-[13.5px] font-semibold text-slate-900 leading-none truncate hover:underline">{post.author_name || 'Ẩn danh'}</p>
              </AuthorLink>
              {post.author_type === 'space' && (
                <span className="inline-flex items-center gap-0.5 text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-100">
                  Giáo viên
                </span>
              )}
              {emotion && (
                <span className="text-[11.5px] text-slate-500 inline-flex items-center gap-0.5">
                  đang {emotion.label.toLowerCase()} <span>{emotion.emoji}</span>
                </span>
              )}
            </div>
            <div className="flex items-center gap-1.5 mt-1">
              <span className="text-[11px] text-slate-500">{timeAgo(post.created_at)}</span>
              <span className="text-slate-300">·</span>
              <VisIcon size={11} className="text-slate-500" />
            </div>
          </div>
        </div>

        {isMe && (
          <div className="relative shrink-0">
            <button
              onClick={() => setMenuOpen(p => !p)}
              className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 transition-colors"
              aria-label="Tùy chọn"
            >
              <MoreHorizontal size={16} />
            </button>
            {menuOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
                <div className="absolute right-0 top-9 bg-white border border-slate-200 rounded-lg shadow-xl p-1 z-20 w-36 animate-fade-down">
                  <button
                    onClick={() => { setMenuOpen(false); handleDelete(); }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-[13px] font-medium text-rose-600 hover:bg-rose-50 rounded-md transition-colors"
                  >
                    <Trash2 size={13} /> Xóa bài
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {post.content && (
        <div className="px-4 sm:px-5 pb-3 text-[14px] text-slate-800 leading-relaxed prose prose-sm max-w-none">
          {parse(post.content)}
        </div>
      )}

      {postImages.length > 0 && (
        <div className="px-4 sm:px-5 pb-3">
          <PostImageGallery
            images={postImages}
            onImageClick={(idx) => lightbox.open(postImages, idx)}
          />
        </div>
      )}

      {(post.classroom_tag || []).length > 0 && (
        <div className="px-4 sm:px-5 pb-3 flex flex-wrap items-center gap-1.5">
          <span className="text-[11.5px] text-slate-500 font-medium inline-flex items-center gap-1">
            <BookOpen size={11} /> Chia sẻ với
          </span>
          {(Array.isArray(post.classroom_tag) ? post.classroom_tag : post.classroom_tag ? [post.classroom_tag] : []).map((uid) => {
            const name = classroomNames[uid] || 'Đang tải…';
            return (
              <a
                key={uid}
                href={`/consumer/classroom/preview/${uid}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-emerald-50 text-emerald-700 text-[12px] font-semibold border border-emerald-200 hover:bg-emerald-100 transition-colors"
              >
                <BookOpen size={11} />
                {name}
                <ExternalLink size={10} />
              </a>
            );
          })}
        </div>
      )}

      {(post.likes_count > 0 || post.comments_count > 0) && (
        <div className="flex items-center justify-between px-4 sm:px-5 py-2 text-xs text-slate-500 border-t border-slate-100">
          {post.likes_count > 0 && (
            <span className="flex items-center gap-1.5">
              <span className="w-4 h-4 bg-rose-500 rounded-full flex items-center justify-center text-white text-[9px]">
                <Heart size={9} fill="currentColor" strokeWidth={0} />
              </span>
              {post.likes_count}
            </span>
          )}
          {post.comments_count > 0 && (
            <button onClick={toggleComments} className="hover:text-slate-900 hover:underline ml-auto transition-colors">
              {post.comments_count} bình luận
            </button>
          )}
        </div>
      )}

      <div className="grid grid-cols-3 border-t border-slate-200">
        {[
          { key: 'like', icon: Heart, label: 'Thích', onClick: handleLike, active: post.liked_by_me, activeColor: 'text-rose-600' },
          { key: 'comment', icon: MessageCircle, label: 'Bình luận', onClick: toggleComments, active: false, activeColor: '' },
          { key: 'share', icon: Share2, label: 'Chia sẻ', onClick: () => {}, active: false, activeColor: '' },
        ].map(({ key, icon: Icon, label, onClick, active, activeColor }) => (
          <button
            key={key}
            onClick={onClick}
            className={cn(
              "flex items-center justify-center gap-1.5 py-2.5 text-[13px] font-medium transition-colors",
              active
                ? activeColor
                : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
            )}
          >
            <Icon size={16} strokeWidth={2} fill={active ? 'currentColor' : 'none'} />
            <span className="hidden sm:inline">{label}</span>
          </button>
        ))}
      </div>

      {lightbox.element}

      {showComments && (
        <div className="border-t border-slate-200 bg-slate-50 p-4 sm:p-5 space-y-3 animate-fade-down">
          {loadingComments ? (
            <div className="flex justify-center py-3">
              <Loader2 size={18} className="animate-spin text-indigo-600" />
            </div>
          ) : comments.length === 0 ? (
            <p className="text-center text-xs text-slate-500 py-2">Chưa có bình luận nào.</p>
          ) : (
            comments.map(c => {
              const isMine = currentUserId !== null && c.consumer_uid === currentUserId;
              return (
                <div key={c.uid} className={`flex items-start gap-2.5 ${isMine ? 'flex-row-reverse' : ''}`}>
                  <div className="w-7 h-7 rounded-full bg-indigo-600 flex items-center justify-center text-white font-bold text-[10px] shrink-0 overflow-hidden">
                    {c.author_avatar
                      ? <img src={c.author_avatar} alt="" className="w-full h-full object-cover" />
                      : (c.author_name || '??').slice(0, 2).toUpperCase()
                    }
                  </div>
                  <div className={`flex-1 min-w-0 ${isMine ? 'flex flex-col items-end' : ''}`}>
                    <div className={`rounded-2xl px-3 py-2 inline-block max-w-full ${
                      isMine
                        ? 'bg-indigo-600 text-white border border-indigo-600'
                        : 'bg-white border border-slate-200'
                    }`}>
                      <p className={`text-xs font-semibold leading-none mb-1 ${isMine ? 'text-indigo-100' : 'text-slate-900'}`}>{c.author_name}</p>
                      <p className={`text-[13px] break-words ${isMine ? 'text-white' : 'text-slate-800'}`}>{c.content}</p>
                    </div>
                    <p className={`text-[10px] text-slate-400 mt-1 px-1 ${isMine ? 'text-right' : 'text-left'}`}>
                      {formatFullDateTime(c.created_at)}
                    </p>
                  </div>
                </div>
              );
            })
          )}

          <form onSubmit={handleComment} className="flex items-center gap-2 pt-1">
            <div className="w-7 h-7 rounded-full bg-indigo-600 flex items-center justify-center text-white font-bold text-[10px] shrink-0">
              {currentUserId ? 'U' : '?'}
            </div>
            <div className="flex-1 relative">
              <input
                value={newComment}
                onChange={e => setNewComment(e.target.value)}
                placeholder="Viết bình luận..."
                className="w-full text-[13px] bg-white border border-slate-200 rounded-full pl-3.5 pr-10 py-2 outline-none focus:border-indigo-500 transition-colors text-slate-900 placeholder:text-slate-400"
              />
              <button
                type="submit"
                disabled={!newComment.trim() || submitting}
                className="absolute right-1 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-indigo-600 text-white flex items-center justify-center disabled:opacity-30 hover:bg-indigo-700 transition-colors"
                aria-label="Gửi bình luận"
              >
                {submitting ? <Loader2 size={12} className="animate-spin" /> : <Send size={12} />}
              </button>
            </div>
          </form>
        </div>
      )}
    </article>
  );
}

function AuthorLink({ post, children, className }: {
  post: Post;
  children: React.ReactNode;
  className?: string;
}) {
  const isSpace = post.author_type === 'space' && post.space_uid;
  const href = isSpace ? `/consumer/profile/${post.space_uid}` : `/consumer/profile/${post.consumer_uid}`;
  return (
    <Link href={href} prefetch={false} className={cn('block shrink-0', className)} aria-label={isSpace ? 'Xem trang giáo viên' : 'Xem trang cá nhân'}>
      {children}
    </Link>
  );
}
