import * as React from 'react';
import Link from 'next/link';
import { BookOpen, CheckCircle2, Clock, XCircle, AlertTriangle, Loader2, History as HistoryIcon } from 'lucide-react';
import { Card, CardContent } from '@shared/components/ui/card';
import { cn } from '@shared/lib/utils';
import type { JoinHistoryItem } from '@/lib/api/classroom';

type Props = { items: JoinHistoryItem[]; loading?: boolean };

function formatDate(iso?: string | null): string {
  if (!iso) return '';
  try {
    return new Date(iso).toLocaleString('vi-VN');
  } catch {
    return '';
  }
}

const STATUS_BADGE: Record<string, { label: string; icon: React.ElementType; cls: string }> = {
  approved: { label: 'Đã tham gia', icon: CheckCircle2, cls: 'text-success bg-success/10 ring-success/30' },
  pending: { label: 'Chờ duyệt', icon: Clock, cls: 'text-warning bg-warning/10 ring-warning/30' },
  rejected: { label: 'Bị từ chối', icon: XCircle, cls: 'text-destructive bg-destructive/10 ring-destructive/30' },
  left: { label: 'Đã rời', icon: AlertTriangle, cls: 'text-muted-foreground bg-muted ring-border' },
};

export function JoinHistoryList({ items, loading }: Props) {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-16 text-muted-foreground">
        <Loader2 size={28} className="animate-spin" />
      </div>
    );
  }
  if (items.length === 0) {
    return <EmptyState />;
  }
  return (
    <div className="space-y-3">
      {items.map((it) => {
        const badge = STATUS_BADGE[it.status] ?? {
          label: it.status,
          icon: Clock,
          cls: 'text-muted-foreground bg-muted ring-border',
        };
        const Icon = badge.icon;
        const isActive = it.status === 'approved' && !it.is_deleted;
        return (
          <Link
            key={`${it.classroom_uid}-${it.joined_at ?? ''}`}
            href={isActive ? `/consumer/classroom/${it.classroom_uid}` : `/consumer/classroom/preview/${it.classroom_uid}`}
            className="block group"
          >
            <Card>
              <CardContent className="p-4 sm:p-5 flex items-center gap-4">
                <div className="shrink-0 w-11 h-11 rounded-xl bg-primary/15 text-primary flex items-center justify-center">
                  <BookOpen size={20} strokeWidth={2.2} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-bold text-foreground truncate">
                      {it.classroom_name || 'Lớp học'}
                    </p>
                    <span className={cn('inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ring-1', badge.cls)}>
                      <Icon size={10} strokeWidth={2.5} />
                      {badge.label}
                    </span>
                    {it.has_paid && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ring-1 text-primary bg-primary/10 ring-primary/30">
                        Đã thanh toán
                      </span>
                    )}
                  </div>
                  <p className="text-[12px] text-muted-foreground mt-0.5">
                    {it.teacher_name ? `GV: ${it.teacher_name} · ` : ''}
                    {it.is_deleted ? 'Đã xóa' : `Tham gia: ${formatDate(it.joined_at)}`}
                  </p>
                </div>
                <div className="text-right shrink-0 text-[10px] text-primary font-semibold opacity-0 group-hover:opacity-100 transition-opacity">
                  Mở lớp →
                </div>
              </CardContent>
            </Card>
          </Link>
        );
      })}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="rounded-2xl border-2 border-dashed border-border bg-muted/50 p-12 text-center">
      <div className="w-14 h-14 rounded-2xl bg-muted mx-auto flex items-center justify-center text-muted-foreground">
        <HistoryIcon size={26} />
      </div>
      <h3 className="mt-4 text-sm font-bold text-foreground">Chưa có lịch sử tham gia lớp</h3>
      <p className="mt-1 text-[12px] text-muted-foreground">Các lớp bạn đã tham gia sẽ hiển thị tại đây.</p>
    </div>
  );
}
