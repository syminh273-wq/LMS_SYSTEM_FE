'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslation } from '@shared/components/LocaleProvider';
import { CheckCircle2, Loader2 } from 'lucide-react';
import { Button } from '@shared/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@shared/components/ui/dialog';
import { cn } from '@shared/lib/utils';

export type PaymentSuccessVariant = 'classroom' | 'course';

export interface PaymentSuccessDialogProps {
  open: boolean;
  variant: PaymentSuccessVariant;
  classroomUid: string;
  classroomName?: string;
  courseName?: string;
  redirectTo?: string;
  onClose?: () => void;
}

export function PaymentSuccessDialog({
  open,
  variant,
  classroomUid,
  classroomName,
  courseName,
  redirectTo,
  onClose,
}: PaymentSuccessDialogProps) {
  const { t } = useTranslation();
  const router = useRouter();
  const [navigating, setNavigating] = useState(false);

  const isClassroom = variant === 'classroom';

  const title = t(
    isClassroom ? 'classroom.payment.success_title' : 'course.checkout.success_title',
    'Thanh toán thành công!',
  );

  const body = isClassroom
    ? t(
        'classroom.payment.success_pending_body',
        'Đã thanh toán. Vui lòng chờ giáo viên phê duyệt yêu cầu tham gia lớp.',
      )
    : t(
        'course.checkout.success_pending_body',
        'Đã thanh toán. Bạn đã được thêm vào lớp học.',
      );

  const goToLabel = t('classroom.payment.btn_go_to_class', 'Vào lớp học');
  const closeLabel = t('classroom.payment.btn_close', 'Đóng');

  const handleGoTo = () => {
    setNavigating(true);
    const target = redirectTo || (isClassroom ? `/consumer/classroom/${classroomUid}` : '/consumer/course');
    router.push(target);
  };

  const handleOpenChange = (next: boolean) => {
    if (!next) {
      onClose?.();
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        className={cn('sm:max-w-md')}
        showCloseButton={false}
      >
        <DialogHeader className="items-center text-center space-y-3 pt-2">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100">
            <CheckCircle2 size={40} className="text-emerald-500" />
          </div>
          <DialogTitle className="text-lg font-black text-center">{title}</DialogTitle>
          {isClassroom && classroomName ? (
            <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              {t('classroom.payment.class_label', 'Lớp học')}
            </div>
          ) : null}
          {!isClassroom && courseName ? (
            <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              {t('classroom.payment.course_label', 'Khóa học')}
            </div>
          ) : null}
          {isClassroom && classroomName ? (
            <div className="text-sm font-bold text-foreground">{classroomName}</div>
          ) : null}
          {!isClassroom && courseName ? (
            <div className="text-sm font-bold text-foreground">{courseName}</div>
          ) : null}
          <DialogDescription className="text-center text-slate-500 leading-relaxed">
            {body}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex-row gap-2 sm:justify-center">
          <Button
            variant="outline"
            onClick={() => onClose?.()}
            disabled={navigating}
            className="rounded-xl font-bold flex-1"
          >
            {closeLabel}
          </Button>
          <Button
            onClick={handleGoTo}
            disabled={navigating}
            className="rounded-xl font-bold bg-emerald-500 hover:bg-emerald-600 text-white flex-1"
          >
            {navigating ? <Loader2 size={16} className="animate-spin" /> : goToLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
