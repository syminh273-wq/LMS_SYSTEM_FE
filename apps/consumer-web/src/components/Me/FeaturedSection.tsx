'use client';

import { useState } from 'react';
import { Plus, MoreHorizontal, Trash2 } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@shared/components/ui/dropdown-menu';
import { useTranslation } from '@shared/components/LocaleProvider';
import { portfolioApi, type PortfolioEntry } from '@/lib/api/portfolio';
import { toast } from 'sonner';
import { FeaturedEditDialog } from './FeaturedEditDialog';

type FeaturedSectionProps = {
  items: PortfolioEntry[];
  isOwner?: boolean;
  onChanged: (next: PortfolioEntry[]) => void;
};

export function FeaturedSection({ items, isOwner = true, onChanged }: FeaturedSectionProps) {
  const { t } = useTranslation();
  const [editing, setEditing] = useState<PortfolioEntry | null>(null);
  const [adding, setAdding] = useState(false);

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
        <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">{t('portfolio.me.featured')}</h2>
        {isOwner && (
          <button
            onClick={() => setAdding(true)}
            className="w-8 h-8 rounded-full hover:bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 dark:text-slate-400"
            aria-label={t('portfolio.me.add')}
          >
            <Plus className="size-4" />
          </button>
        )}
      </div>

      {items.length === 0 ? (
        <p className="text-sm text-slate-400 italic">{t('portfolio.me.no_featured')}</p>
      ) : (
        <div className="space-y-3">
          {items.map((item, idx) => {
            const v = (item.value ?? {}) as {
              title?: string;
              description?: string;
              file_url?: string;
              tag?: string;
              year?: string;
            };
            const title = v.title || t('portfolio.labels.achievement_title');
            const tag = v.tag || v.year || '';
            const isLast = idx === items.length - 1;
            return (
              <article
                key={item.uid}
                className={`flex gap-4 p-2 -mx-2 rounded-lg hover:bg-slate-50 dark:bg-slate-900/50 group ${!isLast ? 'border-b border-slate-100 dark:border-slate-800 pb-3' : ''}`}
              >
                {v.file_url ? (
                  <img
                    src={v.file_url}
                    alt={title}
                    className="w-24 h-16 rounded object-cover shrink-0"
                  />
                ) : (
                  <div className="w-24 h-16 rounded bg-gradient-to-br from-violet-400 to-fuchsia-600 shrink-0 flex items-center justify-center text-white/70 text-[10px]">
                    16:9
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <button
                    onClick={() => isOwner && setEditing(item)}
                    className="text-sm font-semibold text-[#0a66c2] hover:underline text-left"
                  >
                    {title}
                  </button>
                  {tag && <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{tag}</p>}
                  {v.description && (
                    <p className="text-xs text-slate-700 dark:text-slate-300 mt-1 line-clamp-2">{v.description}</p>
                  )}
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
              </article>
            );
          })}
        </div>
      )}

      {adding && (
        <FeaturedEditDialog
          onClose={() => setAdding(false)}
          onSaved={(entry) => {
            onChanged([...items, entry]);
            setAdding(false);
          }}
        />
      )}
      {editing && (
        <FeaturedEditDialog
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
