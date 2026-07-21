'use client';

import * as React from 'react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { classroomApi, Classroom } from '@/lib/api';
import { useRequireAuth } from '@/lib/hooks/use-require-auth';
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
} from 'lucide-react';

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
      // Debug: log first row membership_status so we can see what the
      // backend actually returned (delete after verified).
      if ((res.results as any[])?.[0]) {
        const first = (res.results as any[])[0];
        // eslint-disable-next-line no-console
        console.log('[discover] first row', {
          name: first.name,
          membership_status: first.membership_status,
          is_joined: first.is_joined,
          has_paid: first.has_paid,
        });
      }
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
        <Loader2 size={32} className="animate-spin text-slate-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
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
            className="w-full pl-9 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl outline-none focus:ring-4 focus:ring-primary-brand/10 focus:border-primary-brand transition-all text-sm font-medium"
          />
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setCategory(null)}
            className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
              !category
                ? 'bg-primary-brand text-white shadow-sm shadow-primary-brand/20'
                : 'bg-white border border-slate-200 text-slate-600 hover:border-primary-brand'
            }`}
          >
            <Filter size={12} className="inline mr-1" /> Tất cả
          </button>
          {CATEGORIES.map((c) => (
            <button
              key={c.value}
              type="button"
              onClick={() => setCategory(category === c.value ? null : c.value)}
              className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
                category === c.value
                  ? 'bg-primary-brand text-white shadow-sm shadow-primary-brand/20'
                  : 'bg-white border border-slate-200 text-slate-600 hover:border-primary-brand'
              }`}
            >
              <span className="mr-1">{c.emoji}</span>
              {c.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-1 ml-1">
          {[
            { value: 'all' as PricingFilter, label: 'Tất cả giá' },
            { value: 'free' as PricingFilter, label: 'Miễn phí' },
            { value: 'paid' as PricingFilter, label: 'Trả phí' },
          ].map((p) => (
            <button
              key={p.value}
              type="button"
              onClick={() => setPricing(p.value)}
              className={`text-xs font-bold px-3 py-1.5 rounded-lg transition ${
                pricing === p.value
                  ? 'bg-slate-900 text-white'
                  : 'text-slate-500 hover:bg-slate-100'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {loading && results.length === 0 ? (
        <div className="flex items-center justify-center py-20 text-slate-400">
          <Loader2 size={28} className="animate-spin mr-2" />
          <span className="text-sm font-medium">Đang tải danh sách lớp học...</span>
        </div>
      ) : results.length === 0 ? (
        <div className="text-center py-20 bg-white border border-dashed border-slate-200 rounded-3xl">
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
            const grad = coverGradientFor(c.uid);
            // eslint-disable-next-line no-console
            console.log('[card]', c.name, 'status=', status, 'is_joined=', c.is_joined);
            return (
              <div
                key={c.uid}
                className="group bg-white border border-slate-200 rounded-2xl overflow-hidden card-elevated hover:shadow-lg transition-all flex flex-col"
              >
                <div className={`h-28 bg-gradient-to-br ${grad} relative flex items-end p-3`}>
                  <div className="absolute top-3 right-3 flex flex-col items-end gap-1">
                    {isPaid ? (
                      <span className="text-[10px] font-black uppercase tracking-widest text-amber-900 bg-amber-100/90 backdrop-blur px-2 py-0.5 rounded">
                        <Crown size={10} className="inline mr-0.5" />
                        {c.price_vnd ? formatPrice(c.price_vnd) : 'PAID'}
                      </span>
                    ) : (
                      <span className="text-[10px] font-black uppercase tracking-widest text-emerald-900 bg-emerald-100/90 backdrop-blur px-2 py-0.5 rounded">
                        Free
                      </span>
                    )}
                    {isPaid && isPending && c.has_paid && (
                      <span className="text-[10px] font-black uppercase tracking-widest text-white bg-emerald-500/90 backdrop-blur px-2 py-0.5 rounded">
                        Đã thanh toán
                      </span>
                    )}
                  </div>
                  <div className="absolute top-3 left-3">
                    <span className="text-[10px] font-black uppercase tracking-widest text-white bg-black/30 backdrop-blur px-2 py-0.5 rounded">
                      {categoryEmoji(c.category)} {categoryLabel(c.category)}
                    </span>
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-white/95 text-slate-800 flex items-center justify-center text-base font-black shadow-md">
                    {c.name?.[0]?.toUpperCase() || '?'}
                  </div>
                </div>

                <div className="p-4 flex-1 flex flex-col gap-2">
                  <h3 className="font-bold text-foreground text-[15px] leading-tight line-clamp-2 group-hover:text-primary-brand transition-colors">
                    {c.name}
                  </h3>
                  <p className="text-[12px] text-slate-500 line-clamp-2 min-h-[2.4em]">
                    {c.description || 'Lớp học này chưa có mô tả.'}
                  </p>
                  <div className="flex items-center gap-1 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                    <Hash size={10} /> {c.pid}
                  </div>
                </div>

                <div className="px-4 pb-4 pt-2 border-t border-slate-100 bg-slate-50/50">
                  {isApproved ? (
                    <button
                      type="button"
                      onClick={() => router.push(`/consumer/classroom/${c.uid}`)}
                      className="w-full h-10 rounded-xl bg-emerald-500 text-white text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-1 hover:bg-emerald-600 transition"
                    >
                      <CheckCircle2 size={14} /> Đã tham gia · Mở lớp
                    </button>
                  ) : isPending ? (
                    <button
                      type="button"
                      onClick={() => router.push(`/consumer/classroom/${c.uid}`)}
                      className="w-full h-10 rounded-xl bg-amber-500 text-white text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-1 hover:bg-amber-600 transition"
                    >
                      <Hourglass size={14} /> {c.has_paid ? 'Đã thanh toán · ' : ''}Chờ giáo viên duyệt
                    </button>
                  ) : (
                    <button
                      type="button"
                      disabled={joining === c.uid}
                      onClick={() => handleJoin(c)}
                      className="w-full h-10 rounded-xl bg-indigo-600 text-white text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-1 hover:bg-indigo-700 transition active:scale-95 disabled:opacity-60"
                    >
                      {joining === c.uid ? (
                        <Loader2 size={14} className="animate-spin" />
                      ) : isPaid ? (
                        <Crown size={14} />
                      ) : (
                        <Sparkles size={14} />
                      )}
                      {isPaid ? 'Mua & tham gia' : 'Yêu cầu tham gia'}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-2">
          <button
            type="button"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="h-9 px-4 rounded-lg bg-white border border-slate-200 text-xs font-bold disabled:opacity-50 hover:border-primary-brand"
          >
            Trang trước
          </button>
          <div className="text-xs font-bold text-muted-foreground">
            Trang {page} / {totalPages}
          </div>
          <button
            type="button"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="h-9 px-4 rounded-lg bg-white border border-slate-200 text-xs font-bold disabled:opacity-50 hover:border-primary-brand"
          >
            Trang sau
          </button>
        </div>
      )}
    </div>
  );
}
