'use client';

import * as React from 'react';
import { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from '@shared/components/LocaleProvider';
import {
  CalendarEvent,
  CalendarEventType,
  CreateCalendarEventRequest,
  UpdateCalendarEventRequest,
} from '@shared/lib/api/calendar';
import {
  applyShiftToDate,
  getShiftForDate,
  getShiftById,
} from '@shared/lib/calendar/shifts';
import { Loader2 } from 'lucide-react';
import { Button } from '@shared/components/ui/button';
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
import { Input } from '@shared/components/ui/input';
import { Textarea } from '@shared/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@shared/components/ui/select';
import { ShiftPicker } from './ShiftPicker';

interface ClassroomOption {
  uid: string;
  name: string;
}

interface EventDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initial?: CalendarEvent | null;
  classroomOptions?: ClassroomOption[];
  lockedClassroom?: { uid: string; name?: string };
  onSubmit: (payload: CreateCalendarEventRequest | UpdateCalendarEventRequest) => Promise<void>;
  onDelete?: () => Promise<void>;
  saving?: boolean;
  deleting?: boolean;
  allowClassroomSelect?: boolean;
  titleKey?: string;
}

const TYPES: CalendarEventType[] = ['class', 'exam', 'deadline', 'study_session'];

const NO_CLASSROOM_VALUE = '__no_classroom__';

const eventFormSchema = z
  .object({
    type: z.enum(['class', 'exam', 'deadline', 'study_session'] as const),
    title: z.string().min(1, 'Vui lòng nhập tiêu đề'),
    description: z.string(),
    startTime: z.string().min(1, 'Vui lòng chọn thời gian bắt đầu'),
    endTime: z.string().min(1, 'Vui lòng chọn thời gian kết thúc'),
    classroomId: z.string(),
    shiftId: z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4), z.literal('')]),
  })
  .refine((d) => Boolean(d.startTime) && Boolean(d.endTime) && new Date(d.endTime) > new Date(d.startTime), {
    message: 'Thời gian kết thúc phải sau thời gian bắt đầu',
    path: ['endTime'],
  });

type EventFormValues = z.infer<typeof eventFormSchema>;

function toLocalInput(iso: string | undefined): string {
  if (!iso) return '';
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function fromLocalInput(value: string): string {
  return new Date(value).toISOString();
}

export function EventDialog({
  open,
  onOpenChange,
  initial,
  classroomOptions = [],
  lockedClassroom,
  onSubmit,
  onDelete,
  saving = false,
  deleting = false,
  allowClassroomSelect = true,
  titleKey = 'title_create',
}: EventDialogProps) {
  const { t } = useTranslation();
  const isEdit = Boolean(initial);

  const form = useForm<EventFormValues>({
    resolver: zodResolver(eventFormSchema),
    defaultValues: {
      type: 'class',
      title: '',
      description: '',
      startTime: '',
      endTime: '',
      classroomId: '',
      shiftId: '',
    },
  });

  useEffect(() => {
    if (!open) return;
    form.reset({
      type: (initial?.type as CalendarEventType) ?? 'class',
      title: initial?.title ?? '',
      description: initial?.description ?? '',
      startTime: toLocalInput(initial?.start_time),
      endTime: toLocalInput(initial?.end_time),
      classroomId: initial?.classroom_id ?? lockedClassroom?.uid ?? '',
      shiftId: initial?.start_time
        ? (getShiftForDate(new Date(initial.start_time))?.id ?? '')
        : '',
    });
  }, [open, initial, lockedClassroom, form]);

  const watchedClassroomId = form.watch('classroomId');
  const effectiveClassroomId = lockedClassroom?.uid ?? watchedClassroomId;
  const showClassroomSelect = !lockedClassroom && allowClassroomSelect;

  const handleShiftChange = (id: 1 | 2 | 3 | 4 | '') => {
    form.setValue('shiftId', id, { shouldDirty: true });
    if (id === '') return;
    const shift = getShiftById(id);
    if (!shift) return;
    const startTime = form.getValues('startTime');
    const baseDate = startTime ? new Date(startTime) : new Date();
    form.setValue('startTime', toLocalInput(applyShiftToDate(baseDate, shift, 'start').toISOString()), { shouldDirty: true });
    form.setValue('endTime', toLocalInput(applyShiftToDate(baseDate, shift, 'end').toISOString()), { shouldDirty: true });
  };

  const handleSubmit = form.handleSubmit(async (values) => {
    const payload: CreateCalendarEventRequest = {
      type: values.type,
      title: values.title.trim(),
      description: values.description.trim(),
      start_time: fromLocalInput(values.startTime),
      end_time: fromLocalInput(values.endTime),
      classroom_id: effectiveClassroomId || null,
    };
    try {
      await onSubmit(payload);
    } catch {
      // Errors are surfaced by the parent; we just keep the dialog open.
    }
  });

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o) form.reset();
        onOpenChange(o);
      }}
    >
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {t(`calendar.dialog.${titleKey}`, isEdit ? 'Edit event' : 'Create event')}
          </DialogTitle>
          <DialogDescription>
            {t('calendar.dialog.subtitle', 'Nhập thông tin sự kiện.')}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={handleSubmit} className="space-y-4">
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
                      placeholder="Buổi học chương 3..."
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

              {lockedClassroom ? (
                <FormItem>
                  <FormLabel>{t('calendar.dialog.field_classroom', 'Classroom')}</FormLabel>
                  <div className="h-9 rounded-md border border-input bg-muted px-3 inline-flex items-center text-sm font-medium">
                    <span className="truncate">
                      {lockedClassroom.name ?? lockedClassroom.uid}
                    </span>
                  </div>
                </FormItem>
              ) : showClassroomSelect ? (
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
              ) : null}
            </div>

            <Controller
              control={form.control}
              name="shiftId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('calendar.dialog.field_shift', 'Ca học')}</FormLabel>
                  <FormControl>
                    <ShiftPicker
                      value={(field.value ?? '') as 1 | 2 | 3 | 4 | ''}
                      onChange={(v) => {
                        field.onChange(v);
                        handleShiftChange(v);
                      }}
                      optional
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="startTime"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      {t('calendar.dialog.field_start', 'Start')} <span className="text-destructive">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input type="datetime-local" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="endTime"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      {t('calendar.dialog.field_end', 'End')} <span className="text-destructive">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input type="datetime-local" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('calendar.dialog.field_description', 'Description')}</FormLabel>
                  <FormControl>
                    <Textarea rows={3} className="resize-none" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter className="gap-2 sm:gap-2">
              {onDelete && isEdit && (
                <Button
                  type="button"
                  variant="ghost"
                  onClick={onDelete}
                  disabled={saving || deleting}
                  className="text-destructive hover:bg-destructive/10 hover:text-destructive mr-auto"
                >
                  {deleting && <Loader2 size={14} className="mr-1.5 animate-spin" />}
                  {t('calendar.labels.delete_event', 'Delete')}
                </Button>
              )}
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={saving || deleting}
              >
                {t('calendar.dialog.cancel', 'Cancel')}
              </Button>
              <Button type="submit" disabled={saving || deleting}>
                {saving && <Loader2 size={14} className="mr-1.5 animate-spin" />}
                {t('calendar.dialog.save', 'Save')}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
