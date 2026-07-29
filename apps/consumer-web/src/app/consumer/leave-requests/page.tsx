'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { Plus, ClipboardList, Filter, Loader2 } from 'lucide-react';
import { useTranslation } from '@shared/components/LocaleProvider';
import { Button } from '@shared/components/ui/button';
import { consumerCalendarApi, consumerLeaveRequestApi } from '@/lib/api';
import {
  CreateLeaveRequestInput,
  LeaveRequest,
  LeaveRequestEventOption,
  LeaveRequestStatus,
} from '@shared/lib/api/leaveRequest';
import {
  LeaveRequestForm,
  LeaveRequestList,
  LeaveRequestStatusBadge,
} from '@shared/components/leave-request';
import { cn } from '@shared/lib/utils';

const FILTERS: Array<{ key: LeaveRequestStatus | 'all'; labelKey: string }> = [
  { key: 'all', labelKey: 'leave_request.page.filter_all' },
  { key: 'pending', labelKey: 'leave_request.page.filter_pending' },
  { key: 'approved', labelKey: 'leave_request.page.filter_approved' },
  { key: 'rejected', labelKey: 'leave_request.page.filter_rejected' },
  { key: 'cancelled', labelKey: 'leave_request.page.filter_cancelled' },
];

export default function ConsumerLeaveRequestsPage() {
  const { t } = useTranslation();
  const [items, setItems] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<LeaveRequestStatus | 'all'>('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [events, setEvents] = useState<LeaveRequestEventOption[]>([]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await consumerLeaveRequestApi.list();
      setItems(Array.isArray(data) ? data : []);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('leave_request.actions.create_error'));
    } finally {
      setLoading(false);
    }
  }, [t]);

  const loadEvents = useCallback(async () => {
    try {
      const now = new Date();
      const start = new Date(now);
      start.setDate(start.getDate() - 7);
      const end = new Date(now);
      end.setDate(end.getDate() + 60);
      const data = await consumerCalendarApi.list({
        startDate: start.toISOString(),
        endDate: end.toISOString(),
      });
      setEvents(
        (data || []).map((e) => ({
          uid: e.uid,
          title: e.title,
          start_time: e.start_time,
          end_time: e.end_time,
          classroom_name: e.classroom_name ?? null,
        }))
      );
    } catch {
      setEvents([]);
    }
  }, []);

  useEffect(() => {
    load();
    loadEvents();
  }, [load, loadEvents]);

  const filtered = useMemo(() => {
    if (filter === 'all') return items;
    return items.filter((it) => it.status === filter);
  }, [items, filter]);

  const stats = useMemo(() => {
    return {
      total: items.length,
      pending: items.filter((i) => i.status === 'pending').length,
      approved: items.filter((i) => i.status === 'approved').length,
      rejected: items.filter((i) => i.status === 'rejected').length,
    };
  }, [items]);

  const handleSubmit = async (input: CreateLeaveRequestInput) => {
    setSaving(true);
    try {
      await consumerLeaveRequestApi.create(input);
      toast.success(t('leave_request.actions.create_success'));
      setDialogOpen(false);
      await load();
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = async (req: LeaveRequest) => {
    if (!window.confirm(t('leave_request.page.cancel_confirm'))) return;
    try {
      await consumerLeaveRequestApi.cancel(req.uid);
      toast.success(t('leave_request.actions.cancel_success'));
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('leave_request.actions.cancel_error'));
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-700 text-[11px] font-semibold mb-2">
            <ClipboardList size={11} />
            {t('leave_request.page.title_student')}
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            {t('leave_request.page.title_student')}
          </h1>
          <p className="text-slate-600 text-[14px] mt-1">
            {t('leave_request.page.subtitle_student')}
          </p>
        </div>
        <Button
          onClick={() => setDialogOpen(true)}
          className="h-10 px-3.5 rounded-lg bg-indigo-600 text-white text-[13px] font-semibold hover:bg-indigo-700 gap-1.5"
        >
          <Plus size={15} strokeWidth={2.5} />
          {t('leave_request.page.new_request')}
        </Button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard label={t('leave_request.page.stats.total')} value={stats.total} tone="slate" />
        <StatCard label={t('leave_request.page.stats.pending')} value={stats.pending} tone="amber" />
        <StatCard label={t('leave_request.page.stats.approved')} value={stats.approved} tone="emerald" />
        <StatCard label={t('leave_request.page.stats.rejected')} value={stats.rejected} tone="rose" />
      </div>

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

      <LeaveRequestList
        items={filtered}
        loading={loading}
        emptyMessage={t('leave_request.list.empty_student')}
        onSelect={(req) => {
          if (req.status === 'pending') handleCancel(req);
        }}
      />

      <LeaveRequestForm
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        events={events}
        onSubmit={handleSubmit}
        saving={saving}
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
  tone: 'slate' | 'amber' | 'emerald' | 'rose';
}) {
  const TONES: Record<typeof tone, string> = {
    slate: 'bg-slate-50 text-slate-700 border-slate-200',
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
