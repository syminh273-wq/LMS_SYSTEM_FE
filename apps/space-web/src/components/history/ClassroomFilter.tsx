'use client';

import { useEffect, useState } from 'react';
import { Filter, Loader2 } from 'lucide-react';
import { classroomApi } from '@/lib/api/classroom';
import { cn } from '@shared/lib/utils';

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
      <Filter size={14} className="text-slate-500" />
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as string | 'all')}
        disabled={loading}
        className="px-3 py-1.5 rounded-lg text-[12px] font-bold border border-slate-200 bg-white text-slate-700 hover:border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-200 disabled:opacity-60"
      >
        <option value="all">Tất cả lớp</option>
        {options.map((opt) => (
          <option key={opt.uid} value={opt.uid}>
            {opt.name}
          </option>
        ))}
      </select>
      {loading && <Loader2 size={12} className="animate-spin text-slate-400" />}
      {error && <span className="text-[11px] text-rose-500">{error}</span>}
    </div>
  );
}
