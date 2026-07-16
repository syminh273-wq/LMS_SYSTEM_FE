'use client';

import * as React from 'react';
import { useState, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { socialApi } from '@/lib/api/social';
import type { Post, PostEmotion, PostVisibility } from '@/lib/api/types';
import {
  Smile, ImageIcon, X, Loader2, Globe, Users, Lock,
  Sparkles,
} from 'lucide-react';
import { toast } from 'sonner';
import { CEditor } from '@/components/Elements/CEditor';
import { Form } from '@shared/components/ui/form';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@shared/components/ui/dropdown-menu';
import { ChevronDown } from 'lucide-react';
import { cn } from '@shared/lib/utils';

const EMOTIONS: { key: PostEmotion; emoji: string; label: string }[] = [
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

const VISIBILITY_OPTIONS: { key: PostVisibility; icon: React.ElementType; label: string }[] = [
  { key: 'public',  icon: Globe,  label: 'Công khai' },
  { key: 'friends', icon: Users,  label: 'Bạn bè' },
  { key: 'private', icon: Lock,   label: 'Chỉ mình tôi' },
];

export function CreatePost({ profile, onCreated }: {
  profile: { full_name: string; avatar_url: string } | null;
  onCreated: (post: Post) => void;
}) {
  const [open, setOpen] = useState(false);
  const [emotion, setEmotion] = useState<PostEmotion>('');
  const [visibility, setVisibility] = useState<PostVisibility>('public');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [showEmotions, setShowEmotions] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const form = useForm({
    defaultValues: {
      content: '',
    },
  });

  const { control, handleSubmit: handleFormSubmit, reset, watch } = form;
  const content = watch('content');

  const initials = (profile?.full_name || '?').slice(0, 2).toUpperCase();
  const selectedVis = VISIBILITY_OPTIONS.find(v => v.key === visibility)!;
  const selectedEmotion = emotion ? EMOTION_MAP[emotion] : null;

  const handleImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setImageFile(f);
    setImagePreview(URL.createObjectURL(f));
  };

  const onSubmit = async (data: { content: string }) => {
    if (!data.content.trim() && !imagePreview) return;
    setSubmitting(true);
    try {
      let image_url = '';
      if (imageFile) {
        const formData = new FormData();
        formData.append('file', imageFile);
        const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
        const token = localStorage.getItem('accessToken');
        const res = await fetch(`${apiBase}/api/v1/resource/upload/`, {
          method: 'POST',
          headers: token ? { Authorization: `Bearer ${token}` } : {},
          body: formData,
        });
        if (res.ok) {
          const data = await res.json();
          image_url = data.url || '';
        }
      }
      const post = await socialApi.createPost({ content: data.content.trim(), emotion, visibility, image_url });
      onCreated(post);
      reset(); setEmotion(''); setImageFile(null); setImagePreview(null); setOpen(false);
      toast.success('Đã đăng bài!');
    } catch { toast.error('Đăng bài thất bại'); }
    finally { setSubmitting(false); }
  };

  if (!open) {
    return (
      <div className="bg-white border border-slate-200 rounded-xl p-4 card-elevated">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center text-white font-semibold text-[12px] shrink-0 overflow-hidden">
            {profile?.avatar_url ? <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" /> : initials}
          </div>
          <button
            onClick={() => setOpen(true)}
            className="flex-1 text-left px-4 py-2.5 bg-slate-100 hover:bg-slate-200 rounded-full text-[13.5px] text-slate-500 transition-colors"
          >
            {profile?.full_name ? `${profile.full_name} ơi, bạn đang nghĩ gì?` : 'Bạn đang nghĩ gì?'}
          </button>
          <button
            onClick={() => setOpen(true)}
            className="hidden sm:inline-flex items-center gap-1.5 px-3 h-9 rounded-full bg-slate-100 hover:bg-slate-200 text-[12.5px] font-semibold text-slate-700 transition-colors"
          >
            <ImageIcon size={14} />
            Ảnh
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border border-slate-200 rounded-xl card-elevated overflow-hidden animate-scale-in">
      <Form {...form}>
        <div className="p-4 sm:p-5 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center text-white font-semibold text-[12px] shrink-0 overflow-hidden">
                {profile?.avatar_url ? <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" /> : initials}
              </div>
              <div className="min-w-0">
                <p className="text-[13.5px] font-semibold text-slate-900 truncate">{profile?.full_name || 'Bạn'}</p>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="mt-0.5 inline-flex items-center gap-1 text-[11px] font-semibold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-full hover:bg-indigo-100 transition-colors">
                      <selectedVis.icon size={10} strokeWidth={2.5} />
                      {selectedVis.label}
                      <ChevronDown size={9} />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="bg-white border-slate-200">
                    {VISIBILITY_OPTIONS.map((opt) => (
                      <DropdownMenuItem
                        key={opt.key}
                        onClick={() => setVisibility(opt.key)}
                        className="flex items-center gap-2 text-[12.5px] font-medium cursor-pointer"
                      >
                        <opt.icon size={13} />
                        {opt.label}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-500 transition-colors"
              aria-label="Đóng"
            >
              <X size={16} />
            </button>
          </div>

          {selectedEmotion && (
            <div className="flex items-center gap-1.5 text-[13px] text-slate-600 animate-fade-down">
              <Sparkles size={12} className="text-amber-500" />
              <span>đang cảm thấy</span>
              <span className="font-semibold text-indigo-700">
                {selectedEmotion.emoji} {selectedEmotion.label}
              </span>
              <button
                onClick={() => setEmotion('')}
                className="text-slate-400 hover:text-slate-600 ml-1"
                aria-label="Bỏ cảm xúc"
              >
                <X size={12} />
              </button>
            </div>
          )}

          <CEditor
            control={control}
            name="content"
            minHeight="100px"
            placeholder={profile?.full_name ? `${profile.full_name} đang nghĩ gì?` : 'Bạn đang nghĩ gì?'}
          />

          {imagePreview && (
            <div className="relative rounded-lg overflow-hidden border border-slate-200 animate-fade-down">
              <img src={imagePreview} alt="" className="w-full max-h-72 object-cover" />
              <button
                onClick={() => { setImageFile(null); setImagePreview(null); }}
                className="absolute top-2 right-2 w-8 h-8 bg-slate-900/70 rounded-full flex items-center justify-center text-white hover:bg-slate-900 transition-colors"
                aria-label="Xóa ảnh"
              >
                <X size={14} />
              </button>
            </div>
          )}

          {showEmotions && (
            <div className="grid grid-cols-5 sm:grid-cols-10 gap-1 p-2.5 bg-slate-50 rounded-lg border border-slate-200 animate-fade-down">
              {EMOTIONS.map(e => (
                <button
                  key={e.key}
                  onClick={() => { setEmotion(e.key); setShowEmotions(false); }}
                  className={cn(
                    "flex flex-col items-center p-2 rounded-md transition-colors",
                    emotion === e.key
                      ? "bg-indigo-100 ring-1 ring-indigo-300"
                      : "hover:bg-white"
                  )}
                >
                  <span className="text-xl">{e.emoji}</span>
                  <span className="text-[9.5px] text-slate-500 mt-1 truncate w-full text-center">{e.label}</span>
                </button>
              ))}
            </div>
          )}

          <div className="flex items-center justify-between border-t border-slate-200 pt-3 mt-1">
            <div className="flex items-center gap-1">
              <button
                onClick={() => fileRef.current?.click()}
                className="p-2 rounded-lg text-emerald-700 hover:bg-emerald-50 transition-colors flex items-center gap-1.5 text-[12.5px] font-semibold"
              >
                <ImageIcon size={15} />
                <span className="hidden sm:inline">Ảnh</span>
              </button>
              <input type="file" ref={fileRef} className="hidden" accept="image/*" onChange={handleImage} />
              <button
                onClick={() => setShowEmotions(!showEmotions)}
                className="p-2 rounded-lg text-amber-700 hover:bg-amber-50 transition-colors flex items-center gap-1.5 text-[12.5px] font-semibold"
              >
                <Smile size={15} />
                <span className="hidden sm:inline">Cảm xúc</span>
              </button>
            </div>
            <button
              onClick={handleFormSubmit(onSubmit)}
              disabled={(!content.trim() && !imagePreview) || submitting}
              className="px-5 h-9 rounded-lg text-[13px] font-semibold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors inline-flex items-center gap-1.5"
            >
              {submitting && <Loader2 size={13} className="animate-spin" />}
              Đăng bài
            </button>
          </div>
        </div>
      </Form>
    </div>
  );
}
