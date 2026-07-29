'use client';

import * as React from 'react';
import { Button } from '@shared/components/ui/button';
import { useState, useRef, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useForm } from 'react-hook-form';
import { socialApi } from '@/lib/api/social';
import { classroomApi } from '@/lib/api/classroom';
import type { Post, PostEmotion, PostVisibility, Classroom } from '@/lib/api/types';
import {
  Smile, ImageIcon, X, Loader2, Globe, Users, Lock,
  Sparkles, BookOpen, Search, Check,
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
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [showEmotions, setShowEmotions] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [selectedClassroomUids, setSelectedClassroomUids] = useState<string[]>([]);
  const [showClassroomPicker, setShowClassroomPicker] = useState(false);
  const [classroomSearch, setClassroomSearch] = useState('');
  const [classroomsLoading, setClassroomsLoading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const classroomButtonRef = useRef<HTMLDivElement>(null);
  const [pickerPos, setPickerPos] = useState<{ top: number; left: number; width: number } | null>(null);

  const MAX_IMAGES = 9;

  useEffect(() => {
    if (!open || classrooms.length > 0) return;
    setClassroomsLoading(true);
    classroomApi
      .list(1)
      .then((res) => {
        const items = Array.isArray(res) ? (res as unknown as Classroom[]) : res.results || [];
        setClassrooms(items);
      })
      .catch(() => toast.error('Không thể tải danh sách lớp học'))
      .finally(() => setClassroomsLoading(false));
  }, [open, classrooms.length]);

  useEffect(() => {
    if (!showClassroomPicker) return;
    const updatePos = () => {
      if (!classroomButtonRef.current) return;
      const r = classroomButtonRef.current.getBoundingClientRect();
      setPickerPos({ top: r.bottom + 6, left: r.left, width: Math.max(r.width, 280) });
    };
    updatePos();
    window.addEventListener('scroll', updatePos, true);
    window.addEventListener('resize', updatePos);
    return () => {
      window.removeEventListener('scroll', updatePos, true);
      window.removeEventListener('resize', updatePos);
    };
  }, [showClassroomPicker]);

  const filteredClassrooms = useMemo(() => {
    const q = classroomSearch.trim().toLowerCase();
    if (!q) return classrooms;
    return classrooms.filter((c) => (c.name || c.title || '').toLowerCase().includes(q));
  }, [classrooms, classroomSearch]);

  const selectedClassrooms = useMemo(
    () => classrooms.filter((c) => selectedClassroomUids.includes(c.uid)),
    [classrooms, selectedClassroomUids]
  );

  const toggleClassroom = (uid: string) => {
    setSelectedClassroomUids((prev) =>
      prev.includes(uid) ? prev.filter((u) => u !== uid) : [...prev, uid]
    );
  };

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
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    const remaining = MAX_IMAGES - imageFiles.length;
    const accepted = files.slice(0, remaining);
    if (files.length > remaining) {
      toast.warning(`Chỉ có thể đính kèm tối đa ${MAX_IMAGES} ảnh.`);
    }
    setImageFiles((prev) => [...prev, ...accepted]);
    setImagePreviews((prev) => [...prev, ...accepted.map((f) => URL.createObjectURL(f))]);
    e.target.value = '';
  };

  const removeImage = (idx: number) => {
    setImageFiles((prev) => prev.filter((_, i) => i !== idx));
    setImagePreviews((prev) => {
      const url = prev[idx];
      if (url) URL.revokeObjectURL(url);
      return prev.filter((_, i) => i !== idx);
    });
  };

  const onSubmit = async (data: { content: string }) => {
    if (!data.content.trim() && imageFiles.length === 0) return;
    setSubmitting(true);
    try {
      let imageUrls: string[] = [];
      if (imageFiles.length > 0) {
        const result = await socialApi.uploadPostImages(imageFiles);
        imageUrls = result.urls || [];
        if (result.errors && result.errors.length > 0) {
          toast.warning(`Một số ảnh tải lên thất bại (${result.errors.length}/${imageFiles.length})`);
        }
      }
      const post = await socialApi.createPost({
        content: data.content.trim(),
        emotion,
        visibility,
        image_url: imageUrls[0] || '',
        image_urls: imageUrls,
        classroom_tag: selectedClassroomUids,
      });
      onCreated(post);
      reset();
      setEmotion('');
      imagePreviews.forEach((u) => URL.revokeObjectURL(u));
      setImageFiles([]);
      setImagePreviews([]);
      setSelectedClassroomUids([]);
      setShowClassroomPicker(false);
      setOpen(false);
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
          <Button
            onClick={() => setOpen(true)}
            className="flex-1 text-left px-4 py-2.5 bg-slate-100 hover:bg-slate-200 rounded-full text-[13.5px] text-slate-500 transition-colors"
          >
            {profile?.full_name ? `${profile.full_name} ơi, bạn đang nghĩ gì?` : 'Bạn đang nghĩ gì?'}
          </Button>
          <Button
            onClick={() => setOpen(true)}
            className="hidden sm:inline-flex items-center gap-1.5 px-3 h-9 rounded-full bg-slate-100 hover:bg-slate-200 text-[12.5px] font-semibold text-slate-700 transition-colors"
          >
            <ImageIcon size={14} />
            Ảnh
          </Button>
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
                    <Button className="mt-0.5 inline-flex items-center gap-1 text-[11px] font-semibold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-full hover:bg-indigo-100 transition-colors">
                      <selectedVis.icon size={10} strokeWidth={2.5} />
                      {selectedVis.label}
                      <ChevronDown size={9} />
                    </Button>
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
            <Button
              onClick={() => setOpen(false)}
              className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-500 transition-colors"
              aria-label="Đóng"
            >
              <X size={16} />
            </Button>
          </div>

          {selectedEmotion && (
            <div className="flex items-center gap-1.5 text-[13px] text-slate-600 animate-fade-down">
              <Sparkles size={12} className="text-amber-500" />
              <span>đang cảm thấy</span>
              <span className="font-semibold text-indigo-700">
                {selectedEmotion.emoji} {selectedEmotion.label}
              </span>
              <Button
                onClick={() => setEmotion('')}
                className="text-slate-400 hover:text-slate-600 ml-1"
                aria-label="Bỏ cảm xúc"
              >
                <X size={12} />
              </Button>
            </div>
          )}

          {selectedClassrooms.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5 animate-fade-down">
              <span className="text-[12px] text-slate-500 font-medium">đang chia sẻ với</span>
              {selectedClassrooms.map((c) => (
                <span
                  key={c.uid}
                  className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-emerald-50 text-emerald-700 text-[12px] font-semibold border border-emerald-200"
                >
                  <BookOpen size={11} />
                  {c.name || c.title}
                  <Button
                    onClick={() => toggleClassroom(c.uid)}
                    className="ml-0.5 text-emerald-500 hover:text-emerald-700"
                    aria-label={`Bỏ tag ${c.name || c.title}`}
                  >
                    <X size={11} />
                  </Button>
                </span>
              ))}
            </div>
          )}

          <CEditor
            control={control}
            name="content"
            minHeight="100px"
            placeholder={profile?.full_name ? `${profile.full_name} đang nghĩ gì?` : 'Bạn đang nghĩ gì?'}
          />

          {imagePreviews.length > 0 && (
            <div className="grid grid-cols-3 gap-1.5 rounded-lg overflow-hidden border border-slate-200 animate-fade-down p-1.5 bg-slate-50">
              {imagePreviews.map((src, i) => (
                <div key={i} className="relative group aspect-square">
                  <img src={src} alt="" className="w-full h-full object-cover rounded" />
                  <Button
                    type="button"
                    onClick={() => removeImage(i)}
                    className="absolute top-1 right-1 w-6 h-6 bg-slate-900/70 rounded-full flex items-center justify-center text-white hover:bg-slate-900 transition-colors"
                    aria-label={`Xóa ảnh ${i + 1}`}
                  >
                    <X size={12} />
                  </Button>
                </div>
              ))}
            </div>
          )}

          {showEmotions && (
            <div className="grid grid-cols-5 sm:grid-cols-10 gap-1 p-2.5 bg-slate-50 rounded-lg border border-slate-200 animate-fade-down">
              {EMOTIONS.map(e => (
                <Button
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
                </Button>
              ))}
            </div>
          )}

          <div className="flex items-center justify-between border-t border-slate-200 pt-3 mt-1">
            <div className="flex items-center gap-1">
              <Button
                onClick={() => fileRef.current?.click()}
                disabled={imageFiles.length >= MAX_IMAGES}
                className="p-2 rounded-lg text-emerald-700 hover:bg-emerald-50 transition-colors flex items-center gap-1.5 text-[12.5px] font-semibold disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ImageIcon size={15} />
                <span className="hidden sm:inline">
                  Ảnh{imageFiles.length > 0 ? ` (${imageFiles.length}/${MAX_IMAGES})` : ''}
                </span>
              </Button>
              <input
                type="file"
                ref={fileRef}
                className="hidden"
                accept="image/*"
                multiple
                onChange={handleImage}
              />
              <Button
                onClick={() => setShowEmotions(!showEmotions)}
                className="p-2 rounded-lg text-amber-700 hover:bg-amber-50 transition-colors flex items-center gap-1.5 text-[12.5px] font-semibold"
              >
                <Smile size={15} />
                <span className="hidden sm:inline">Cảm xúc</span>
              </Button>
              <div ref={classroomButtonRef} className="relative">
                <Button
                  type="button"
                  onClick={() => setShowClassroomPicker((v) => !v)}
                  className={cn(
                    'p-2 rounded-lg transition-colors flex items-center gap-1.5 text-[12.5px] font-semibold',
                    selectedClassroomUids.length > 0
                      ? 'text-emerald-700 bg-emerald-50 hover:bg-emerald-100'
                      : 'text-emerald-700 hover:bg-emerald-50'
                  )}
                >
                  <BookOpen size={15} />
                  <span className="hidden sm:inline">
                    Lớp học{selectedClassroomUids.length > 0 ? ` (${selectedClassroomUids.length})` : ''}
                  </span>
                </Button>
              </div>
            </div>
            <Button
              onClick={handleFormSubmit(onSubmit)}
              disabled={(!content.trim() && imageFiles.length === 0) || submitting}
              className="px-5 h-9 rounded-lg text-[13px] font-semibold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors inline-flex items-center gap-1.5"
            >
              {submitting && <Loader2 size={13} className="animate-spin" />}
              Đăng bài
            </Button>
          </div>
        </div>
          </Form>
      {showClassroomPicker && pickerPos && typeof document !== 'undefined' && createPortal(
        <div
          className="fixed z-50 bg-white border border-slate-200 rounded-xl shadow-xl"
          style={{ top: pickerPos.top, left: pickerPos.left, width: pickerPos.width }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="p-2 border-b border-slate-100">
            <div className="relative">
              <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                autoFocus
                value={classroomSearch}
                onChange={(e) => setClassroomSearch(e.target.value)}
                placeholder="Tìm lớp học..."
                className="w-full h-8 pl-8 pr-2 text-[13px] bg-slate-50 border border-transparent rounded-lg focus:bg-white focus:border-indigo-300 outline-none"
              />
            </div>
          </div>
          <div className="max-h-64 overflow-y-auto p-1">
            {classroomsLoading ? (
              <div className="flex items-center justify-center py-6 text-[12px] text-slate-500">
                <Loader2 size={13} className="animate-spin mr-1.5" /> Đang tải...
              </div>
            ) : filteredClassrooms.length === 0 ? (
              <div className="py-6 text-center text-[12px] text-slate-500">
                {classroomSearch ? 'Không tìm thấy lớp phù hợp' : 'Chưa có lớp học nào'}
              </div>
            ) : (
              filteredClassrooms.map((c) => {
                const isSel = selectedClassroomUids.includes(c.uid);
                return (
                  <Button
                    key={c.uid}
                    onClick={() => toggleClassroom(c.uid)}
                    className={cn(
                      'w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-left transition-colors',
                      isSel ? 'bg-emerald-50' : 'hover:bg-slate-50'
                    )}
                  >
                    <div className={cn(
                      'w-7 h-7 rounded-lg flex items-center justify-center shrink-0',
                      isSel ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-500'
                    )}>
                      {isSel ? <Check size={13} /> : <BookOpen size={13} />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[13px] font-semibold text-slate-900 truncate">
                        {c.name || c.title || 'Lớp học'}
                      </p>
                      {c.description && (
                        <p className="text-[11px] text-slate-500 truncate">{c.description}</p>
                      )}
                    </div>
                  </Button>
                );
              })
            )}
          </div>
          {selectedClassroomUids.length > 0 && (
            <div className="border-t border-slate-100 p-2 flex items-center justify-between">
              <span className="text-[11.5px] text-slate-500 font-medium">
                Đã chọn {selectedClassroomUids.length} lớp
              </span>
              <Button
                onClick={() => setSelectedClassroomUids([])}
                className="text-[11.5px] font-semibold text-slate-500 hover:text-rose-600"
              >
                Bỏ chọn tất cả
              </Button>
            </div>
          )}
        </div>,
        document.body
      )}
      {showClassroomPicker && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setShowClassroomPicker(false)}
        />
      )}
    </div>
  );
}
