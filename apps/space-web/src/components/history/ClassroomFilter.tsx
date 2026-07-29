import { useEffect, useState } from 'react';
import { Filter, Loader2 } from 'lucide-react';
import { classroomApi } from '@/lib/api/classroom';
import { cn } from '@shared/lib/utils';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@shared/components/ui/select';

export type ClassroomOption = {
  uid: string;
  name: string;
};

type Props = {
  value: string | 'all';
  onChange: (next: string | 'all') => void;
  className?: string;
};

export function ClassroomFilter({ value, onChange, className }: Props) {
  const [options, setOptions] = useState<ClassroomOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        const res = await classroomApi.mine(1);
        const list = Array.isArray(res) ? res : res?.results ?? [];
        if (!cancelled) {
          setOptions(
            list.map((c: { uid: string; name: string }) => ({ uid: c.uid, name: c.name }))
          );
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Không tải được danh sách lớp');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <Filter size={14} className="text-muted-foreground" />
      <Select
        value={value}
        onValueChange={(v) => onChange(v as string | 'all')}
        disabled={loading}
      >
        <SelectTrigger className="h-auto">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Tất cả lớp</SelectItem>
          {options.map((opt) => (
            <SelectItem key={opt.uid} value={opt.uid}>
              {opt.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {loading && <Loader2 size={12} className="animate-spin text-muted-foreground" />}
      {error && <span className="text-[11px] text-destructive">{error}</span>}
    </div>
  );
}
