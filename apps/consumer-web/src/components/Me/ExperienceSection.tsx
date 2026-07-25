'use client';

import { useMemo, useState } from 'react';
import { Briefcase, Plus, MoreHorizontal, Trash2 } from 'lucide-react';
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
  formatEducationPeriod,
  monthLabelLookup,
} from '@shared/lib/portfolio/education';
import { toast } from 'sonner';
import { ExperienceEditDialog } from './ExperienceEditDialog';
import { CollapsibleItem } from './CollapsibleItem';

type Props = {
  items: PortfolioEntry[];
  isOwner?: boolean;
  onChanged: (next: PortfolioEntry[]) => void;
};

export function ExperienceSection({ items, isOwner = true, onChanged }: Props) {
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
    <section className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">{t('portfolio.me.experience')}</h2>
        {isOwner && (
          <div className="flex items-center gap-1">
            <button
              onClick={() => setAdding(true)}
              className="w-8 h-8 rounded-full hover:bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 dark:text-slate-400"
              aria-label={t('portfolio.me.add')}
            >
              <Plus className="size-4" />
            </button>
          </div>
        )}
      </div>

      {items.length === 0 ? (
        <p className="text-sm text-slate-400 italic">{t('portfolio.me.no_experience')}</p>
      ) : (
        <div className="space-y-5">
          {items.map((item, idx) => {
            const v = (item.value ?? {}) as {
              company?: string;
              position?: string;
              start_month?: string;
              start_year?: string;
              end_month?: string;
              end_year?: string;
              is_current?: boolean;
              description?: string;
              location?: string;
            };
            const isLast = idx === items.length - 1;
            const period = formatEducationPeriod(
              v.start_month ?? '',
              v.start_year ?? '',
              v.end_month ?? '',
              v.end_year ?? '',
              v.is_current === true,
              monthLabel,
              t('portfolio.me.present'),
              ' – ',
            );
            return (
              <div
                key={item.uid}
                className={`flex gap-4 group ${!isLast ? 'border-b border-slate-100 dark:border-slate-800 pb-5' : ''}`}
              >
                <div className="w-12 h-12 rounded bg-blue-100 text-blue-700 flex items-center justify-center shrink-0 text-xl">
                  <Briefcase className="size-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <CollapsibleItem
                    summary={
                      <>
                        <p className="text-base font-semibold text-slate-900 dark:text-slate-100">
                          {v.position || v.company}
                        </p>
                        {v.position && v.company && (
                          <p className="text-sm text-slate-700 dark:text-slate-300">{v.company}</p>
                        )}
                        {period && (
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{period}</p>
                        )}
                        {v.location && (
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{v.location}</p>
                        )}
                      </>
                    }
                    details={
                      v.description ? (
                        <p className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-line">{v.description}</p>
                      ) : null
                    }
                  />
                </div>
                {isOwner && (
                  <DropdownMenu>
                    <DropdownMenuTrigger className="w-8 h-8 rounded-full hover:bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 opacity-0 group-hover:opacity-100">
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
        <ExperienceEditDialog
          onClose={() => setAdding(false)}
          onSaved={(entry) => {
            onChanged([...items, entry]);
            setAdding(false);
          }}
        />
      )}
      {editing && (
        <ExperienceEditDialog
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
