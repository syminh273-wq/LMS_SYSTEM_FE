import { Shift, getShiftById } from './shifts';

export type DayShiftMap = Partial<Record<0 | 1 | 2 | 3 | 4 | 5 | 6, Shift['id'][]>>;

export interface RecurrenceInput {
  startDate: string;
  endDate: string;
  dayShifts: DayShiftMap;
}

export interface ExpandedSlot {
  date: Date;
  shiftId: Shift['id'];
  startISO: string;
  endISO: string;
}

function parseDateOnly(value: string): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!m) return null;
  return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]), 0, 0, 0, 0);
}

function toISODate(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function applyShift(d: Date, shift: Shift, kind: 'start' | 'end'): Date {
  const out = new Date(d);
  if (kind === 'start') {
    out.setHours(shift.startHour, shift.startMinute, 0, 0);
  } else {
    out.setHours(shift.endHour, shift.endMinute, 0, 0);
  }
  return out;
}

export function expandRecurrence(input: RecurrenceInput): ExpandedSlot[] {
  const start = parseDateOnly(input.startDate);
  const end = parseDateOnly(input.endDate);
  if (!start || !end) return [];
  if (end.getTime() < start.getTime()) return [];

  const slots: ExpandedSlot[] = [];
  const cursor = new Date(start);
  while (cursor.getTime() <= end.getTime()) {
    const dow = cursor.getDay() as 0 | 1 | 2 | 3 | 4 | 5 | 6;
    const shiftIds = input.dayShifts[dow] ?? [];
    for (const sid of shiftIds) {
      const shift = getShiftById(sid);
      if (!shift) continue;
      const s = applyShift(cursor, shift, 'start');
      const e = applyShift(cursor, shift, 'end');
      slots.push({
        date: new Date(cursor),
        shiftId: shift.id,
        startISO: s.toISOString(),
        endISO: e.toISOString(),
      });
    }
    cursor.setDate(cursor.getDate() + 1);
  }
  return slots;
}

export function countRecurrenceSlots(input: RecurrenceInput): number {
  return expandRecurrence(input).length;
}

export { toISODate };
