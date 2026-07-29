'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Button } from '@shared/components/ui/button';
import { toast } from 'sonner';
import { ClipboardList, Filter, Inbox, Layers } from 'lucide-react';
import { useTranslation } from '@shared/components/LocaleProvider';
import { spaceLeaveRequestApi } from '@/lib/api';
import {
  LeaveRequest,
  LeaveRequestStatus,
  ProcessLeaveRequestInput,
} from '@shared/lib/api/leaveRequest';
import {
  LeaveRequestList,
  ProcessLeaveRequestDialog,
} from '@shared/components/leave-request';
import { cn } from '@shared/lib/utils';

const FILTERS: Array<{ key: LeaveRequestStatus | 'all'; labelKey: string }> = [
  { key: 'pending', labelKey: 'leave_request.page.filter_pending' },
  { key: 'approved', labelKey: 'leave_request.page.filter_approved' },
  { key: 'rejected', labelKey: 'leave_request.page.filter_rejected' },
  { key: 'cancelled', labelKey: 'leave_request.page.filter_cancelled' },
  { key: 'all', labelKey: 'leave_request.page.filter_all' },
];

export default function SpaceLeaveRequestsPage() {
  const { t } = useTranslation();
  const [items, setItems] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<LeaveRequestStatus | 'all'>('pending');
  const [classroomId, setClassroomId] = useState<string | null>(null);
  const [viewing, setViewing] = useState<LeaveRequest | null>(null);
  const [processing, setProcessing] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await spaceLeaveRequestApi.list();
      setItems(Array.isArray(data) ? data : []);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('leave_request.actions.process_error'));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [load]);

  const classrooms = useMemo(() => {
    const map = new Map<string, string>();
    for (const req of items) {
      if (req.classroom_id) {
        const key = req.classroom_id;
        if (!map.has(key)) {
          map.set(key, req.classroom_name || key);
        }
      }
    }
    return Array.from(map, ([id, name]) => ({ id, name })).sort((a, b) =>
      a.name.localeCompare(b.name)
    );
  }, [items]);

  const filteredItems = useMemo(() => {
    return items.filter((it) => {
      if (filter !== 'all' && it.status !== filter) return false;
      if (classroomId) {
        if (!it.classroom_id) return false;
        if (it.classroom_id !== classroomId) return false;
      }
      return true;
    });
  }, [items, filter, classroomId]);

  const stats = useMemo(() => {
    return {
      pending: items.filter((i) => i.status === 'pending').length,
      approved: items.filter((i) => i.status === 'approved').length,
      rejected: items.filter((i) => i.status === 'rejected').length,
    };
  }, [items]);

  const handleProcess = async (input: ProcessLeaveRequestInput) => {
    if (!viewing) return;
    setProcessing(true);
    try {
      await spaceLeaveRequestApi.process(viewing.uid, input);
      toast.success(t('leave_request.actions.process_success'));
      setViewing(null);
      await load();
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-700 text-[11px] font-semibold mb-2">
            <ClipboardList size={11} />
            {t('leave_request.page.title_teacher')}
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            {t('leave_request.page.title_teacher')}
          </h1>
          <p className="text-slate-600 text-[14px] mt-1">
            {t('leave_request.page.subtitle_teacher')}
          </p>
        </div>
        {stats.pending > 0 && (
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-50 text-amber-700 text-[12.5px] font-semibold border border-amber-200">
            <Inbox size={14} />
            {stats.pending} {t('leave_request.page.stats.pending').toLowerCase()}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <StatCard label={t('leave_request.page.stats.pending')} value={stats.pending} tone="amber" />
        <StatCard label={t('leave_request.page.stats.approved')} value={stats.approved} tone="emerald" />
        <StatCard label={t('leave_request.page.stats.rejected')} value={stats.rejected} tone="rose" />
      </div>

      <div className="space-y-2">
        <div className="flex items-center gap-2 flex-wrap">
          <Filter size={14} className="text-slate-400" />
          {FILTERS.map((f) => (
            <Button
              key={f.key}
              type="button"
              onClick={() => setFilter(f.key)}
              className={cn(
                'h-8 px-3 rounded-lg text-[12px] font-semibold border transition-colors',
                filter === f.key
                  ? 'bg-indigo-600 text-white border-indigo-600'
                  : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
              )}
            >
              {t(f.labelKey, f.key)}
            </Button>
          ))}
        </div>

        {classrooms.length > 0 && (
          <div className="flex items-center gap-2 flex-wrap">
            <Layers size={14} className="text-slate-400" />
            <Button
              type="button"
              onClick={() => setClassroomId(null)}
              className={cn(
                'h-8 px-3 rounded-lg text-[12px] font-semibold border transition-colors',
                classroomId === null
                  ? 'bg-slate-900 text-white border-slate-900'
                  : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
              )}
            >
              {t('leave_request.page.filter_all_classrooms', 'Tất cả lớp')}
            </Button>
            {classrooms.map((c) => (
              <Button
                key={c.id}
                type="button"
                onClick={() => setClassroomId(c.id)}
                className={cn(
                  'h-8 px-3 rounded-lg text-[12px] font-semibold border transition-colors',
                  classroomId === c.id
                    ? 'bg-slate-900 text-white border-slate-900'
                    : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
                )}
              >
                {c.name}
              </Button>
            ))}
          </div>
        )}
      </div>

      <LeaveRequestList
        items={filteredItems}
        loading={loading}
        emptyMessage={t('leave_request.list.empty_teacher')}
        showStudent
        showEvent
        groupByClassroom={classroomId === null}
        onSelect={(req) => setViewing(req)}
      />

      <ProcessLeaveRequestDialog
        open={Boolean(viewing)}
        onOpenChange={(o) => !o && setViewing(null)}
        request={viewing}
        onSubmit={handleProcess}
        processing={processing}
      />
    </div>
  );
}

function StatCard({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: 'amber' | 'emerald' | 'rose';
}) {
  const TONES: Record<typeof tone, string> = {
    amber: 'bg-amber-50 text-amber-700 border-amber-200',
    emerald: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    rose: 'bg-rose-50 text-rose-700 border-rose-200',
  };
  return (
    <div className={cn('rounded-xl border p-3', TONES[tone])}>
      <div className="text-[11px] font-semibold uppercase tracking-wider opacity-80">{label}</div>
      <div className="text-2xl font-bold mt-1">{value}</div>
    </div>
  );
}
