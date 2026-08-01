'use client';

import * as React from 'react';
import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { classroomApi, type ClassroomFavoriteItem } from '@/lib/api';
import { useRequireAuth } from '@/features/auth/hooks/useRequireAuth';
import { useMe } from '@/features/auth/hooks/useMe';
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
  const { isAuthenticated, isMounted } = useRequireAuth();
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
    if (!isAuthenticated || !isMounted) return;
    void fetchFavorites();
  }, [isAuthenticated, isMounted, fetchFavorites]);

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

  if (!isMounted) {
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
            <Heart size={22} className="text-destructive fill-destructive" /> Lớp học yêu thích
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
            className="w-full pl-9 pr-4 py-2.5 bg-card border border-border rounded-xl outline-none focus:ring-4 focus:ring-destructive/10 focus:border-destructive transition-all text-sm font-medium"
          />
        </div>
      </div>

      {loading && items.length === 0 ? (
        <div className="flex items-center justify-center py-20 text-muted-foreground">
          <Loader2 size={28} className="animate-spin mr-2" />
          <span className="text-sm font-medium">Đang tải danh sách yêu thích...</span>
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-20 bg-card border border-dashed border-border rounded-3xl">
          <Heart size={36} className="mx-auto text-muted-foreground mb-3" />
          <div className="text-sm font-bold text-foreground">Chưa có lớp học yêu thích</div>
          <div className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
            Nhấn biểu tượng trái tim trên lớp học bất kỳ để thêm vào danh sách yêu thích của bạn.
          </div>
          <Button
            onClick={() => router.push('/consumer/discover')}
            className="mt-4 gap-1.5"
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
                  "group bg-card border border-border rounded-2xl flex flex-col transition-colors",
                  isOwnClass
                    ? "cursor-not-allowed opacity-60"
                    : "cursor-pointer hover:border-border"
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
                  <h3 className="font-bold text-foreground text-[15px] leading-tight line-clamp-2 group-hover:text-destructive transition-colors">
                    {classroom.name}
                  </h3>
                  <div className="flex items-center gap-1 text-[11px] font-medium text-muted-foreground">
                    <Hash size={10} /> {classroom.pid}
                  </div>
                </div>

                <div className="flex items-center justify-between gap-3 px-4 py-3 border-t border-border">
                  <span className="text-sm font-bold text-foreground">
                    {classroom.price_vnd ? formatPrice(classroom.price_vnd) : (isPaid ? '—' : 'Miễn phí')}
                  </span>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-destructive bg-destructive/10 border border-destructive/20 px-2.5 py-1 rounded group-hover:text-destructive">
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
