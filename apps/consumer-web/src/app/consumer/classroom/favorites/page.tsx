'use client';

import * as React from 'react';
import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { classroomApi, type ClassroomFavoriteItem } from '@/lib/api';
import { useRequireAuth } from '@/lib/hooks/use-require-auth';
import { useMe } from '@/lib/hooks/use-me';
import { toast } from 'sonner';
import { ClassroomFavoriteButton } from '@/components/classroom/ClassroomFavoriteButton';
import { cn } from '@/lib/utils';
import {
  Heart,
  Loader2,
  Search,
  Hash,
} from 'lucide-react';
import { Button } from '@shared/components/ui/button';

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

export default function FavoritesPage() {
  const router = useRouter();
  const { isAuthenticated, mounted } = useRequireAuth();
  const { me } = useMe();

  const [items, setItems] = useState<ClassroomFavoriteItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');

  const fetchFavorites = useCallback(async () => {
    setLoading(true);
    try {
      const res = await classroomApi.favorites(1);
      setItems(res.results);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isAuthenticated || !mounted) return;
    void fetchFavorites();
  }, [isAuthenticated, mounted, fetchFavorites]);

  const filtered = items.filter((it) => {
    if (!search.trim()) return true;
    const needle = search.toLowerCase();
    return (
      it.classroom.name.toLowerCase().includes(needle) ||
      (it.classroom.description || '').toLowerCase().includes(needle)
    );
  });

  const onFavoriteChange = (uid: string) => (next: { is_favorited: boolean; favorite_count: number }) => {
    if (!next.is_favorited) {
      setItems((prev) => prev.filter((it) => it.classroom.uid !== uid));
    }
  };

  if (!mounted) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 size={32} className="animate-spin text-slate-400" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6 pb-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-black text-foreground tracking-tight flex items-center gap-2">
            <Heart size={22} className="text-rose-500 fill-rose-500" /> Lớp học yêu thích
          </h1>
          <p className="text-sm text-muted-foreground font-medium mt-1">
            Danh sách các lớp học bạn đã đánh dấu yêu thích
          </p>
        </div>
        <div className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
          {loading ? 'Đang tải...' : `${items.length} lớp học`}
        </div>
      </div>

      <div className="space-y-3">
        <div className="relative max-w-xl">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm trong yêu thích..."
            className="w-full pl-9 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl outline-none focus:ring-4 focus:ring-rose-500/10 focus:border-rose-500 transition-all text-sm font-medium"
          />
        </div>
      </div>

      {loading && items.length === 0 ? (
        <div className="flex items-center justify-center py-20 text-slate-400">
          <Loader2 size={28} className="animate-spin mr-2" />
          <span className="text-sm font-medium">Đang tải danh sách yêu thích...</span>
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-20 bg-white border border-dashed border-slate-200 rounded-3xl">
          <Heart size={36} className="mx-auto text-slate-300 mb-3" />
          <div className="text-sm font-bold text-foreground">Chưa có lớp học yêu thích</div>
          <div className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
            Nhấn biểu tượng trái tim trên lớp học bất kỳ để thêm vào danh sách yêu thích của bạn.
          </div>
          <Button
            onClick={() => router.push('/consumer/discover')}
            className="mt-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold gap-1.5"
          >
            Khám phá lớp học
          </Button>
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-sm text-muted-foreground">
          Không tìm thấy kết quả phù hợp với "{search}".
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map(({ classroom }) => {
            const isPaid = classroom.pricing_type === 'paid';
            const cat = CATEGORY_LABELS[classroom.category || 'other'] || CATEGORY_LABELS.other;
            const isOwnClass = !!me && classroom.teacher_id === me.uid;
            const handleClick = () => {
              if (isOwnClass) {
                toast.info('Đây là lớp học bạn đang giảng dạy. Đang chuyển sang trang quản lý.');
                const base = (typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_SPACE_WEB_URL) || 'http://localhost:3003';
                window.location.href = `${base.replace(/\/+$/, '')}/space/classrooms/${classroom.uid}`;
              } else {
                router.push(`/consumer/classroom/preview/${classroom.uid}`);
              }
            };
            return (
              <div
                key={classroom.uid}
                onClick={handleClick}
                aria-disabled={isOwnClass}
                className={cn(
                  "group bg-white border border-slate-200 rounded-2xl flex flex-col transition-colors",
                  isOwnClass
                    ? "cursor-not-allowed opacity-60"
                    : "cursor-pointer hover:border-slate-300"
                )}
              >
                <div className="flex items-center justify-between gap-2 px-4 pt-3.5 pb-2">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground truncate">
                      {cat.emoji} {cat.label}
                    </span>
                  </div>
                  <ClassroomFavoriteButton
                    classroomUid={classroom.uid}
                    initialIsFavorited={true}
                    initialCount={classroom.favorite_count || 0}
                    variant="overlay"
                    onChange={onFavoriteChange(classroom.uid)}
                  />
                </div>

                <div className="px-4 pb-4 flex-1 flex flex-col gap-1.5">
                  <h3 className="font-bold text-foreground text-[15px] leading-tight line-clamp-2 group-hover:text-rose-600 transition-colors">
                    {classroom.name}
                  </h3>
                  <div className="flex items-center gap-1 text-[11px] font-medium text-muted-foreground">
                    <Hash size={10} /> {classroom.pid}
                  </div>
                </div>

                <div className="flex items-center justify-between gap-3 px-4 py-3 border-t border-slate-100">
                  <span className="text-sm font-bold text-foreground">
                    {classroom.price_vnd ? formatPrice(classroom.price_vnd) : (isPaid ? '—' : 'Miễn phí')}
                  </span>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-rose-700 bg-rose-50 border border-rose-200 px-2.5 py-1 rounded group-hover:text-rose-700">
                    Yêu thích
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
