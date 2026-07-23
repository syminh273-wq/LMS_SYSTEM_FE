'use client';

import { useMemo, useState } from 'react';
import { GraduationCap, Plus, MoreHorizontal, Trash2 } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@shared/components/ui/dropdown-menu';
import { useTranslation } from '@shared/components/LocaleProvider';
import { portfolioApi, type PortfolioEntry } from '@/lib/api/portfolio';
import {
  MONTHS,
  getEducationValue,
  monthLabelLookup,
  type EducationValue,
} from '@shared/lib/portfolio/education';
import { toast } from 'sonner';
import { EducationEditDialog } from './EducationEditDialog';
import { CollapsibleItem } from './CollapsibleItem';

type Props = {
  items: PortfolioEntry[];
  isOwner?: boolean;
  onChanged: (next: PortfolioEntry[]) => void;
};

export function EducationSection({ items, isOwner = true, onChanged }: Props) {
  const { t } = useTranslation();
  const [editing, setEditing] = useState<PortfolioEntry | null>(null);
  const [adding, setAdding] = useState(false);

  const monthLabel = useMemo(() => monthLabelLookup(MONTHS), []);

  const handleDelete = async (uid: string) => {
    if (!confirm(t('portfolio.labels.delete_confirm'))) return;
    try {
      await portfolioApi.deleteEntry(uid);
      onChanged(items.filter((i) => i.uid !== uid));
      toast.success(t('portfolio.labels.deleted'));
    } catch (err) {
      console.error(err);
      toast.error(t('portfolio.labels.delete_error'));
    }
  };

  return (
    <section className="bg-white rounded-lg border border-slate-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-slate-900">{t('portfolio.me.education')}</h2>
        {isOwner && (
          <button
            onClick={() => setAdding(true)}
            className="w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-500"
            aria-label={t('portfolio.me.add')}
          >
            <Plus className="size-4" />
          </button>
        )}
      </div>

      {items.length === 0 ? (
        <p className="text-sm text-slate-400 italic">{t('portfolio.me.no_education')}</p>
      ) : (
        <div className="space-y-5">
          {items.map((item, idx) => {
            const v = getEducationValue(item.value as Record<string, unknown> | undefined);
            const isLast = idx === items.length - 1;
            return (
              <div
                key={item.uid}
                className={`flex gap-4 group ${!isLast ? 'border-b border-slate-100 pb-5' : ''}`}
              >
                <div className="w-12 h-12 rounded bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 text-xl">
                  <GraduationCap className="size-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <CollapsibleItem
                    summary={
                      <>
                        <p className="text-base font-semibold text-slate-900">{v.school}</p>
                        {(v.degree || v.field_of_study) && (
                          <p className="text-sm text-slate-700">
                            {[v.degree, v.field_of_study].filter(Boolean).join(', ')}
                          </p>
                        )}
                        <PeriodLine v={v} monthLabel={monthLabel} />
                      </>
                    }
                    details={
                      <>
                        {v.grade && (
                          <p className="text-xs text-slate-600">
                            <span className="text-slate-500">{t('portfolio.labels.grade')}:</span> {v.grade}
                          </p>
                        )}
                        {v.activities_and_societies && (
                          <p className="text-xs text-slate-600 mt-1">
                            <span className="text-slate-500">{t('portfolio.labels.activities_and_societies')}:</span>{' '}
                            {v.activities_and_societies}
                          </p>
                        )}
                        {v.description && (
                          <p className="text-sm text-slate-700 mt-2 whitespace-pre-line">{v.description}</p>
                        )}
                        {v.skills.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 mt-2">
                            {v.skills.map((s) => (
                              <span
                                key={s}
                                className="inline-flex items-center px-2 py-0.5 rounded-full bg-slate-100 text-[11px] text-slate-700"
                              >
                                {s}
                              </span>
                            ))}
                          </div>
                        )}
                      </>
                    }
                  />
                </div>
                {isOwner && (
                  <DropdownMenu>
                    <DropdownMenuTrigger className="w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-400 opacity-0 group-hover:opacity-100">
                      <MoreHorizontal className="size-4" />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => setEditing(item)}>
                        {t('portfolio.me.edit')}
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleDelete(item.uid)}
                        className="text-red-600"
                      >
                        <Trash2 className="size-3.5" />
                        {t('portfolio.me.delete')}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>
            );
          })}
        </div>
      )}

      {adding && (
        <EducationEditDialog
          onClose={() => setAdding(false)}
          onSaved={(entry) => {
            onChanged([...items, entry]);
            setAdding(false);
          }}
        />
      )}
      {editing && (
        <EducationEditDialog
          initial={editing}
          onClose={() => setEditing(null)}
          onSaved={(entry) => {
            onChanged(items.map((i) => (i.uid === entry.uid ? entry : i)));
            setEditing(null);
          }}
        />
      )}
    </section>
  );
}

function PeriodLine({ v, monthLabel }: { v: EducationValue; monthLabel: (m: string) => string }) {
  const startMonthLabel = v.start_month ? monthLabel(v.start_month) : '';
  const endMonthLabel = v.end_month ? monthLabel(v.end_month) : '';
  const start = [startMonthLabel, v.start_year].filter(Boolean).join(' ');
  let end: string;
  if (v.is_current) {
    end = 'Present';
  } else if (v.end_month || v.end_year) {
    end = [endMonthLabel, v.end_year].filter(Boolean).join(' ');
  } else {
    end = '';
  }
  if (!start && !end) return null;
  const text = start && end ? `${start} – ${end}` : start || end;
  return <p className="text-xs text-slate-500 mt-0.5">{text}</p>;
}
