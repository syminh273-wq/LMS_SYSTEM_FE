import * as React from 'react';
import { useEffect, useMemo } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from '@shared/components/LocaleProvider';
import { CalendarEventType } from '@shared/lib/api/calendar';
import { countRecurrenceSlots, DayShiftMap, expandRecurrence, toISODate } from '@shared/lib/calendar/recurrence';
import { Loader2 } from 'lucide-react';
import { Button } from '../ui/button';
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
import { ShiftMatrixPicker } from './ShiftMatrixPicker';

interface ClassroomOption {
  uid: string;
  name: string;
}

interface RecurringSlotPayload {
  start_time: string;
  end_time: string;
}

export interface RecurringSchedulePayload {
  title: string;
  type: CalendarEventType;
  description?: string;
  classroom_id?: string | null;
  start_date: string;
  end_date: string;
  slots: RecurringSlotPayload[];
}

interface RecurringScheduleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  classroomOptions?: ClassroomOption[];
  defaultClassroomId?: string;
  onSubmit: (payload: RecurringSchedulePayload) => Promise<void>;
  saving?: boolean;
}

const TYPES: CalendarEventType[] = ['class', 'exam', 'deadline', 'study_session'];
const NO_CLASSROOM_VALUE = '__no_classroom__';

function todayISODate(): string {
  return toISODate(new Date());
}

function plusDaysISO(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return toISODate(d);
}

const recurringSchema = z
  .object({
    type: z.enum(['class', 'exam', 'deadline', 'study_session'] as const),
    title: z.string().min(1, 'Vui lòng nhập tiêu đề'),
    description: z.string(),
    startDate: z.string().min(1, 'Vui lòng chọn ngày bắt đầu'),
    endDate: z.string().min(1, 'Vui lòng chọn ngày kết thúc'),
    classroomId: z.string(),
    dayShifts: z.record(z.string(), z.array(z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4)]))),
  })
  .refine((d) => new Date(d.endDate) >= new Date(d.startDate), {
    message: 'Ngày kết thúc phải sau hoặc bằng ngày bắt đầu',
    path: ['endDate'],
  });

type RecurringFormValues = z.infer<typeof recurringSchema>;

export function RecurringScheduleDialog({
  open,
  onOpenChange,
  classroomOptions = [],
  defaultClassroomId,
  onSubmit,
  saving = false,
}: RecurringScheduleDialogProps) {
  const { t } = useTranslation();

  const form = useForm<RecurringFormValues>({
    resolver: zodResolver(recurringSchema),
    defaultValues: {
      type: 'class',
      title: '',
      description: '',
      startDate: todayISODate(),
      endDate: plusDaysISO(28),
      classroomId: defaultClassroomId ?? '',
      dayShifts: {},
    },
  });

  useEffect(() => {
    if (!open) return;
    form.reset({
      type: 'class',
      title: '',
      description: '',
      startDate: todayISODate(),
      endDate: plusDaysISO(28),
      classroomId: defaultClassroomId ?? '',
      dayShifts: {},
    });
  }, [open, defaultClassroomId, form]);

  const watched = form.watch();
  const slotCount = useMemo(
    () =>
      countRecurrenceSlots({
        startDate: watched.startDate,
        endDate: watched.endDate,
        dayShifts: (watched.dayShifts ?? {}) as DayShiftMap,
      }),
    [watched.startDate, watched.endDate, watched.dayShifts]
  );

  const handleSubmit = form.handleSubmit(async (values) => {
    if (slotCount === 0) {
      form.setError('dayShifts', {
        type: 'manual',
        message: t('calendar.recurring.error_no_slots', 'Vui lòng chọn ít nhất một ngày/ca.'),
      });
      return;
    }
    const slots = expandRecurrence({
      startDate: values.startDate,
      endDate: values.endDate,
      dayShifts: (values.dayShifts ?? {}) as DayShiftMap,
    });
    const slotPayload = slots.map((s) => ({
      start_time: s.startISO,
      end_time: s.endISO,
    }));
    try {
      await onSubmit({
        title: values.title.trim(),
        type: values.type,
        description: values.description.trim(),
        classroom_id: values.classroomId || null,
        start_date: values.startDate,
        end_date: values.endDate,
        slots: slotPayload,
      });
      onOpenChange(false);
    } catch {
      // Error is surfaced via toast by the parent; keep dialog open.
    }
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col overflow-hidden p-0">
        <DialogHeader className="px-6 py-4 border-b">
          <DialogTitle>{t('calendar.recurring.title', 'Weekly schedule')}</DialogTitle>
          <DialogDescription>
            {t('calendar.recurring.subtitle', 'Tạo lịch lặp lại theo tuần.')}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
            <div className="px-6 py-4 space-y-4 overflow-y-auto flex-1">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      {t('calendar.dialog.field_title', 'Title')} <span className="text-destructive">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input
                        autoFocus
                        placeholder={t('calendar.recurring.title_placeholder', 'e.g. Toán cao cấp - Lớp A')}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('calendar.dialog.field_type', 'Type')}</FormLabel>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <FormControl>
                          <SelectTrigger className="w-full">
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {TYPES.map((tp) => (
                            <SelectItem key={tp} value={tp}>
                              {t(`calendar.types.${tp}`, tp)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="classroomId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('calendar.dialog.field_classroom', 'Classroom')}</FormLabel>
                      <Select
                        value={field.value || NO_CLASSROOM_VALUE}
                        onValueChange={(v) => field.onChange(v === NO_CLASSROOM_VALUE ? '' : v)}
                      >
                        <FormControl>
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder={t('calendar.dialog.no_classroom', 'No classroom')} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value={NO_CLASSROOM_VALUE}>
                            {t('calendar.dialog.no_classroom', 'No classroom')}
                          </SelectItem>
                          {classroomOptions.map((c) => (
                            <SelectItem key={c.uid} value={c.uid}>
                              {c.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="startDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        {t('calendar.recurring.field_start_date', 'Start date')} <span className="text-destructive">*</span>
                      </FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
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
                      <FormLabel>
                        {t('calendar.recurring.field_end_date', 'End date')} <span className="text-destructive">*</span>
                      </FormLabel>
                      <FormControl>
                        <Input type="date" min={watched.startDate} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <Controller
                control={form.control}
                name="dayShifts"
                render={({ field, fieldState }) => (
                  <FormItem>
                    <FormLabel>{t('calendar.recurring.field_matrix', 'Days × Shifts')}</FormLabel>
                    <FormControl>
                      <ShiftMatrixPicker
                        value={(field.value ?? {}) as DayShiftMap}
                        onChange={(v) => field.onChange(v)}
                      />
                    </FormControl>
                    <p className="text-xs text-muted-foreground">
                      {t('calendar.recurring.slot_count', 'Will create {{count}} event(s)', { count: slotCount })}
                    </p>
                    {fieldState.error && <FormMessage>{fieldState.error.message}</FormMessage>}
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('calendar.dialog.field_description', 'Description')}</FormLabel>
                    <FormControl>
                      <Textarea rows={2} className="resize-none" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <DialogFooter className="px-6 py-4 border-t bg-muted/30">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={saving}
              >
                {t('calendar.dialog.cancel', 'Cancel')}
              </Button>
              <Button type="submit" disabled={saving}>
                {saving && <Loader2 size={14} className="mr-1.5 animate-spin" />}
                {t('calendar.recurring.create_button', 'Create schedule')}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
