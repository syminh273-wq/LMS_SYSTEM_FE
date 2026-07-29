'use client';

import * as React from 'react';
import { Button } from '@shared/components/ui/button';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { classroomApi, Classroom } from '@/lib/api';
import { useRequireAuth } from '@/lib/hooks/use-require-auth';
import { useMe } from '@/lib/hooks/use-me';
import { toast } from 'sonner';
import {
  Search,
  Compass,
  Filter,
  Loader2,
  Sparkles,
  Users,
  Hash,
  CheckCircle2,
  Crown,
  BookOpen,
  Clock,
  Hourglass,
  ArrowRight,
} from 'lucide-react';
import { ClassroomFavoriteButton } from '@/components/classroom/ClassroomFavoriteButton';
import { cn } from '@/lib/utils';

type CategoryValue = NonNullable<Classroom['category']>;
type PricingFilter = 'all' | 'free' | 'paid';

const CATEGORIES: Array<{ value: CategoryValue; label: string; emoji: string }> = [
  { value: 'math', label: 'Toán học', emoji: '➗' },
  { value: 'physics', label: 'Vật lý', emoji: '⚛️' },
  { value: 'chemistry', label: 'Hóa học', emoji: '🧪' },
  { value: 'biology', label: 'Sinh học', emoji: '🧬' },
  { value: 'language', label: 'Ngoại ngữ', emoji: '🗣️' },
  { value: 'programming', label: 'Lập trình', emoji: '💻' },
  { value: 'business', label: 'Kinh doanh', emoji: '💼' },
  { value: 'design', label: 'Thiết kế', emoji: '🎨' },
  { value: 'music', label: 'Âm nhạc', emoji: '🎵' },
  { value: 'other', label: 'Khác', emoji: '📚' },
];

const COVER_GRADIENTS = [
  'from-primary to-purple-600',
  'from-success to-teal-600',
  'from-orange-400 to-pink-600',
  'from-sky-500 to-primary',
  'from-destructive to-destructive',
  'from-violet-500 to-fuchsia-600',
  'from-warning to-orange-600',
  'from-cyan-500 to-primary',
];

function coverGradientFor(uid: string): string {
  let h = 0;
  for (let i = 0; i < uid.length; i++) h = (h * 31 + uid.charCodeAt(i)) | 0;
  return COVER_GRADIENTS[Math.abs(h) % COVER_GRADIENTS.length];
}

function categoryLabel(value: string | undefined): string {
  return CATEGORIES.find((c) => c.value === value)?.label || 'Khác';
}

function categoryEmoji(value: string | undefined): string {
  return CATEGORIES.find((c) => c.value === value)?.emoji || '📚';
}

const formatPrice = (n: number) => new Intl.NumberFormat('vi-VN').format(n) + 'đ';

