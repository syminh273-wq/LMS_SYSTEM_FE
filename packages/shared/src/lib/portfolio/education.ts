export type EducationValue = {
  school: string;
  degree: string;
  field_of_study: string;
  start_month: string;
  start_year: string;
  end_month: string;
  end_year: string;
  is_current: boolean;
  grade: string;
  activities_and_societies: string;
  description: string;
  skills: string[];
};

export const EDUCATION_FIELD_MUST_HAVE: ReadonlyArray<keyof EducationValue> = [
  'school',
];

export const MONTHS: ReadonlyArray<{ value: string; label: string }> = [
  { value: '01', label: 'January' },
  { value: '02', label: 'February' },
  { value: '03', label: 'March' },
  { value: '04', label: 'April' },
  { value: '05', label: 'May' },
  { value: '06', label: 'June' },
  { value: '07', label: 'July' },
  { value: '08', label: 'August' },
  { value: '09', label: 'September' },
  { value: '10', label: 'October' },
  { value: '11', label: 'November' },
  { value: '12', label: 'December' },
];

export function getYearOptions(
  rangeStart = new Date().getFullYear() - 80,
  rangeEnd = new Date().getFullYear() + 10,
): ReadonlyArray<{ value: string; label: string }> {
  const start = Math.min(rangeStart, rangeEnd);
  const end = Math.max(rangeStart, rangeEnd);
  const years: { value: string; label: string }[] = [];
  for (let y = end; y >= start; y--) {
    years.push({ value: String(y), label: String(y) });
  }
  return years;
}

export function emptyEducationValue(): EducationValue {
  return {
    school: '',
    degree: '',
    field_of_study: '',
    start_month: '',
    start_year: '',
    end_month: '',
    end_year: '',
    is_current: false,
    grade: '',
    activities_and_societies: '',
    description: '',
    skills: [],
  };
}

export function getEducationValue(raw: Record<string, unknown> | undefined): EducationValue {
  const v = (raw ?? {}) as Partial<EducationValue>;
  const skills = Array.isArray(v.skills) ? v.skills.filter((s): s is string => typeof s === 'string') : [];
  return {
    school: typeof v.school === 'string' ? v.school : '',
    degree: typeof v.degree === 'string' ? v.degree : '',
    field_of_study: typeof v.field_of_study === 'string' ? v.field_of_study : '',
    start_month: typeof v.start_month === 'string' ? v.start_month : '',
    start_year: typeof v.start_year === 'string' ? v.start_year : '',
    end_month: typeof v.end_month === 'string' ? v.end_month : '',
    end_year: typeof v.end_year === 'string' ? v.end_year : '',
    is_current: v.is_current === true,
    grade: typeof v.grade === 'string' ? v.grade : '',
    activities_and_societies: typeof v.activities_and_societies === 'string' ? v.activities_and_societies : '',
    description: typeof v.description === 'string' ? v.description : '',
    skills,
  };
}

export function validateEducationValue(
  v: EducationValue,
  mustHave: ReadonlyArray<keyof EducationValue>,
): { ok: true } | { ok: false; missing: keyof EducationValue } {
  for (const key of mustHave) {
    const val = v[key];
    if (Array.isArray(val)) {
      if (val.length === 0) return { ok: false, missing: key };
    } else if (typeof val === 'string') {
      if (!val.trim()) return { ok: false, missing: key };
    } else if (!val) {
      return { ok: false, missing: key };
    }
  }
  return { ok: true };
}

export function formatEducationPeriod(
  startMonth: string,
  startYear: string,
  endMonth: string,
  endYear: string,
  isCurrent: boolean,
  monthLabel: (m: string) => string,
  presentLabel: string,
  separator: string,
): string {
  const start = [startMonth, startYear].filter(Boolean).join(' ');
  if (isCurrent) {
    return start ? `${start}${separator}${presentLabel}` : presentLabel;
  }
  const end = [endMonth, endYear].filter(Boolean).join(' ');
  if (!start && !end) return '';
  if (start && end) return `${start}${separator}${end}`;
  return start || end;
}

export function monthLabelLookup(labels: ReadonlyArray<{ value: string; label: string }>) {
  const map = new Map(labels.map((m) => [m.value, m.label] as const));
  return (value: string): string => map.get(value) ?? value;
}
