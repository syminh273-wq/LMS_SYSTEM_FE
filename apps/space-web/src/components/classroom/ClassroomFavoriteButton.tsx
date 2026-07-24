'use client';

import * as React from 'react';
import { useState } from 'react';
import { Heart } from 'lucide-react';
import { classroomApi } from '@/lib/api/classroom';
import { cn } from '@shared/lib/utils';
import { toast } from 'sonner';

type Variant = 'overlay' | 'inline';

interface Props {
  classroomUid: string;
  initialIsFavorited: boolean;
  initialCount: number;
  variant?: Variant;
  className?: string;
  onChange?: (next: { is_favorited: boolean; favorite_count: number }) => void;
}

export function ClassroomFavoriteButton({
  classroomUid,
  initialIsFavorited,
  initialCount,
  variant = 'inline',
  className,
  onChange,
}: Props) {
  const [isFavorited, setIsFavorited] = useState(initialIsFavorited);
  const [count, setCount] = useState(initialCount);
  const [busy, setBusy] = useState(false);

  const handleClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (busy) return;
    setBusy(true);
    const prev = { isFavorited, count };
    setIsFavorited(!prev.isFavorited);
    setCount(prev.isFavorited ? Math.max(0, prev.count - 1) : prev.count + 1);
    try {
      const res = await classroomApi.favoriteToggle(classroomUid);
      setIsFavorited(res.is_favorited);
      setCount(res.favorite_count);
      onChange?.({ is_favorited: res.is_favorited, favorite_count: res.favorite_count });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Không thể cập nhật yêu thích';
      setIsFavorited(prev.isFavorited);
      setCount(prev.count);
      toast.error(msg);
    } finally {
      setBusy(false);
    }
  };

  const base =
    'inline-flex items-center justify-center gap-1.5 transition active:scale-95 disabled:opacity-60';
  const variants: Record<Variant, string> = {
    overlay:
      'h-9 w-9 rounded-full bg-white/90 backdrop-blur shadow-sm hover:bg-white text-slate-700',
    inline:
      'h-8 px-3 rounded-full border text-xs font-bold',
  };
  const activeCls = isFavorited
    ? 'border-rose-200 bg-rose-50 text-rose-600 hover:bg-rose-100'
    : 'border-slate-200 bg-white text-slate-500 hover:border-rose-200 hover:text-rose-500';

  if (variant === 'overlay') {
    return (
      <button
        type="button"
        onClick={handleClick}
        disabled={busy}
        aria-label={isFavorited ? 'Bỏ yêu thích' : 'Yêu thích'}
        className={cn(base, variants.overlay, className)}
      >
        <Heart
          size={16}
          className={cn(isFavorited && 'fill-rose-500 text-rose-500')}
        />
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={busy}
      className={cn(base, variants.inline, activeCls, className)}
    >
      <Heart
        size={13}
        className={cn(isFavorited && 'fill-rose-500 text-rose-500')}
      />
      <span>{isFavorited ? 'Đã thích' : 'Yêu thích'}</span>
      {count > 0 && <span className="text-slate-400 font-medium">· {count}</span>}
    </button>
  );
}
