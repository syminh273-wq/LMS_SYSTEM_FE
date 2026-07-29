import { useTranslation } from '@shared/components/LocaleProvider';
import { cn } from '@shared/lib/utils';
import { LeaveRequestStatus } from '@shared/lib/api/leaveRequest';

const STYLES: Record<LeaveRequestStatus, string> = {
  pending: 'bg-amber-50 text-amber-700 border-amber-200',
  approved: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  rejected: 'bg-rose-50 text-rose-700 border-rose-200',
  cancelled: 'bg-slate-50 text-slate-600 border-slate-200',
};

export function LeaveRequestStatusBadge({ status }: { status: LeaveRequestStatus }) {
  const { t } = useTranslation();
  return (
    <span
      className={cn(
        'inline-flex items-center px-2 py-0.5 rounded-full border text-[11px] font-semibold',
        STYLES[status]
      )}
    >
      {t(`leave_request.status.${status}`, status)}
    </span>
  );
}
