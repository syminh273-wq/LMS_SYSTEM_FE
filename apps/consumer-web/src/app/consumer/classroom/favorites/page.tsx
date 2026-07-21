'use client';

import * as React from 'react';
import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { classroomApi, type ClassroomFavoriteItem } from '@/lib/api';
import { useRequireAuth } from '@/lib/hooks/use-require-auth';
import { ClassroomFavoriteButton } from '@/components/classroom/ClassroomFavoriteButton';
import {
  Heart,
  Loader2,
  Search,
  Crown,
  Compass,
  ArrowRight,
} from 'lucide-react';
import { Button } from '@shared/components/ui/button';

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

export default function FavoritesPage() {
  const router = useRouter();
  const { isAuthenticated, mounted } = useRequireAuth();

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
    <div className="space-y-6 pb-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
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

      <div className="relative max-w-xl">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Tìm trong yêu thích..."
          className="w-full pl-9 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl outline-none focus:ring-4 focus:ring-rose-500/10 focus:border-rose-500 transition-all text-sm font-medium"
        />
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
            <Compass size={14} /> Khám phá lớp học
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
            const grad = coverGradientFor(classroom.uid);
            const cat = CATEGORY_LABELS[classroom.category || 'other'] || CATEGORY_LABELS.other;
            return (
              <div
                key={classroom.uid}
                className="group bg-white border border-slate-200 rounded-2xl overflow-hidden card-elevated hover:shadow-lg transition-all flex flex-col"
              >
                <div className={`h-28 bg-gradient-to-br ${grad} relative flex items-end p-3`}>
                  <div className="absolute top-3 right-3">
                    <ClassroomFavoriteButton
                      classroomUid={classroom.uid}
                      initialIsFavorited={true}
                      initialCount={classroom.favorite_count || 0}
                      variant="overlay"
                      onChange={onFavoriteChange(classroom.uid)}
                    />
                  </div>
                  <div className="absolute top-3 left-3 flex flex-col gap-1 items-start">
                    <span className="text-[10px] font-black uppercase tracking-widest text-white bg-black/30 backdrop-blur px-2 py-0.5 rounded">
                      {cat.emoji} {cat.label}
                    </span>
                    {isPaid ? (
                      <span className="text-[10px] font-black uppercase tracking-widest text-amber-900 bg-amber-100/90 backdrop-blur px-2 py-0.5 rounded inline-flex items-center gap-1">
                        <Crown size={10} /> {classroom.price_vnd ? formatPrice(classroom.price_vnd) : 'PAID'}
                      </span>
                    ) : (
                      <span className="text-[10px] font-black uppercase tracking-widest text-emerald-900 bg-emerald-100/90 backdrop-blur px-2 py-0.5 rounded">
                        Free
                      </span>
                    )}
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-white/95 text-slate-800 flex items-center justify-center text-base font-black shadow-md">
                    {classroom.name?.[0]?.toUpperCase() || '?'}
                  </div>
                </div>

                <div className="p-4 flex-1 flex flex-col gap-2">
                  <h3 className="font-bold text-foreground text-[15px] leading-tight line-clamp-2 group-hover:text-rose-600 transition-colors">
                    {classroom.name}
                  </h3>
                  <p className="text-[12px] text-slate-500 line-clamp-2 min-h-[2.4em]">
                    {classroom.description || 'Lớp học này chưa có mô tả.'}
                  </p>
                </div>

                <div className="px-4 pb-4 pt-2 border-t border-slate-100 bg-slate-50/50">
                  <button
                    type="button"
                    onClick={() => router.push(`/consumer/classroom/preview/${classroom.uid}`)}
                    className="w-full h-10 rounded-xl bg-rose-500 text-white text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-1 hover:bg-rose-600 transition active:scale-95"
                  >
                    <ArrowRight size={14} /> Xem trước
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
