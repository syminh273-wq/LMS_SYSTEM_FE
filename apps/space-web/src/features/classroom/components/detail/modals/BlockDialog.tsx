import { Loader2, ShieldBan } from 'lucide-react';
import { Button } from '@shared/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from '@shared/components/ui/dialog';
import type { ClassroomMemberProps } from '@/lib/api/types';

export default function BlockDialog({
  memberToBlock,
  onClose,
  onConfirm,
  blockingMemberId,
  t,
}: {
  memberToBlock: { member: ClassroomMemberProps; scope: 'classroom' | 'global' } | null;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  blockingMemberId: string | null;
  t: (key: string, fallback?: string, values?: Record<string, string | number>) => string;
}) {
  return (
    <Dialog open={!!memberToBlock} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent showCloseButton={false} className="max-w-sm rounded-[28px] p-0 overflow-hidden shadow-2xl">
        {/* Header strip — orange for classroom, rose for global */}
        <div className={`relative px-8 pt-8 pb-12 bg-gradient-to-br ${
          memberToBlock?.scope === 'global'
            ? 'from-rose-600 to-rose-800'
            : 'from-orange-400 to-orange-600'
        }`}>
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(255,255,255,0.15),transparent_60%)]" />
          <div className="relative flex flex-col items-center gap-3 text-center">
            <div className="relative">
              {memberToBlock?.member.member_avatar ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={memberToBlock.member.member_avatar} alt={memberToBlock.member.member_name}
                  className="w-20 h-20 rounded-2xl object-cover shadow-xl" />
              ) : (
                <div className="w-20 h-20 rounded-2xl bg-white/20 flex items-center justify-center text-white font-black text-3xl shadow-xl">
                  {memberToBlock?.member.member_name.charAt(0).toUpperCase()}
                </div>
              )}
              <div className="absolute -bottom-3 -right-3 w-8 h-8 rounded-xl bg-white flex items-center justify-center shadow-lg">
                <ShieldBan size={16} className={memberToBlock?.scope === 'global' ? 'text-rose-600' : 'text-orange-500'} />
              </div>
            </div>
            <div className="text-white mt-1">
              <DialogTitle className="text-lg font-black text-white">{memberToBlock?.member.member_name}</DialogTitle>
              <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-widest bg-white/20 text-white px-2.5 py-0.5 rounded-full mt-1">
                {memberToBlock?.scope === 'global' ? t('classroom.ui.block_global_label') : t('classroom.ui.block_classroom_label')}
              </span>
            </div>
          </div>
        </div>
        {/* Body */}
        <div className="px-8 pt-6 pb-8 bg-card">
          <div className="text-center space-y-3 mb-6">
            {memberToBlock?.scope === 'global' ? (
              <>
                <DialogDescription className="text-sm font-bold text-foreground">
                  {t('classroom.ui.block_dialog_global_title')}
                </DialogDescription>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {t('classroom.ui.block_dialog_global_desc')}
                </p>
              </>
            ) : (
              <>
                <DialogDescription className="text-sm font-bold text-foreground">
                  {t('classroom.ui.block_dialog_classroom_title')}
                </DialogDescription>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {t('classroom.ui.block_dialog_classroom_desc')}
                </p>
              </>
            )}
          </div>
          <div className="flex gap-3">
            <Button variant="outline" className="flex-1 h-11 rounded-xl font-bold text-sm"
              onClick={onClose} disabled={!!blockingMemberId}>
              {t('classroom.ui.block_dialog_cancel')}
            </Button>
            <Button
              className={`flex-1 h-11 rounded-xl font-bold text-sm text-white gap-2 ${
                memberToBlock?.scope === 'global'
                  ? 'bg-rose-600 hover:bg-rose-700'
                  : 'bg-orange-500 hover:bg-orange-600'
              }`}
              onClick={() => void onConfirm()}
              disabled={!!blockingMemberId}
            >
              {blockingMemberId ? <Loader2 size={15} className="animate-spin" /> : <ShieldBan size={15} />}
              {memberToBlock?.scope === 'global' ? t('classroom.ui.block_dialog_confirm_global') : t('classroom.ui.block_dialog_confirm_classroom')}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
