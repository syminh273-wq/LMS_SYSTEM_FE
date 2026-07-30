import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '../ui/button';
import { Check, Loader2, X as XIcon } from 'lucide-react';
import { useTranslation } from '@shared/components/LocaleProvider';
import {
  LeaveRequest,
  ProcessLeaveRequestInput,
} from '@shared/lib/api/leaveRequest';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@shared/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@shared/components/ui/form';
import { Textarea } from '@shared/components/ui/textarea';
import { LeaveRequestStatusBadge } from './LeaveRequestStatusBadge';

interface ProcessLeaveRequestDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  request: LeaveRequest | null;
  onSubmit: (input: ProcessLeaveRequestInput) => Promise<void>;
  processing?: boolean;
}

const processSchema = z
  .object({
    choice: z.enum(['approved', 'rejected']),
    rejectionReason: z.string(),
  })
  .refine((d) => d.choice === 'approved' || d.rejectionReason.trim().length > 0, {
    message: 'Vui lòng nhập lý do từ chối',
    path: ['rejectionReason'],
  });

type ProcessFormValues = z.infer<typeof processSchema>;

export function ProcessLeaveRequestDialog({
  open,
  onOpenChange,
  request,
  onSubmit,
  processing = false,
}: ProcessLeaveRequestDialogProps) {
  const { t, locale } = useTranslation();
  const [serverError, setServerError] = useState('');

  const form = useForm<ProcessFormValues>({
    resolver: zodResolver(processSchema),
    defaultValues: { choice: 'approved', rejectionReason: '' },
  });

  useEffect(() => {
    if (!open) return;
    form.reset({ choice: 'approved', rejectionReason: '' });
    setServerError('');
  }, [open, form]);

  if (!open || !request) return null;

  const choice = form.watch('choice');

  const handleSubmit = form.handleSubmit(async (values) => {
    setServerError('');
    try {
      await onSubmit({
        status: values.choice,
        ...(values.choice === 'rejected' ? { rejection_reason: values.rejectionReason.trim() } : {}),
      });
    } catch (err) {
      setServerError(err instanceof Error ? err.message : t('leave_request.errors.generic', 'Đã có lỗi xảy ra.'));
    }
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{t('leave_request.process.title', 'Xử lý đơn nghỉ phép')}</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={handleSubmit} className="space-y-4">
            {serverError && (
              <div className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive font-medium">
                {serverError}
              </div>
            )}

            <div className="rounded-lg bg-muted/30 border px-4 py-3 text-xs space-y-1">
              <div className="flex items-center gap-2">
                <span className="font-semibold">{request.student_name ?? '—'}</span>
                <LeaveRequestStatusBadge status={request.status} />
              </div>
              <div>
                <span className="font-semibold text-muted-foreground">
                  {request.event_id
                    ? t('leave_request.list.event', 'Sự kiện')
                    : t('leave_request.list.range', 'Khoảng thời gian')}
                  :
                </span>{' '}
                {request.event_id
                  ? request.event_title ?? '—'
                  : `${request.start_date ? new Date(request.start_date).toLocaleString(locale === 'vi' ? 'vi-VN' : 'en-US') : '—'} – ${request.end_date ? new Date(request.end_date).toLocaleString(locale === 'vi' ? 'vi-VN' : 'en-US') : '—'}`}
              </div>
              <p>{request.reason}</p>
              {request.evidence_url && (
                <a
                  href={request.evidence_url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-primary hover:underline font-semibold"
                >
                  {t('leave_request.list.view_evidence', 'Xem minh chứng')}
                </a>
              )}
            </div>

            {request.status === 'pending' ? (
              <>
                {choice === 'rejected' && (
                  <FormField
                    control={form.control}
                    name="rejectionReason"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          {t('leave_request.process.rejection_label', 'Lý do từ chối')}
                          <span className="text-destructive"> *</span>
                        </FormLabel>
                        <FormControl>
                          <Textarea rows={3} className="resize-none" autoFocus {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                <DialogFooter>
                  {choice === 'rejected' ? (
                    <>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => form.setValue('choice', 'approved')}
                        disabled={processing}
                      >
                        {t('leave_request.process.back', 'Quay lại')}
                      </Button>
                      <Button
                        type="submit"
                        disabled={processing}
                        className="bg-destructive hover:bg-destructive/90"
                      >
                        {processing && <Loader2 size={14} className="mr-1.5 animate-spin" />}
                        <XIcon size={14} className="mr-1.5" />
                        {t('leave_request.process.submit_reject', 'Từ chối đơn')}
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => form.setValue('choice', 'rejected')}
                        disabled={processing}
                        className="text-destructive border-destructive/40 hover:bg-destructive/10 hover:text-destructive"
                      >
                        <XIcon size={14} className="mr-1.5" />
                        {t('leave_request.process.reject', 'Từ chối')}
                      </Button>
                      <Button
                        type="submit"
                        disabled={processing}
                        className="bg-emerald-600 hover:bg-emerald-700"
                      >
                        {processing && <Loader2 size={14} className="mr-1.5 animate-spin" />}
                        <Check size={14} className="mr-1.5" />
                        {t('leave_request.process.submit_approve', 'Duyệt')}
                      </Button>
                    </>
                  )}
                </DialogFooter>
              </>
            ) : (
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                  {t('leave_request.process.close', 'Đóng')}
                </Button>
              </DialogFooter>
            )}
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
