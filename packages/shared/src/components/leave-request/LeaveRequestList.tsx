'use client';

import { FileText, ExternalLink, Layers, Loader2 } from 'lucide-react';
import { useTranslation } from '@shared/components/LocaleProvider';
import { LeaveRequest } from '@shared/lib/api/leaveRequest';
import { LeaveRequestStatusBadge } from './LeaveRequestStatusBadge';

type TranslateFn = ReturnType<typeof useTranslation>['t'];

interface LeaveRequestListProps {
  items: LeaveRequest[];
  loading?: boolean;
  emptyMessage?: string;
  variant?: 'student' | 'teacher';
  onSelect?: (req: LeaveRequest) => void;
  showStudent?: boolean;
  showEvent?: boolean;
  groupByClassroom?: boolean;
}

function formatDateTime(value: string | null | undefined, locale: string): string {
  if (!value) return '—';
  const d = new Date(value);
  return d.toLocaleString(locale === 'vi' ? 'vi-VN' : 'en-US', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatRange(start: string | null | undefined, end: string | null | undefined, locale: string): string {
  if (!start && !end) return '—';
  if (start && end) {
    return `${formatDateTime(start, locale)} – ${formatDateTime(end, locale)}`;
  }
  return formatDateTime(start ?? end, locale);
}

export function LeaveRequestList({
  items,
  loading = false,
  emptyMessage,
  variant = 'student',
  onSelect,
  showStudent = false,
  showEvent = false,
  groupByClassroom = false,
}: LeaveRequestListProps) {
  const { t, locale } = useTranslation();

  if (loading) {
    return (
      <div className="flex items-center justify-center gap-2 py-12 text-[12.5px] text-slate-500">
        <Loader2 size={14} className="animate-spin" />
        {t('leave_request.list.loading', 'Đang tải...')}
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 py-12 px-6 text-center">
        <p className="text-[13px] text-slate-500">
          {emptyMessage ?? t('leave_request.list.empty', 'Chưa có đơn nào.')}
        </p>
      </div>
    );
  }

  if (groupByClassroom) {
    const groups = groupRequestsByClassroom(items);
    return (
      <div className="space-y-6">
        {groups.map((group) => {
          const label = group.classroomId
            ? group.classroomName || group.classroomId
            : t('leave_request.list.group_no_classroom', 'Không thuộc lớp nào');
          return (
            <section key={group.key} className="space-y-3">
              <header className="flex items-center justify-between gap-2 px-1">
                <div className="inline-flex items-center gap-1.5 text-[12.5px] font-semibold text-slate-700">
                  <Layers size={13} className="text-slate-400" />
                  {label}
                </div>
                <span className="text-[11.5px] font-semibold text-slate-500 bg-slate-100 border border-slate-200 rounded-full px-2 py-0.5">
                  {t('leave_request.list.group_count', '{{count}} đơn', { count: group.items.length })}
                </span>
              </header>
              <div className="space-y-3">
                {group.items.map((req) => (
                  <RequestCard
                    key={req.uid}
                    req={req}
                    onSelect={onSelect}
                    showStudent={showStudent}
                    showEvent={showEvent}
                    t={t}
                    locale={locale}
                  />
                ))}
              </div>
            </section>
          );
        })}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {items.map((req) => (
        <RequestCard
          key={req.uid}
          req={req}
          onSelect={onSelect}
          showStudent={showStudent}
          showEvent={showEvent}
          t={t}
          locale={locale}
        />
      ))}
    </div>
  );
}

interface RequestCardProps {
  req: LeaveRequest;
  onSelect?: (req: LeaveRequest) => void;
  showStudent: boolean;
  showEvent: boolean;
  t: TranslateFn;
  locale: string;
}

function RequestCard({ req, onSelect, showStudent, showEvent, t, locale }: RequestCardProps) {
  return (
    <button
      type="button"
      onClick={() => onSelect?.(req)}
      className="w-full text-left rounded-xl border border-slate-200 bg-white p-4 hover:border-indigo-300 hover:shadow-sm transition-all"
    >
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <LeaveRequestStatusBadge status={req.status} />
            {showStudent && req.student_name && (
              <span className="text-[12px] font-semibold text-slate-700">
                {req.student_name}
              </span>
            )}
            {showEvent && req.event_title && (
              <span className="text-[11.5px] text-slate-500 inline-flex items-center gap-1">
                · {req.event_title}
              </span>
            )}
          </div>
          <p className="text-[13px] text-slate-700 line-clamp-2">{req.reason}</p>
        </div>
        {req.evidence_url && (
          <a
            href={req.evidence_url}
            target="_blank"
            rel="noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="inline-flex items-center gap-1 text-[11.5px] text-indigo-600 hover:text-indigo-800 font-semibold shrink-0"
          >
            <FileText size={12} />
            {t('leave_request.list.view_evidence', 'Minh chứng')}
            <ExternalLink size={10} />
          </a>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11.5px] text-slate-500">
        <div>
          <span className="font-semibold text-slate-600">
            {req.event_id
              ? t('leave_request.list.event', 'Sự kiện')
              : t('leave_request.list.range', 'Khoảng thời gian')}
            :
          </span>{' '}
          {req.event_id ? req.event_title ?? '—' : formatRange(req.start_date, req.end_date, locale)}
        </div>
        <div>
          <span className="font-semibold text-slate-600">
            {t('leave_request.list.submitted_at', 'Gửi lúc')}:
          </span>{' '}
          {formatDateTime(req.created_at, locale)}
        </div>
      </div>

      {req.rejection_reason && (
        <div className="mt-2 text-[11.5px] text-rose-600 bg-rose-50 border border-rose-100 rounded-md px-2.5 py-1.5">
          <span className="font-semibold">
            {t('leave_request.list.rejection_reason', 'Lý do từ chối')}:
          </span>{' '}
          {req.rejection_reason}
        </div>
      )}
    </button>
  );
}

interface ClassroomGroup {
  key: string;
  classroomId: string | null;
  classroomName: string | null;
  items: LeaveRequest[];
}

function groupRequestsByClassroom(items: LeaveRequest[]): ClassroomGroup[] {
  const NO_CLASSROOM = '__no_classroom__';
  const order: string[] = [];
  const map = new Map<string, ClassroomGroup>();

  for (const req of items) {
    if (req.classroom_id) {
      const key = `c:${req.classroom_id}`;
      if (!map.has(key)) {
        map.set(key, {
          key,
          classroomId: req.classroom_id,
          classroomName: req.classroom_name ?? null,
          items: [],
        });
        order.push(key);
      }
      map.get(key)!.items.push(req);
    } else {
      if (!map.has(NO_CLASSROOM)) {
        map.set(NO_CLASSROOM, {
          key: NO_CLASSROOM,
          classroomId: null,
          classroomName: null,
          items: [],
        });
        order.push(NO_CLASSROOM);
      }
      map.get(NO_CLASSROOM)!.items.push(req);
    }
  }

  return order.map((k) => map.get(k)!);
}
