'use client';

import * as React from 'react';
import { Button } from '@shared/components/ui/button';
import { useState } from 'react';
import { Heart } from 'lucide-react';
import { classroomApi } from '@/lib/api';
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
      'h-9 w-9 rounded-full bg-background/90 backdrop-blur shadow-sm hover:bg-background text-foreground',
    inline:
      'h-8 px-3 rounded-full border text-xs font-bold',
  };
  const activeCls = isFavorited
    ? 'border-destructive/30 bg-destructive/10 text-destructive hover:bg-destructive/20'
    : 'border-border bg-background text-muted-foreground hover:border-destructive/30 hover:text-destructive';

  if (variant === 'overlay') {
    return (
      <Button
        type="button"
        variant="ghost"
        onClick={handleClick}
        disabled={busy}
        aria-label={isFavorited ? 'Bỏ yêu thích' : 'Yêu thích'}
        className={cn(base, variants.overlay, className)}
      >
        <Heart
          size={16}
          className={cn(isFavorited && 'fill-destructive text-destructive')}
        />
      </Button>
    );
  }

  return (
    <Button
      type="button"
      variant="ghost"
      onClick={handleClick}
      disabled={busy}
      className={cn(base, variants.inline, activeCls, className)}
    >
      <Heart
        size={13}
        className={cn(isFavorited && 'fill-destructive text-destructive')}
      />
      <span>{isFavorited ? 'Đã thích' : 'Yêu thích'}</span>
      {count > 0 && <span className="text-muted-foreground font-medium">· {count}</span>}
    </Button>
  );
}
