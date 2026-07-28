export interface Shift {
  id: 1 | 2 | 3 | 4;
  startHour: number;
  startMinute: number;
  endHour: number;
  endMinute: number;
  labelKey: string;
}

export const SHIFTS: Shift[] = [
  { id: 1, startHour: 7, startMinute: 0, endHour: 9, endMinute: 0, labelKey: 'calendar.shifts.ca_1' },
  { id: 2, startHour: 9, startMinute: 30, endHour: 11, endMinute: 30, labelKey: 'calendar.shifts.ca_2' },
  { id: 3, startHour: 13, startMinute: 0, endHour: 15, endMinute: 0, labelKey: 'calendar.shifts.ca_3' },
  { id: 4, startHour: 15, startMinute: 30, endHour: 17, endMinute: 30, labelKey: 'calendar.shifts.ca_4' },
];

export function getShiftById(id: number): Shift | undefined {
  return SHIFTS.find((s) => s.id === id);
}

function minutesOfDay(d: Date): number {
  return d.getHours() * 60 + d.getMinutes();
}

export function getShiftForDate(date: Date): Shift | null {
  const m = minutesOfDay(date);
  for (const s of SHIFTS) {
    const start = s.startHour * 60 + s.startMinute;
    const end = s.endHour * 60 + s.endMinute;
    if (m >= start && m < end) return s;
  }
  return null;
}

export function applyShiftToDate(date: Date, shift: Shift, kind: 'start' | 'end'): Date {
  const out = new Date(date);
  if (kind === 'start') {
    out.setHours(shift.startHour, shift.startMinute, 0, 0);
  } else {
    out.setHours(shift.endHour, shift.endMinute, 0, 0);
  }
  return out;
}
