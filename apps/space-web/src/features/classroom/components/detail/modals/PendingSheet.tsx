import { Loader2, X, Check, Users, RefreshCw } from 'lucide-react';
import { Button } from '@shared/components/ui/button';
import type { ClassroomMemberProps } from '@/lib/api/types';

export default function PendingSheet({
  open,
  onClose,
  pendingMembers,
  loadingPending,
  approvingId,
  rejectingId,
  onApproveMember,
  onRejectMember,
  onApproveAll,
  onRefresh,
  formatDateTime,
  t,
}: {
  open: boolean;
  onClose: () => void;
  pendingMembers: ClassroomMemberProps[];
  loadingPending: boolean;
  approvingId: string | null;
  rejectingId: string | null;
  onApproveMember: (member: ClassroomMemberProps) => Promise<void>;
  onRejectMember: (member: ClassroomMemberProps) => Promise<void>;
  onApproveAll: () => Promise<void>;
  onRefresh: () => void;
  formatDateTime: (v: string) => string;
  t: (key: string, fallback?: string, values?: Record<string, string | number>) => string;
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/30 backdrop-blur-sm"
        onClick={onClose}
      />
      {/* Panel */}
      <div className="relative z-10 flex h-full w-full max-w-[480px] flex-col bg-card shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-8 py-6">
          <div>
            <h2 className="text-xl font-black text-foreground">{t('classroom.ui.pending_title')}</h2>
            <p className="mt-1 text-sm font-medium text-muted-foreground">
              {loadingPending ? t('classroom.ui.students_loading') : t('classroom.ui.pending_count', undefined, { count: pendingMembers.length })}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {pendingMembers.length >= 1 && (
              <Button
                size="sm"
                className="h-9 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-4 gap-1.5"
                disabled={!!approvingId}
                onClick={() => void onApproveAll()}
              >
                <Check size={13} />
                {t('classroom.ui.pending_approve_all')}
              </Button>
            )}
            <Button
              onClick={onClose}
              className="flex h-9 w-9 items-center justify-center rounded-xl text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
            >
              <X size={18} />
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-8 py-6">
          {loadingPending ? (
            <div className="flex h-48 items-center justify-center">
              <Loader2 size={32} className="animate-spin text-primary-brand" />
            </div>
          ) : pendingMembers.length === 0 ? (
            <div className="flex h-48 flex-col items-center justify-center gap-3 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                <Users size={28} className="text-muted-foreground/50" />
              </div>
              <p className="text-sm font-bold text-muted-foreground">{t('classroom.ui.pending_empty')}</p>
              <p className="text-xs font-medium text-muted-foreground">{t('classroom.ui.pending_empty_desc')}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {pendingMembers.map(member => (
                <div
                  key={member.member_id}
                  className="flex items-center gap-4 rounded-2xl bg-muted p-4"
                >
                  {member.member_avatar ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={member.member_avatar}
                      alt={member.member_name}
                      className="h-11 w-11 shrink-0 rounded-xl object-cover"
                    />
                  ) : (
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary-brand-light text-sm font-black text-primary-brand">
                      {member.member_name.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold text-foreground">{member.member_name}</p>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                      {formatDateTime(member.joined_at)}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <Button
                      size="sm"
                      className="h-8 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-3 gap-1"
                      disabled={approvingId === member.member_id || rejectingId === member.member_id}
                      onClick={() => void onApproveMember(member)}
                    >
                      {approvingId === member.member_id
                        ? <Loader2 size={13} className="animate-spin" />
                        : <Check size={13} />}
                      {t('classroom.ui.pending_approve')}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-8 rounded-xl text-rose-600 hover:bg-rose-50 text-xs font-bold px-3 gap-1"
                      disabled={approvingId === member.member_id || rejectingId === member.member_id}
                      onClick={() => void onRejectMember(member)}
                    >
                      {rejectingId === member.member_id
                        ? <Loader2 size={13} className="animate-spin" />
                        : <X size={13} />}
                      {t('classroom.ui.pending_reject')}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-8 py-4">
          <Button
            onClick={() => { onRefresh(); }}
            className="flex items-center gap-2 text-xs font-bold text-muted-foreground hover:text-muted-foreground transition-colors"
          >
            <RefreshCw size={13} />
            {t('classroom.ui.pending_refresh')}
          </Button>
        </div>
      </div>
    </div>
  );
}
