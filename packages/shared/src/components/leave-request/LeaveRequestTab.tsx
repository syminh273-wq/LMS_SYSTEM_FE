'use client';

import * as React from 'react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { Plus, Loader2, CalendarOff } from 'lucide-react';
import { useTranslation } from '@shared/components/LocaleProvider';
import {
  CreateLeaveRequestInput,
  LeaveRequest,
  LeaveRequestEventOption,
  LeaveRequestStatus,
} from '@shared/lib/api/leaveRequest';
import {
  LeaveRequestForm,
  LeaveRequestList,
  ProcessLeaveRequestDialog,
} from './index';

const FILTERS: Array<{ key: LeaveRequestStatus | 'all'; labelKey: string }> = [
  { key: 'all', labelKey: 'leave_request.page.filter_all' },
  { key: 'pending', labelKey: 'leave_request.page.filter_pending' },
  { key: 'approved', labelKey: 'leave_request.page.filter_approved' },
  { key: 'rejected', labelKey: 'leave_request.page.filter_rejected' },
  { key: 'cancelled', labelKey: 'leave_request.page.filter_cancelled' },
];

export interface LeaveRequestTabProps {
  role: 'student' | 'teacher';
  classroomId: string;
  classroomName?: string;
  api: {
    list: (params: { classroom_id?: string; status?: LeaveRequestStatus }) => Promise<LeaveRequest[]>;
    create?: (input: CreateLeaveRequestInput) => Promise<LeaveRequest>;
    cancel?: (uid: string) => Promise<LeaveRequest>;
    process?: (uid: string, input: { status: 'approved' | 'rejected'; rejection_reason?: string }) => Promise<LeaveRequest>;
  };
  listEvents?: () => Promise<LeaveRequestEventOption[]>;
  initialFilter?: LeaveRequestStatus | 'all';
  onChanged?: () => void;
  canCreate?: boolean;
}

export function LeaveRequestTab({
  role,
  classroomId,
  classroomName,
  api,
  listEvents,
  initialFilter = 'all',
  onChanged,
  canCreate,
}: LeaveRequestTabProps) {
  const { t } = useTranslation();
  const [items, setItems] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<LeaveRequestStatus | 'all'>(initialFilter);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [events, setEvents] = useState<LeaveRequestEventOption[]>([]);
  const [processing, setProcessing] = useState<LeaveRequest | null>(null);
  const [processingSaving, setProcessingSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.list({ classroom_id: classroomId });
      setItems(Array.isArray(data) ? data : []);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('leave_request.actions.load_error', 'Không thể tải danh sách đơn.'));
    } finally {
      setLoading(false);
    }
  }, [api, classroomId, t]);

  const loadEvents = useCallback(async () => {
    if (!listEvents) return;
    try {
      const data = await listEvents();
      setEvents(Array.isArray(data) ? data.filter((e) => !classroomId || true) : []);
    } catch {
      setEvents([]);
    }
  }, [listEvents, classroomId]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (dialogOpen && listEvents) {
      loadEvents();
    }
  }, [dialogOpen, loadEvents, listEvents]);

  const filtered = useMemo(() => {
    if (filter === 'all') return items;
    return items.filter((i) => i.status === filter);
  }, [items, filter]);

  const handleCreate = useCallback(async (input: CreateLeaveRequestInput) => {
    if (!api.create) return;
    setSaving(true);
    try {
      await api.create({ ...input, classroom_id: classroomId });
      toast.success(t('leave_request.actions.create_success', 'Đã gửi đơn nghỉ phép.'));
      setDialogOpen(false);
      await load();
      onChanged?.();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('leave_request.actions.create_error', 'Gửi đơn thất bại.'));
      throw err;
    } finally {
      setSaving(false);
    }
  }, [api, classroomId, load, onChanged, t]);

  const handleCancel = useCallback(async (req: LeaveRequest) => {
    if (!api.cancel) return;
    if (!window.confirm(t('leave_request.actions.cancel_confirm', 'Huỷ đơn này?'))) return;
    try {
      await api.cancel(req.uid);
      toast.success(t('leave_request.actions.cancel_success', 'Đã huỷ đơn.'));
      await load();
      onChanged?.();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('leave_request.actions.cancel_error', 'Huỷ đơn thất bại.'));
    }
  }, [api, load, onChanged, t]);

  const handleProcessSubmit = useCallback(async (input: { status: 'approved' | 'rejected'; rejection_reason?: string }) => {
    if (!api.process) return;
    setProcessingSaving(true);
    try {
      const target = processing;
      if (!target) return;
      await api.process(target.uid, input);
      toast.success(
        input.status === 'approved'
          ? t('leave_request.actions.approve_success', 'Đã duyệt đơn.')
          : t('leave_request.actions.reject_success', 'Đã từ chối đơn.')
      );
      setProcessing(null);
      await load();
      onChanged?.();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('leave_request.actions.process_error', 'Xử lý đơn thất bại.'));
    } finally {
      setProcessingSaving(false);
    }
  }, [api, processing, load, onChanged, t]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h3 className="text-[15px] font-bold text-slate-900 inline-flex items-center gap-2">
            <CalendarOff size={16} className="text-slate-500" />
            {t('leave_request.tab.title', 'Đơn xin nghỉ')}
          </h3>
          {classroomName && (
            <p className="text-[12px] text-slate-500 mt-0.5">{classroomName}</p>
          )}
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center bg-white border border-slate-200 rounded-lg p-0.5">
            {FILTERS.map((f) => (
              <button
                type="button"
                key={f.key}
                onClick={() => setFilter(f.key)}
                className={`px-2.5 py-1.5 text-[11.5px] font-semibold rounded-md transition-colors ${
                  filter === f.key
                    ? 'bg-slate-900 text-white'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {t(f.labelKey, f.key)}
              </button>
            ))}
          </div>
          {canCreate !== false && role === 'student' && api.create && (
            <button
              type="button"
              onClick={() => setDialogOpen(true)}
              className="h-9 px-3 rounded-lg bg-indigo-600 text-white text-[12.5px] font-semibold hover:bg-indigo-700 inline-flex items-center gap-1.5"
            >
              <Plus size={14} strokeWidth={2.5} />
              {t('leave_request.tab.create', 'Tạo đơn')}
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center gap-2 py-12 text-[12.5px] text-slate-500">
          <Loader2 size={14} className="animate-spin" />
          {t('leave_request.list.loading', 'Đang tải...')}
        </div>
      ) : (
        <LeaveRequestList
          items={filtered}
          loading={false}
          variant={role}
          showStudent={role === 'teacher'}
          showEvent
          onSelect={(req) => {
            if (role === 'teacher' && api.process && req.status === 'pending') {
              setProcessing(req);
            } else if (role === 'student' && api.cancel && req.status === 'pending') {
              void handleCancel(req);
            }
          }}
        />
      )}

      {role === 'student' && canCreate !== false && (
        <LeaveRequestForm
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          events={events}
          classroomId={classroomId}
          onSubmit={handleCreate}
          saving={saving}
        />
      )}

      {role === 'teacher' && api.process && (
        <ProcessLeaveRequestDialog
          open={processing !== null}
          onOpenChange={(o) => {
            if (!o && !processingSaving) setProcessing(null);
          }}
          request={processing}
          onSubmit={handleProcessSubmit}
          processing={processingSaving}
        />
      )}
    </div>
  );
}
