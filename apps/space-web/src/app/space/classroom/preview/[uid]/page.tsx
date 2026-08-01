'use client';

import * as React from 'react';
import { use, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { classroomApi, type ClassroomPreviewResponse } from '@/lib/api';
import { useRequireAuth } from '@/features/auth/hooks/useRequireAuth';
import { useMe } from '@/features/auth/hooks/useMe';
import { ClassroomFavoriteButton } from '@/components/classroom/ClassroomFavoriteButton';
import { Button } from '@shared/components/ui/button';
import { Card, CardContent } from '@shared/components/ui/card';
import { cn } from '@shared/lib/utils';
import {
  Loader2,
  ArrowLeft,
  CheckCircle2,
  Hourglass,
  Crown,
  Sparkles,
  FileText,
  FileImage,
  FileVideo,
  FileAudio,
  ExternalLink,
  Hash,
  GraduationCap,
  Lock,
  Eye,
  FolderOpen,
  Folder as FolderIcon,
  ChevronRight,
  ChevronDown,
  Play,
  X,
  Download,
  Users,
  BookOpen,
} from 'lucide-react';
import { toast } from 'sonner';

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

function fileIcon(name: string, fileType?: string) {
  const ext = (name.split('.').pop() || fileType || '').toLowerCase();
  if (['mp4', 'mov', 'avi', 'mkv', 'webm'].includes(ext))
    return <FileVideo size={16} className="text-violet-500" />;
  if (['mp3', 'wav', 'ogg', 'm4a'].includes(ext))
    return <FileAudio size={16} className="text-pink-500" />;
  if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp'].includes(ext))
    return <FileImage size={16} className="text-emerald-500" />;
  if (['pdf'].includes(ext))
    return <FileText size={16} className="text-rose-500" />;
  if (['ppt', 'pptx'].includes(ext))
    return <FileText size={16} className="text-orange-500" />;
  if (['doc', 'docx'].includes(ext))
    return <FileText size={16} className="text-blue-500" />;
  if (['xls', 'xlsx', 'csv'].includes(ext))
    return <FileText size={16} className="text-emerald-600" />;
  return <FileText size={16} className="text-muted-foreground" />;
}

function fileKind(name: string, fileType?: string): 'image' | 'video' | 'audio' | 'pdf' | 'other' {
  const ext = (name.split('.').pop() || fileType || '').toLowerCase();
  if (['mp4', 'mov', 'avi', 'mkv', 'webm'].includes(ext)) return 'video';
  if (['mp3', 'wav', 'ogg', 'm4a'].includes(ext)) return 'audio';
  if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp'].includes(ext)) return 'image';
  if (ext === 'pdf') return 'pdf';
  return 'other';
}

export default function ClassroomPreviewPage({ params }: { params: Promise<{ uid: string }> }) {
  const { uid } = use(params);
  const router = useRouter();
  const { isAuthenticated, isMounted: mounted } = useRequireAuth();
  const { status: meStatus, me } = useMe();

  const [data, setData] = useState<ClassroomPreviewResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [previewDoc, setPreviewDoc] = useState<{
    uid: string;
    name: string;
    url: string;
    kind: 'image' | 'video' | 'audio' | 'pdf' | 'other';
  } | null>(null);

  useEffect(() => {
    if (!data) return;
    /* eslint-disable react-hooks/set-state-in-effect --
       Initialize folder-expansion defaults from the loaded preview tree. */
    const next: Record<string, boolean> = {};
    for (const item of data.preview.items) {
      if (item.type === 'folder' && next[item.uid] === undefined) {
        next[item.uid] = true;
      }
    }
    setExpanded((prev) => ({ ...next, ...prev }));
  }, [data]);

  useEffect(() => {
    if (!previewDoc) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setPreviewDoc(null);
    };
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [previewDoc]);

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
        const base =
          (typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_CONSUMER_WEB_URL) ||
          'http://localhost:3000';
        window.location.href = `${base.replace(/\/+$/, '')}/consumer/classroom/checkout/${data.classroom.uid}`;
        return;
      }
      if (res.membership_status === 'pending') {
        toast.success('Đã gửi yêu cầu tham gia. Vui lòng chờ giáo viên duyệt.');
        const refreshed = await classroomApi.preview(uid);
        setData(refreshed);
      } else {
        toast.success('Tham gia lớp thành công!');
        const base =
          (typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_CONSUMER_WEB_URL) ||
          'http://localhost:3000';
        window.location.href = `${base.replace(/\/+$/, '')}/consumer/classroom/${data.classroom.uid}`;
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
    const base =
      (typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_CONSUMER_WEB_URL) ||
      'http://localhost:3000';
    window.location.href = `${base.replace(/\/+$/, '')}/consumer/classroom/checkout/${data.classroom.uid}`;
  };

  const handleOpenClass = () => {
    if (!data) return;
    const base =
      (typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_CONSUMER_WEB_URL) ||
      'http://localhost:3000';
    window.location.href = `${base.replace(/\/+$/, '')}/consumer/classroom/${data.classroom.uid}`;
  };

  if (!mounted || loading || meStatus === 'loading') {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div className="flex items-center justify-center py-32">
          <Loader2 size={32} className="animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  // If the visitor is the teacher who owns this classroom, bounce them to
  // the matching space-web management page.
  if (data && me && data.classroom.teacher_id === me.uid) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div className="max-w-md mx-auto py-20 text-center space-y-4">
          <div className="text-2xl">🔒</div>
          <div className="text-base font-bold text-foreground">
            Đây là lớp học bạn đang giảng dạy.
          </div>
          <div className="text-sm text-muted-foreground">
            Vui lòng sử dụng trang quản lý lớp học dành cho giáo viên.
          </div>
          <Button
            onClick={() => {
              router.push(`/space/classrooms/${uid}`);
            }}
          >
            Mở trang quản lý lớp học
          </Button>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div className="max-w-md mx-auto py-20 text-center space-y-4">
          <div className="text-2xl">😢</div>
          <div className="text-base font-bold text-foreground">{error || 'Không tìm thấy lớp học'}</div>
          <Button variant="outline" onClick={() => router.back()}>
            <ArrowLeft size={14} className="mr-1" /> Quay lại
          </Button>
        </div>
      </div>
    );
  }

  const { classroom, preview, actions } = data;
  const isPaid = classroom.pricing_type === 'paid';
  const cat = CATEGORY_LABELS[classroom.category || 'other'] || CATEGORY_LABELS.other;
  const teacherName = (classroom as { teacher_name?: string }).teacher_name || 'Giáo viên';
  const teacherAvatar = (classroom as { teacher_avatar?: string }).teacher_avatar || '';
  const docCount = preview.items.filter((it) => it.type === 'doc').length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 pb-32 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="space-y-6">
        <div className="flex items-center justify-between gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.back()}
            className="-ml-2"
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

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card className="overflow-hidden">
              <CardContent className="p-6 sm:p-8 space-y-5">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-primary-brand bg-primary-brand-light border border-primary-brand-light px-2.5 py-1 rounded-md">
                    <span>{cat.emoji}</span> {cat.label}
                  </span>
                  {isPaid ? (
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-md">
                      <Crown size={11} /> Trả phí
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-md">
                      Miễn phí
                    </span>
                  )}
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider text-muted-foreground bg-muted border border-border px-2.5 py-1 rounded-md">
                    <Hash size={11} /> {classroom.pid}
                  </span>
                </div>

                <div className="space-y-2">
                  <h1 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight leading-tight">
                    {classroom.name}
                  </h1>
                  {classroom.description && (
                    <p className="text-[14px] text-muted-foreground leading-relaxed max-w-2xl">
                      {classroom.description}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

            <div className="space-y-3">
              <div className="flex items-center justify-between gap-2 px-1">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-primary-brand-light text-primary-brand flex items-center justify-center">
                    <Eye size={15} />
                  </div>
                  <div>
                    <h2 className="text-[15px] font-bold text-foreground">Bài giảng miễn phí</h2>
                    {docCount > 0 && (
                      <p className="text-[11px] text-muted-foreground font-medium">
                        {docCount} tài liệu xem trước
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {preview.items.length === 0 ? (
                <div className="bg-card border border-dashed border-border rounded-2xl p-10 text-center">
                  <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mx-auto mb-3">
                    <BookOpen size={20} className="text-muted-foreground" />
                  </div>
                  <div className="text-sm font-bold text-foreground">Chưa có bài giảng miễn phí</div>
                  <div className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
                    {isPaid
                      ? 'Giáo viên chưa đăng tải bài học xem trước. Hãy quay lại sau hoặc tham gia để mở khóa toàn bộ.'
                      : 'Giáo viên chưa đăng tải tài liệu nào.'}
                  </div>
                </div>
              ) : (
                <Card className="overflow-hidden">
                  <div className="divide-y divide-border">
                    {preview.items.map((item) => {
                      if (item.type === 'folder') {
                        const isOpen = expanded[item.uid] ?? true;
                        const isRootPreview = item.is_preview_only && item.depth === 0;
                        return (
                          <Button
                            type="button"
                            variant="ghost"
                            key={`f-${item.uid}`}
                            onClick={() =>
                              setExpanded((prev) => ({ ...prev, [item.uid]: !(prev[item.uid] ?? true) }))
                            }
                            className={cn(
                              "w-full justify-start gap-2.5 px-4 py-2.5 text-left",
                              isRootPreview
                                ? 'bg-emerald-50/40 hover:bg-emerald-50/70 text-emerald-900'
                                : 'text-foreground'
                            )}
                            style={{ paddingLeft: 16 + item.depth * 20 }}
                          >
                            {isOpen ? (
                              <ChevronDown size={14} className="text-muted-foreground shrink-0" />
                            ) : (
                              <ChevronRight size={14} className="text-muted-foreground shrink-0" />
                            )}
                            {isOpen ? (
                              <FolderOpen
                                size={15}
                                className={isRootPreview ? 'text-emerald-600 shrink-0' : 'text-amber-500 shrink-0'}
                              />
                            ) : (
                              <FolderIcon
                                size={15}
                                className={isRootPreview ? 'text-emerald-600 shrink-0' : 'text-amber-500 shrink-0'}
                              />
                            )}
                            <span className="truncate text-sm font-bold flex-1">{item.name}</span>
                            {isRootPreview && (
                              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-card border border-emerald-200 rounded px-1.5 py-0.5">
                                Preview
                              </span>
                            )}
                          </Button>
                        );
                      }
                      const parentOpen = expanded[item.folder_id] ?? true;
                      if (!parentOpen) return null;
                      return (
                        <Button
                          type="button"
                          variant="ghost"
                          key={`d-${item.uid}`}
                          onClick={() =>
                            setPreviewDoc({
                              uid: item.uid,
                              name: item.name,
                              url: item.url,
                              kind: fileKind(item.name, item.file_type),
                            })
                          }
                          className="w-full group justify-start gap-3 px-4 py-2.5 text-left"
                          style={{ paddingLeft: 36 + item.depth * 20 }}
                        >
                          <div className="h-9 w-9 rounded-lg bg-muted group-hover:bg-card flex items-center justify-center shrink-0 border border-border transition-colors">
                            {fileIcon(item.name, item.file_type)}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="text-sm font-semibold text-foreground truncate group-hover:text-primary-brand transition-colors">
                              {item.name}
                            </div>
                            <div className="text-[11px] text-muted-foreground font-medium">
                              {(item.file_type || '').toUpperCase() || 'FILE'}
                              {item.size ? ` · ${formatBytes(item.size)}` : ''}
                            </div>
                          </div>
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition shrink-0">
                            {fileKind(item.name, item.file_type) === 'video' && (
                              <Play size={12} className="text-muted-foreground" />
                            )}
                            <ExternalLink size={13} className="text-muted-foreground" />
                          </div>
                        </Button>
                      );
                    })}
                  </div>
                </Card>
              )}

              {isPaid && preview.items.some((it) => it.type === 'doc') && (
                <div className="text-[12px] text-muted-foreground px-1 flex items-center gap-1.5 font-medium">
                  <Lock size={11} /> Đây chỉ là phần xem trước. Tham gia để mở khóa toàn bộ bài giảng.
                </div>
              )}
            </div>
          </div>

          <div className="space-y-4">
            <Card>
              <CardContent className="p-5">
                <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">
                  {isPaid ? 'Thanh toán 1 lần' : 'Giá lớp học'}
                </div>
                <div className="flex items-baseline gap-1.5">
                  {isPaid ? (
                    <>
                      <span className="text-2xl font-bold text-foreground">
                        {classroom.price_vnd ? formatPrice(classroom.price_vnd) : '—'}
                      </span>
                      <span className="text-xs text-muted-foreground font-medium">VND</span>
                    </>
                  ) : (
                    <span className="text-2xl font-bold text-emerald-600">Miễn phí</span>
                  )}
                </div>
                <div className="mt-1 flex items-center gap-1.5 text-[11px] text-muted-foreground font-medium">
                  <Users size={11} />
                  <span>Mời tham gia lớp ngay</span>
                </div>
              </CardContent>
            </Card>

            {classroom.teacher_id ? (
              <Link
                href={`/space/me/${classroom.teacher_id}`}
                prefetch={false}
                className="block group"
                aria-label={`Xem trang cá nhân của giáo viên ${teacherName}`}
              >
                <Card>
                  <CardContent className="p-5 flex items-center gap-3.5">
                    <div className="h-12 w-12 rounded-xl bg-primary-brand-light flex items-center justify-center text-primary-brand text-base font-bold overflow-hidden shrink-0">
                      {teacherAvatar ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={teacherAvatar} alt={teacherName} className="h-full w-full object-cover" />
                      ) : (
                        <GraduationCap size={22} />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                        Giáo viên
                      </div>
                      <div className="text-sm font-bold text-foreground truncate group-hover:text-primary-brand transition-colors">
                        {teacherName}
                      </div>
                      <div className="text-[11px] text-muted-foreground mt-0.5 font-medium">
                        Xem trang cá nhân →
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ) : (
              <Card>
                <CardContent className="p-5 flex items-center gap-3.5">
                  <div className="h-12 w-12 rounded-xl bg-primary-brand-light flex items-center justify-center text-primary-brand shrink-0">
                    <GraduationCap size={22} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                      Giáo viên
                    </div>
                    <div className="text-sm font-bold text-foreground truncate">{teacherName}</div>
                  </div>
                </CardContent>
              </Card>
            )}

            {actions.membership_status === 'pending' && (
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-3">
                <Hourglass size={18} className="text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <div className="text-sm font-bold text-amber-900">
                    Đang chờ phê duyệt
                  </div>
                  <div className="text-[12px] text-amber-700/80 mt-0.5 font-medium">
                    Yêu cầu tham gia của bạn đang được giáo viên xem xét.
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 z-30 px-4 pb-4 pt-3 bg-gradient-to-t from-white via-white/95 to-transparent dark:from-slate-950 dark:via-slate-950/95">
        <div className="max-w-7xl mx-auto">
          <div className="bg-card border border-border rounded-2xl shadow-lg p-2.5 flex items-center gap-3">
            <div className="flex-1 min-w-0 pl-2">
              <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                {isPaid ? 'Tổng thanh toán' : 'Quyền truy cập'}
              </div>
              <div className="text-base font-bold text-foreground truncate">
                {isPaid ? formatPrice(classroom.price_vnd || 0) : 'Yêu cầu tham gia'}
              </div>
            </div>
            {actions.membership_status === 'pending' ? (
              <Button
                disabled
                variant="secondary"
                className="h-11 px-5 gap-1.5"
              >
                <Hourglass size={15} /> Đợi phê duyệt
              </Button>
            ) : actions.type === 'none' ? (
              <Button
                onClick={handleOpenClass}
                className="h-11 px-5 gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                <CheckCircle2 size={15} /> Mở lớp
              </Button>
            ) : actions.type === 'checkout' ? (
              <Button
                onClick={handleCheckout}
                disabled={joining}
                className="h-11 px-5 gap-1.5 bg-amber-500 hover:bg-amber-600 text-white"
              >
                <Crown size={15} /> Thanh toán MoMo
              </Button>
            ) : (
              <Button
                onClick={handleJoin}
                disabled={joining}
                className="h-11 px-5 gap-1.5"
              >
                {joining ? <Loader2 size={15} className="animate-spin" /> : <Sparkles size={15} />}
                Tham gia
              </Button>
            )}
          </div>
        </div>
      </div>

      {previewDoc && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setPreviewDoc(null)}
        >
          <div
            className="bg-card rounded-2xl shadow-2xl w-full max-w-5xl h-[85vh] flex flex-col overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-2 px-4 py-3 border-b border-border">
              <p className="text-sm font-bold text-foreground truncate flex-1 min-w-0" title={previewDoc.name}>
                {previewDoc.name}
              </p>
              <a
                href={previewDoc.url}
                target="_blank"
                rel="noopener noreferrer"
                download
                className="p-2 rounded-md hover:bg-muted text-muted-foreground"
                title="Tải xuống"
              >
                <Download size={14} />
              </a>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => setPreviewDoc(null)}
                className="hover:bg-muted text-muted-foreground"
                title="Đóng (Esc)"
              >
                <X size={16} />
              </Button>
            </div>
            <div className="flex-1 min-h-0 flex items-center justify-center bg-muted p-4 overflow-auto">
              {previewDoc.kind === 'image' ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={previewDoc.url}
                  alt={previewDoc.name}
                  className="max-w-full max-h-full object-contain rounded-lg shadow"
                />
              ) : previewDoc.kind === 'video' ? (
                <video
                  src={previewDoc.url}
                  controls
                  autoPlay
                  className="max-w-full max-h-full rounded-lg shadow bg-black"
                />
              ) : previewDoc.kind === 'audio' ? (
                <div className="w-full max-w-md bg-card rounded-2xl p-6 shadow border border-border">
                  <p className="text-sm font-bold text-foreground mb-4 truncate" title={previewDoc.name}>
                    {previewDoc.name}
                  </p>
                  <audio src={previewDoc.url} controls autoPlay className="w-full" />
                </div>
              ) : previewDoc.kind === 'pdf' ? (
                <iframe
                  src={previewDoc.url}
                  title={previewDoc.name}
                  className="w-full h-full rounded-lg shadow bg-white"
                />
              ) : (
                <div className="text-center text-muted-foreground">
                  <p className="text-sm font-medium mb-3">
                    Không hỗ trợ xem trước cho định dạng này.
                  </p>
                  <a
                    href={previewDoc.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block"
                  >
                    <Button size="sm">
                      <Download size={13} className="mr-1" /> Tải xuống
                    </Button>
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
