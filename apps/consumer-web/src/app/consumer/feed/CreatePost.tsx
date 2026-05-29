'use client';

import * as React from 'react';
import { useState, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { socialApi } from '@/lib/api/social';
import type { Post, PostEmotion, PostVisibility } from '@/lib/api/types';
import {
  Smile, ImageIcon, X, Loader2, Globe, Users, Lock,
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

  return (
    <div className="bg-card rounded-2xl border border-border shadow-sm p-4">
      {!open ? (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-accent flex items-center justify-center text-accent-foreground font-black text-sm shrink-0 overflow-hidden">
            {profile?.avatar_url ? <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" /> : initials}
          </div>
          <button onClick={() => setOpen(true)}
            className="flex-1 text-left px-4 py-2.5 bg-accent/50 hover:bg-accent rounded-full text-sm text-muted-foreground transition-colors">
            {profile?.full_name ? `${profile.full_name} đang nghĩ gì?` : 'Bạn đang nghĩ gì?'}
          </button>
        </div>
      ) : (
        <Form {...form}>
          <div className="space-y-3 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-accent flex items-center justify-center text-accent-foreground font-black text-sm shrink-0 overflow-hidden">
                  {profile?.avatar_url ? <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" /> : initials}
                </div>
                <div>
                  <p className="text-sm font-bold text-foreground">{profile?.full_name || 'Bạn'}</p>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button className="flex items-center gap-1 text-xs font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full hover:bg-primary/20 transition-colors">
                        <selectedVis.icon size={11} />
                        {selectedVis.label}
                        <ChevronDown size={10} />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start" className="bg-card border-border">
                      {VISIBILITY_OPTIONS.map((opt) => (
                        <DropdownMenuItem
                          key={opt.key}
                          onClick={() => setVisibility(opt.key)}
                          className="flex items-center gap-2 text-xs font-medium cursor-pointer hover:bg-accent hover:text-accent-foreground"
                        >
                          <opt.icon size={12} />
                          {opt.label}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
              <button onClick={() => setOpen(false)} className="p-1 hover:bg-accent rounded-full text-muted-foreground transition-colors"><X size={18}/></button>
            </div>

            {selectedEmotion && (
              <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <span>đang cảm thấy</span>
                <span className="font-bold text-primary">{selectedEmotion.emoji} {selectedEmotion.label}</span>
                <button onClick={() => setEmotion('')} className="text-muted-foreground hover:text-foreground"><X size={13} /></button>
              </div>
            )}

            <CEditor 
              control={control} 
              name="content" 
              minHeight="120px" 
              placeholder={profile?.full_name ? `${profile.full_name} đang nghĩ gì?` : 'Bạn đang nghĩ gì?'}
            />

            {imagePreview && (
              <div className="relative rounded-xl overflow-hidden border border-border">
                <img src={imagePreview} alt="" className="w-full max-h-64 object-cover" />
                <button onClick={() => { setImageFile(null); setImagePreview(null); }}
                  className="absolute top-2 right-2 w-7 h-7 bg-black/50 rounded-full flex items-center justify-center text-white hover:bg-black/70 transition-colors">
                  <X size={14} />
                </button>
              </div>
            )}

            {showEmotions && (
              <div className="grid grid-cols-5 gap-1 p-2 bg-accent/20 rounded-xl border border-border">
                {EMOTIONS.map(e => (
                  <button key={e.key} onClick={() => { setEmotion(e.key); setShowEmotions(false); }}
                    className="flex flex-col items-center p-2 rounded-lg hover:bg-accent hover:shadow-sm transition-all">
                    <span className="text-xl">{e.emoji}</span>
                    <span className="text-[10px] text-muted-foreground mt-1">{e.label}</span>
                  </button>
                ))}
              </div>
            )}

            <div className="flex items-center justify-between border-t border-border pt-3">
              <div className="flex items-center gap-1">
                <button onClick={() => fileRef.current?.click()} className="p-2 rounded-xl text-emerald-500 hover:bg-emerald-500/10 transition-colors flex items-center gap-1.5 text-xs font-bold">
                  <ImageIcon size={16} /> Ảnh
                </button>
                <input type="file" ref={fileRef} className="hidden" accept="image/*" onChange={handleImage} />
                <button onClick={() => setShowEmotions(!showEmotions)} className="p-2 rounded-xl text-amber-500 hover:bg-amber-500/10 transition-colors flex items-center gap-1.5 text-xs font-bold">
                  <Smile size={16} /> Cảm xúc
                </button>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={handleFormSubmit(onSubmit)} disabled={(!content.trim() && !imagePreview) || submitting}
                  className="px-5 py-1.5 rounded-xl text-sm font-bold bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-40 transition-colors flex items-center gap-1.5">
                  {submitting && <Loader2 size={14} className="animate-spin" />}
                  Đăng
                </button>
              </div>
            </div>
          </div>
        </Form>
      )}
    </div>
  );
}