export default function DiscoverPage() {
  const router = useRouter();
  const { isAuthenticated, mounted } = useRequireAuth();
  const { me } = useMe();

  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [category, setCategory] = useState<CategoryValue | null>(null);
  const [pricing, setPricing] = useState<PricingFilter>('all');
  const [page, setPage] = useState(1);
  const [results, setResults] = useState<Array<Classroom & { is_joined?: boolean }>>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [joining, setJoining] = useState<string | null>(null);

  const fetchPage = useCallback(async () => {
    setLoading(true);
    try {
      const res = await classroomApi.discover({
        category: category || undefined,
        pricing_type: pricing === 'all' ? undefined : pricing,
        search: search || undefined,
        page,
      });
      setResults(res.results as any);
      setTotalPages(res.total_pages || 1);
    } catch (e: any) {
      toast.error(e?.message || 'Không thể tải danh sách lớp học');
    } finally {
      setLoading(false);
    }
  }, [category, pricing, search, page]);

  useEffect(() => {
    if (!isAuthenticated || !mounted) return;
    void fetchPage();
  }, [isAuthenticated, mounted, fetchPage]);

  useEffect(() => {
    const t = setTimeout(() => {
      setPage(1);
      setSearch(searchInput.trim());
    }, 300);
    return () => clearTimeout(t);
  }, [searchInput]);

  useEffect(() => {
    setPage(1);
  }, [category, pricing]);

  const handleJoin = useCallback(async (c: Classroom) => {
    try {
      const hasPaid = !!c.has_paid;
      const isAlreadyPending = c.membership_status === 'pending';
      if (hasPaid || isAlreadyPending) {
        toast.info(
          hasPaid
            ? 'Bạn đã thanh toán lớp này, vui lòng chờ giáo viên duyệt.'
            : `Đã gửi yêu cầu tham gia lớp "${c.name}". Vui lòng chờ giáo viên duyệt.`,
        );
        router.push(`/consumer/classroom/${c.uid}`);
        return;
      }
      setJoining(c.uid);
      const res = await classroomApi.quickJoin(c.uid);
      if (res.requires_payment && res.pay_url) {
        toast.info('Lớp học trả phí, đang chuyển đến MoMo...');
        const orderId = res.order_id ? `?order_id=${res.order_id}` : '';
        window.location.href = `/consumer/classroom/checkout/${c.uid}${orderId}`;
        return;
      }
      if (res.membership_status === 'pending') {
        toast.success(`Đã gửi yêu cầu tham gia lớp "${c.name}". Vui lòng chờ giáo viên duyệt.`);
      } else {
        toast.success(`Đã tham gia lớp "${c.name}"!`);
      }
      router.push(`/consumer/classroom/${c.uid}`);
    } catch (e: any) {
      toast.error(e?.message || 'Không thể tham gia lớp');
    } finally {
      setJoining(null);
    }
  }, [router]);

  const headerSubtitle = useMemo(() => {
    if (loading) return 'Đang tải...';
    if (results.length === 0) return 'Chưa có lớp học nào phù hợp';
    return `${results.length} lớp học${totalPages > 1 ? ` · trang ${page}/${totalPages}` : ''}`;
  }, [loading, results.length, totalPages, page]);

  if (!mounted) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 size={32} className="animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6 pb-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-black text-foreground tracking-tight flex items-center gap-2">
            <Compass size={22} className="text-primary-brand" /> Khám phá lớp học
          </h1>
          <p className="text-sm text-muted-foreground font-medium mt-1">
            Tìm và tham gia các lớp học công khai từ giáo viên trên hệ thống
          </p>
        </div>
        <div className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
          {headerSubtitle}
        </div>
      </div>

      <div className="space-y-3">
        <div className="relative max-w-xl">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Tìm theo tên hoặc mô tả lớp học..."
            className="w-full pl-9 pr-4 py-2.5 bg-card border border-border rounded-xl outline-none focus:ring-4 focus:ring-primary-brand/10 focus:border-primary-brand transition-all text-sm font-medium"
          />
        </div>

        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            onClick={() => setCategory(null)}
            data-active={!category}
            className="px-3 py-1.5 rounded-full text-xs font-bold bg-card border border-border text-muted-foreground data-[active=true]:border data-[active=true]:border-primary data-[active=true]:text-primary"
          >
            <Filter size={12} className="inline mr-1" /> Tất cả
          </Button>
          {CATEGORIES.map((c) => (
            <Button
              key={c.value}
              type="button"
              onClick={() => setCategory(category === c.value ? null : c.value)}
              data-active={category === c.value}
              className="px-3 py-1.5 rounded-full text-xs font-bold bg-card border border-border text-muted-foreground data-[active=true]:border data-[active=true]:border-primary data-[active=true]:text-primary"
            >
              <span className="mr-1">{c.emoji}</span>
              {c.label}
            </Button>
          ))}
        </div>

        <div className="flex items-center gap-1 ml-1">
          {[
            { value: 'all' as PricingFilter, label: 'Tất cả giá' },
            { value: 'free' as PricingFilter, label: 'Miễn phí' },
            { value: 'paid' as PricingFilter, label: 'Trả phí' },
          ].map((p) => (
            <Button
              key={p.value}
              type="button"
              onClick={() => setPricing(p.value)}
              className={`text-xs font-bold px-3 py-1.5 rounded-lg transition ${
                pricing === p.value
                  ? 'bg-slate-900 text-white'
                  : 'text-muted-foreground hover:bg-muted'
              }`}
            >
              {p.label}
            </Button>
          ))}
        </div>
      </div>

      {loading && results.length === 0 ? (
        <div className="flex items-center justify-center py-20 text-muted-foreground">
          <Loader2 size={28} className="animate-spin mr-2" />
          <span className="text-sm font-medium">Đang tải danh sách lớp học...</span>
        </div>
      ) : results.length === 0 ? (
        <div className="text-center py-20 bg-card border border-dashed border-border rounded-3xl">
          <Compass size={36} className="mx-auto text-slate-300 mb-3" />
          <div className="text-sm font-bold text-foreground">Chưa có lớp học nào</div>
          <div className="text-xs text-muted-foreground mt-1">
            Thử bỏ bộ lọc hoặc quay lại sau.
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {results.map((c) => {
            const isPaid = c.pricing_type === 'paid';
            const status = c.membership_status as 'pending' | 'approved' | null | undefined;
            const isApproved = status === 'approved';
            const isPending = status === 'pending';
            const hasPaid = !!c.has_paid;
            const isPaidPending = isPaid && (isPending || hasPaid);
            const grad = coverGradientFor(c.uid);
            // Mute the link only when the visitor is the teacher who owns
            // this classroom — everyone else (other teachers + students) can
            // still preview it normally.
            const isOwnClass = !!me && c.teacher_id === me.uid;
            const handleClick = () => {
              if (isOwnClass) {
                toast.info('Đây là lớp học bạn đang giảng dạy. Đang chuyển sang trang quản lý.');
                const base = (typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_SPACE_WEB_URL) || 'http://localhost:3003';
                window.location.href = `${base.replace(/\/+$/, '')}/space/classrooms/${c.uid}`;
              } else {
                router.push(`/consumer/classroom/preview/${c.uid}`);
              }
            };
            return (
              <div
                key={c.uid}
                onClick={handleClick}
                aria-disabled={isOwnClass}
                className={cn(
                  "group bg-card border border-border rounded-2xl flex flex-col transition-colors",
                  isOwnClass
                    ? "cursor-not-allowed opacity-60"
                    : "cursor-pointer hover:border-border"
                )}
              >
                <div className="flex items-center justify-between gap-2 px-4 pt-3.5 pb-2">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground truncate">
                      {categoryEmoji(c.category)} {categoryLabel(c.category)}
                    </span>
                  </div>
                  <ClassroomFavoriteButton
                    classroomUid={c.uid}
                    initialIsFavorited={!!(c as any).is_favorited}
                    initialCount={(c as any).favorite_count || 0}
                    variant="overlay"
                  />
                </div>

                <div className="px-4 pb-4 flex-1 flex flex-col gap-1.5">
                  <h3 className="font-bold text-foreground text-[15px] leading-tight line-clamp-2 group-hover:text-primary-brand transition-colors">
                    {c.name}
                  </h3>
                  <div className="flex items-center gap-1 text-[11px] font-medium text-muted-foreground">
                    <Hash size={10} /> {c.pid}
                  </div>
                </div>

                <div className="flex items-center justify-between gap-3 px-4 py-3 border-t border-border">
                  <span className="text-sm font-bold text-foreground">
                    {c.price_vnd ? formatPrice(c.price_vnd) : (isPaid ? '—' : 'Miễn phí')}
                  </span>
                  {isApproved ? (
                    <span className="text-[10px] font-bold uppercase tracking-widest text-success bg-success/10 border border-success/20 px-2.5 py-1 rounded">
                      Đã tham gia
                    </span>
                  ) : isPending ? (
                    <span className="text-[10px] font-bold uppercase tracking-widest text-warning bg-warning/10 border border-warning/20 px-2.5 py-1 rounded">
                      Chờ duyệt
                    </span>
                  ) : isPaidPending ? (
                    <span className="text-[10px] font-bold uppercase tracking-widest text-warning bg-warning/10 border border-warning/20 px-2.5 py-1 rounded">
                      Chờ duyệt
                    </span>
                  ) : (
                    <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground bg-muted border border-border px-2.5 py-1 rounded group-hover:text-primary group-hover:bg-primary/10 group-hover:border-primary/20 transition-colors">
                      Xem trước →
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-2">
          <Button
            type="button"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="h-9 px-4 rounded-lg bg-card border border-border text-xs font-bold disabled:opacity-50 hover:border-primary-brand"
          >
            Trang trước
          </Button>
          <div className="text-xs font-bold text-muted-foreground">
            Trang {page} / {totalPages}
          </div>
          <Button
            type="button"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="h-9 px-4 rounded-lg bg-card border border-border text-xs font-bold disabled:opacity-50 hover:border-primary-brand"
          >
            Trang sau
          </Button>
        </div>
      )}
    </div>
  );
}
