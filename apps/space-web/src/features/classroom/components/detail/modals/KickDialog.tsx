import { Loader2, UserX } from 'lucide-react';
import { Button } from '@shared/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from '@shared/components/ui/dialog';
import type { ClassroomMember } from '@/lib/api/types';

export default function KickDialog({
  memberToKick,
  onClose,
  onConfirm,
  kickingId,
  t,
}: {
  memberToKick: ClassroomMember | null;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  kickingId: string | null;
  t: (key: string, fallback?: string, values?: Record<string, string | number>) => string;
}) {
  return (
    <Dialog open={!!memberToKick} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent showCloseButton={false} className="max-w-sm rounded-[28px] p-0 overflow-hidden shadow-2xl">
        {/* Header strip */}
        <div className="relative bg-gradient-to-br from-rose-500 to-rose-700 px-8 pt-8 pb-12">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(255,255,255,0.15),transparent_60%)]" />
          <div className="relative flex flex-col items-center gap-3 text-center">
            <div className="relative">
              {memberToKick?.member_avatar ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={memberToKick.member_avatar} alt={memberToKick.member_name}
                  className="w-20 h-20 rounded-2xl object-cover shadow-xl" />
              ) : (
                <div className="w-20 h-20 rounded-2xl bg-white/20 flex items-center justify-center text-white font-black text-3xl shadow-xl">
                  {memberToKick?.member_name.charAt(0).toUpperCase()}
                </div>
              )}
              <div className="absolute -bottom-3 -right-3 w-8 h-8 rounded-xl bg-white flex items-center justify-center shadow-lg">
                <UserX size={16} className="text-rose-600" />
              </div>
            </div>
            <div className="text-white mt-1">
              <DialogTitle className="text-lg font-black text-white">{memberToKick?.member_name}</DialogTitle>
              <p className="text-xs font-bold text-white/60 uppercase tracking-widest mt-0.5">{t('classroom.ui.students_role_badge')}</p>
            </div>
          </div>
        </div>
        {/* Body */}
        <div className="px-8 pt-6 pb-8 bg-card">
          <div className="text-center space-y-3 mb-6">
            <DialogDescription className="text-sm font-bold text-foreground">
              {t('classroom.ui.kick_dialog_title', undefined, { name: memberToKick?.member_name ?? '' })}
            </DialogDescription>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {t('classroom.ui.kick_dialog_desc2')}
            </p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" className="flex-1 h-11 rounded-xl font-bold text-sm"
              onClick={onClose} disabled={!!kickingId}>
              {t('classroom.ui.kick_dialog_cancel')}
            </Button>
            <Button className="flex-1 h-11 rounded-xl font-bold text-sm bg-rose-600 hover:bg-rose-700 text-white gap-2"
              onClick={() => void onConfirm()} disabled={!!kickingId}>
              {kickingId ? <Loader2 size={15} className="animate-spin" /> : <UserX size={15} />}
              {t('classroom.ui.kick_dialog_confirm')}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
