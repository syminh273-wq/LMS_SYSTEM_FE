'use client';

import * as React from 'react';
import { use, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { classroomApi, type ClassroomPreviewResponse } from '@/lib/api';
import { useRequireAuth } from '@/lib/hooks/use-require-auth';
import { ClassroomFavoriteButton } from '@/components/classroom/ClassroomFavoriteButton';
import { Button } from '@shared/components/ui/button';
import { Card, CardContent } from '@shared/components/ui/card';
import {
  Loader2,
  ArrowLeft,
  CheckCircle2,
  Hourglass,
  Crown,
  Sparkles,
  FileText,
  ExternalLink,
  Hash,
  GraduationCap,
  Lock,
  Eye,
} from 'lucide-react';
import { toast } from 'sonner';

const COVER_GRADIENTS = [
  'from-indigo-500 to-purple-600',
  'from-emerald-500 to-teal-600',
  'from-orange-400 to-pink-600',
  'from-sky-500 to-indigo-600',
  'from-rose-500 to-red-600',
  'from-violet-500 to-fuchsia-600',
  'from-amber-500 to-orange-600',
  'from-cyan-500 to-blue-600',
];

function coverGradientFor(uid: string): string {
  let h = 0;
  for (let i = 0; i < uid.length; i++) h = (h * 31 + uid.charCodeAt(i)) | 0;
  return COVER_GRADIENTS[Math.abs(h) % COVER_GRADIENTS.length];
}

const CATEGORY_LABELS: Record<string, { label: string; emoji: string }> = {
  math:        { label: 'Toán học',    emoji: '➗' },
  physics:     { label: 'Vật lý',      emoji: '⚛️' },
  chemistry:   { label: 'Hóa học',     emoji: '🧪' },
  biology:     { label: 'Sinh học',    emoji: '🧬' },
  language:    { label: 'Ngoại ngữ',   emoji: '🗣️' },
  programming: { label: 'Lập trình',   emoji: '💻' },
  business:    { label: 'Kinh doanh',  emoji: '💼' },
  design:      { label: 'Thiết kế',    emoji: '🎨' },
  music:       { label: 'Âm nhạc',     emoji: '🎵' },
  other:       { label: 'Khác',        emoji: '📚' },
};

const formatPrice = (n: number) => new Intl.NumberFormat('vi-VN').format(n) + 'đ';

function formatBytes(bytes?: number) {
  if (!bytes) return '';
  const units = ['B', 'KB', 'MB', 'GB'];
  let i = 0;
  let n = bytes;
  while (n >= 1024 && i < units.length - 1) {
    n /= 1024;
    i++;
  }
  return `${n.toFixed(n < 10 && i > 0 ? 1 : 0)} ${units[i]}`;
}

function fileIcon(name: string) {
  const ext = name.split('.').pop()?.toLowerCase() || '';
  if (['pdf'].includes(ext)) return <FileText size={16} className="text-rose-500" />;
  if (['ppt', 'pptx'].includes(ext)) return <FileText size={16} className="text-orange-500" />;
  if (['doc', 'docx'].includes(ext)) return <FileText size={16} className="text-blue-500" />;
  if (['xls', 'xlsx'].includes(ext)) return <FileText size={16} className="text-emerald-500" />;
  return <FileText size={16} className="text-slate-400" />;
}

export default function ClassroomPreviewPage({ params }: { params: Promise<{ uid: string }> }) {
  const { uid } = use(params);
  const router = useRouter();
  const { isAuthenticated, mounted } = useRequireAuth();

  const [data, setData] = useState<ClassroomPreviewResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!mounted || !isAuthenticated) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await classroomApi.preview(uid);
        if (!cancelled) setData(res);
      } catch (e: unknown) {
        if (!cancelled) {
          const err = e as { response?: { data?: { error?: string } }; message?: string };
          const msg = err?.response?.data?.error || err?.message || 'Không thể tải lớp học';
          setError(msg);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [uid, isAuthenticated, mounted]);

  const handleJoin = async () => {
    if (!data) return;
    setJoining(true);
    try {
      const res = await classroomApi.quickJoin(data.classroom.uid);
      if (res.requires_payment) {
        toast.info('Lớp học trả phí, đang chuyển đến MoMo...');
        router.push(`/consumer/classroom/checkout/${data.classroom.uid}`);
        return;
      }
      if (res.membership_status === 'pending') {
        toast.success('Đã gửi yêu cầu tham gia. Vui lòng chờ giáo viên duyệt.');
        const refreshed = await classroomApi.preview(uid);
        setData(refreshed);
      } else {
        toast.success('Tham gia lớp thành công!');
        router.push(`/consumer/classroom/${data.classroom.uid}`);
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Không thể tham gia lớp';
      toast.error(msg);
    } finally {
      setJoining(false);
    }
  };

  const handleCheckout = () => {
    if (!data) return;
    router.push(`/consumer/classroom/checkout/${data.classroom.uid}`);
  };

  const handleOpenClass = () => {
    if (!data) return;
    router.push(`/consumer/classroom/${data.classroom.uid}`);
  };

  if (!mounted || loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 size={32} className="animate-spin text-slate-400" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="max-w-md mx-auto py-20 text-center space-y-4">
        <div className="text-2xl">😢</div>
        <div className="text-base font-bold text-foreground">{error || 'Không tìm thấy lớp học'}</div>
        <Button variant="outline" onClick={() => router.push('/consumer/discover')} className="rounded-xl">
          <ArrowLeft size={14} className="mr-1" /> Quay lại Khám phá
        </Button>
      </div>
    );
  }

  const { classroom, preview, actions } = data;
  const isPaid = classroom.pricing_type === 'paid';
  const grad = coverGradientFor(classroom.uid);
  const cat = CATEGORY_LABELS[classroom.category || 'other'] || CATEGORY_LABELS.other;
  const teacherName = (classroom as { teacher_name?: string }).teacher_name || 'Giáo viên';
  const teacherAvatar = (classroom as { teacher_avatar?: string }).teacher_avatar || '';

  return (
    <div className="space-y-6 pb-32 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between gap-3">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.back()}
          className="rounded-xl text-slate-600"
        >
          <ArrowLeft size={14} className="mr-1" /> Quay lại
        </Button>
        <ClassroomFavoriteButton
          classroomUid={classroom.uid}
          initialIsFavorited={!!data.is_favorited}
          initialCount={data.favorite_count}
          variant="inline"
        />
      </div>

      <div className={`rounded-3xl bg-gradient-to-br ${grad} p-6 sm:p-8 text-white relative overflow-hidden`}>
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4" />
        <div className="relative space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[10px] font-black uppercase tracking-widest text-white bg-black/30 backdrop-blur px-2 py-1 rounded">
              {cat.emoji} {cat.label}
            </span>
            {isPaid ? (
              <span className="text-[10px] font-black uppercase tracking-widest text-amber-900 bg-amber-100/90 backdrop-blur px-2 py-1 rounded inline-flex items-center gap-1">
                <Crown size={11} /> {classroom.price_vnd ? formatPrice(classroom.price_vnd) : 'PAID'}
              </span>
            ) : (
              <span className="text-[10px] font-black uppercase tracking-widest text-emerald-900 bg-emerald-100/90 backdrop-blur px-2 py-1 rounded">
                MIỄN PHÍ
              </span>
            )}
            <span className="text-[10px] font-black uppercase tracking-widest text-white bg-white/20 backdrop-blur px-2 py-1 rounded inline-flex items-center gap-1">
              <Hash size={11} /> {classroom.pid}
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight leading-tight max-w-2xl">
            {classroom.name}
          </h1>
          {classroom.description && (
            <p className="text-sm sm:text-base text-white/90 max-w-2xl leading-relaxed font-medium">
              {classroom.description}
            </p>
          )}
        </div>
      </div>

      <Card className="border-slate-200">
        <CardContent className="p-5 flex items-center gap-4">
          <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-indigo-100 to-violet-100 flex items-center justify-center text-indigo-700 text-lg font-black overflow-hidden shrink-0">
            {teacherAvatar ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={teacherAvatar} alt={teacherName} className="h-full w-full object-cover" />
            ) : (
              <GraduationCap size={26} />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              Giáo viên
            </div>
            <div className="text-base font-black text-foreground truncate">{teacherName}</div>
            <div className="text-xs text-muted-foreground mt-0.5">
              Cung cấp khóa học trên LMS
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-3">
        <div className="flex items-center gap-2 px-1">
          <Eye size={16} className="text-emerald-600" />
          <h2 className="text-base font-black text-foreground">Bài giảng miễn phí</h2>
          {preview.docs.length > 0 && (
            <span className="text-xs font-bold text-muted-foreground">
              · {preview.docs.length} tài liệu
            </span>
          )}
        </div>
        {preview.docs.length === 0 ? (
          <div className="bg-white border border-dashed border-slate-200 rounded-2xl p-8 text-center">
            <div className="text-3xl mb-2">📭</div>
            <div className="text-sm font-bold text-foreground">Chưa có bài giảng miễn phí</div>
            <div className="text-xs text-muted-foreground mt-1">
              {isPaid
                ? 'Giáo viên chưa đăng tải bài học xem trước. Hãy quay lại sau hoặc tham gia để mở khóa toàn bộ.'
                : 'Giáo viên chưa đăng tải tài liệu nào.'}
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            {preview.docs.map((doc) => (
              <a
                key={doc.uid}
                href={doc.url}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-center gap-3 bg-white border border-slate-200 rounded-2xl px-4 py-3 hover:border-emerald-300 hover:shadow-sm transition-all"
              >
                <div className="h-10 w-10 rounded-xl bg-slate-50 flex items-center justify-center shrink-0">
                  {fileIcon(doc.name)}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-bold text-foreground truncate group-hover:text-emerald-700">
                    {doc.name}
                  </div>
                  <div className="text-[11px] text-muted-foreground">
                    {doc.file_type?.toUpperCase() || 'FILE'}
                    {doc.size ? ` · ${formatBytes(doc.size)}` : ''}
                  </div>
                </div>
                <ExternalLink size={14} className="text-slate-400 group-hover:text-emerald-600" />
              </a>
            ))}
          </div>
        )}
        {isPaid && preview.docs.length > 0 && (
          <div className="text-[11px] text-muted-foreground px-1 flex items-center gap-1">
            <Lock size={11} /> Đây chỉ là phần xem trước. Tham gia để mở khóa toàn bộ bài giảng.
          </div>
        )}
      </div>

      {actions.type === 'none' && actions.membership_status === 'pending' && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-center gap-3">
          <Hourglass size={18} className="text-amber-600" />
          <div className="text-sm font-bold text-amber-900">
            Yêu cầu tham gia của bạn đang chờ giáo viên duyệt.
          </div>
        </div>
      )}

      <div className="fixed bottom-0 left-0 right-0 z-30 px-4 pb-4 pt-3 bg-gradient-to-t from-white via-white/95 to-transparent">
        <div className="max-w-3xl mx-auto bg-white border border-slate-200 rounded-2xl shadow-lg shadow-slate-200/60 p-3 flex items-center gap-3">
          <div className="flex-1 min-w-0">
            <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              {isPaid ? 'Thanh toán 1 lần' : 'Hoàn toàn miễn phí'}
            </div>
            <div className="text-base font-black text-foreground truncate">
              {isPaid ? formatPrice(classroom.price_vnd || 0) : 'Yêu cầu tham gia'}
            </div>
          </div>
          {actions.type === 'none' ? (
            <Button
              onClick={handleOpenClass}
              className="h-12 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-black px-5 gap-1.5"
            >
              <CheckCircle2 size={16} /> Mở lớp
            </Button>
          ) : actions.type === 'checkout' ? (
            <Button
              onClick={handleCheckout}
              disabled={joining}
              className="h-12 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-black px-5 gap-1.5"
            >
              <Crown size={16} /> Thanh toán MoMo
            </Button>
          ) : (
            <Button
              onClick={handleJoin}
              disabled={joining}
              className="h-12 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-black px-5 gap-1.5"
            >
              {joining ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
              Tham gia
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
