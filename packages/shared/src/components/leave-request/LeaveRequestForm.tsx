'use client';

import { useEffect, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from '@shared/components/LocaleProvider';
import { Loader2, Upload } from 'lucide-react';
import { Button } from '../ui/button';
import { cn } from '@shared/lib/utils';
import { Input } from '@shared/components/ui/input';
import { Textarea } from '@shared/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@shared/components/ui/dialog';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@shared/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@shared/components/ui/select';
import {
  CreateLeaveRequestInput,
  LeaveRequestEventOption,
} from '@shared/lib/api/leaveRequest';

interface LeaveRequestFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  events: LeaveRequestEventOption[];
  classroomId?: string;
  onSubmit: (input: CreateLeaveRequestInput) => Promise<void>;
  saving?: boolean;
}

function toLocalInput(iso: string | undefined): string {
  if (!iso) return '';
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function fromLocalInput(value: string): string {
  return new Date(value).toISOString();
}

const NO_EVENT_VALUE = '__no_event__';

const leaveRequestSchema = z
  .object({
    mode: z.enum(['event', 'range']),
    eventId: z.string(),
    startDate: z.string(),
    endDate: z.string(),
    reason: z.string().min(1, 'Vui lòng nhập lý do'),
  })
  .superRefine((data, ctx) => {
    if (data.mode === 'event' && !data.eventId) {
      ctx.addIssue({
        code: 'custom',
        path: ['eventId'],
        message: 'Vui lòng chọn sự kiện',
      });
    }
    if (data.mode === 'range') {
      if (!data.startDate || !data.endDate) {
        ctx.addIssue({
          code: 'custom',
          path: ['startDate'],
          message: 'Vui lòng chọn thời gian',
        });
      } else if (new Date(data.endDate) <= new Date(data.startDate)) {
        ctx.addIssue({
          code: 'custom',
          path: ['endDate'],
          message: 'Thời gian kết thúc phải sau thời gian bắt đầu',
        });
      }
    }
  });

type LeaveRequestFormValues = z.infer<typeof leaveRequestSchema>;

export function LeaveRequestForm({
  open,
  onOpenChange,
  events,
  classroomId,
  onSubmit,
  saving = false,
}: LeaveRequestFormProps) {
  const { t } = useTranslation();
  const [evidence, setEvidence] = useState<File | null>(null);

  const form = useForm<LeaveRequestFormValues>({
    resolver: zodResolver(leaveRequestSchema),
    defaultValues: {
      mode: events.length > 0 ? 'event' : 'range',
      eventId: '',
      startDate: '',
      endDate: '',
      reason: '',
    },
  });

  useEffect(() => {
    if (!open) return;
    form.reset({
      mode: events.length > 0 ? 'event' : 'range',
      eventId: '',
      startDate: '',
      endDate: '',
      reason: '',
    });
    setEvidence(null);
  }, [open, events.length, form]);

  const mode = form.watch('mode');

  const handleSubmit = form.handleSubmit(async (values) => {
    try {
      if (values.mode === 'event') {
        const ev = events.find((e) => e.uid === values.eventId);
        if (!ev) return;
        await onSubmit({
          event_id: ev.uid,
          classroom_id: classroomId ?? null,
          reason: values.reason.trim(),
          evidence,
        });
        return;
      }
      await onSubmit({
        event_id: null,
        classroom_id: classroomId ?? null,
        start_date: fromLocalInput(values.startDate),
        end_date: fromLocalInput(values.endDate),
        reason: values.reason.trim(),
        evidence,
      });
    } catch {
      // parent surfaces error via toast
    }
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t('leave_request.form.title', 'Tạo đơn nghỉ phép')}</DialogTitle>
          <DialogDescription>
            {t('leave_request.form.subtitle', 'Chọn sự kiện hoặc khoảng thời gian và nhập lý do.')}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={handleSubmit} className="space-y-4">
            <FormField
              control={form.control}
              name="mode"
              render={({ field }) => (
                <FormItem>
                  <div className="flex items-center bg-card border rounded-md p-0.5 w-fit">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      disabled={events.length === 0}
                      onClick={() => field.onChange('event')}
                      className={cn(
                        'h-7 px-3 text-xs font-semibold rounded-sm',
                        field.value === 'event'
                          ? 'bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground'
                          : 'text-muted-foreground'
                      )}
                    >
                      {t('leave_request.form.mode_event', 'Theo sự kiện')}
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => field.onChange('range')}
                      className={cn(
                        'h-7 px-3 text-xs font-semibold rounded-sm',
                        field.value === 'range'
                          ? 'bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground'
                          : 'text-muted-foreground'
                      )}
                    >
                      {t('leave_request.form.mode_range', 'Theo khoảng ngày')}
                    </Button>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            {mode === 'event' ? (
              <FormField
                control={form.control}
                name="eventId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('leave_request.form.field_event', 'Sự kiện')}</FormLabel>
                    {events.length === 0 ? (
                      <FormDescription>
                        {t('leave_request.form.no_events', 'Bạn chưa có sự kiện nào để tạo đơn.')}
                      </FormDescription>
                    ) : (
                      <Select
                        value={field.value || NO_EVENT_VALUE}
                        onValueChange={(v) => field.onChange(v === NO_EVENT_VALUE ? '' : v)}
                      >
                        <FormControl>
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder={t('leave_request.form.select_event', '-- Chọn sự kiện --')} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value={NO_EVENT_VALUE}>
                            {t('leave_request.form.select_event', '-- Chọn sự kiện --')}
                          </SelectItem>
                          {events.map((ev) => (
                            <SelectItem key={ev.uid} value={ev.uid}>
                              {ev.classroom_name ? `${ev.classroom_name} · ${ev.title}` : ev.title} ({toLocalInput(ev.start_time)})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="startDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('leave_request.form.field_start', 'Bắt đầu')}</FormLabel>
                      <FormControl>
                        <Input type="datetime-local" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="endDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('leave_request.form.field_end', 'Kết thúc')}</FormLabel>
                      <FormControl>
                        <Input type="datetime-local" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}

            <FormField
              control={form.control}
              name="reason"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    {t('leave_request.form.field_reason', 'Lý do')} <span className="text-destructive">*</span>
                  </FormLabel>
                  <FormControl>
                    <Textarea
                      rows={3}
                      placeholder={t('leave_request.form.reason_placeholder', 'Vui lòng mô tả lý do nghỉ...')}
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormItem>
              <FormLabel>{t('leave_request.form.field_evidence', 'Minh chứng (tuỳ chọn)')}</FormLabel>
              <Controller
                control={form.control}
                name="reason"
                render={() => (
                  <FormControl>
                    <label className="flex items-center gap-2 h-9 rounded-md border border-dashed bg-muted/30 px-3 text-xs text-muted-foreground cursor-pointer hover:border-primary/60">
                      <Upload size={14} />
                      <span className="truncate">
                        {evidence ? evidence.name : t('leave_request.form.upload_hint', 'Chọn ảnh hoặc tài liệu...')}
                      </span>
                      <Input
                        type="file"
                        className="hidden"
                        onChange={(e) => setEvidence(e.target.files?.[0] ?? null)}
                      />
                    </label>
                  </FormControl>
                )}
              />
            </FormItem>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={saving}
              >
                {t('leave_request.form.cancel', 'Huỷ')}
              </Button>
              <Button type="submit" disabled={saving}>
                {saving && <Loader2 size={14} className="mr-1.5 animate-spin" />}
                {t('leave_request.form.submit', 'Gửi đơn')}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
