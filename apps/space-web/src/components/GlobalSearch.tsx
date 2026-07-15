'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  BookOpen,
  FileText,
  Gamepad2,
  Loader2,
  Search,
  User,
  X,
  File,
} from 'lucide-react';
import { searchApi, SearchResultItem, SearchResponse } from '@/lib/api/search';
import { useTranslation } from '@shared/components/LocaleProvider';

// ── helpers ──────────────────────────────────────────────────────────────────

function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

const TYPE_ICONS = {
  classroom: BookOpen,
  exam: FileText,
  quiz: Gamepad2,
  consumer: User,
  resource: File,
} as const;

const TYPE_META = {
  classroom: {
    color: 'text-primary-brand',
    bg: 'bg-primary-brand-light dark:bg-indigo-950/40',
    href: (item: SearchResultItem) => `/space/classrooms/${item.entity_id}/details`,
  },
  exam: {
    color: 'text-amber-500',
    bg: 'bg-amber-50 dark:bg-amber-950/40',
    href: (item: SearchResultItem) =>
      `/space/classrooms/${item.classroom_id}/exams/${item.entity_id}`,
  },
  quiz: {
    color: 'text-emerald-500',
    bg: 'bg-emerald-50 dark:bg-emerald-950/40',
    href: (item: SearchResultItem) => `/space/quizzes/${item.entity_id}`,
  },
  consumer: {
    color: 'text-sky-500',
    bg: 'bg-sky-50 dark:bg-sky-950/40',
    href: (item: SearchResultItem) => `/space/student/${item.entity_id}`,
  },
  resource: {
    color: 'text-rose-500',
    bg: 'bg-rose-50 dark:bg-rose-950/40',
    href: (_item: SearchResultItem) => `/space/classrooms`,
  },
} as const;

type ResultType = keyof typeof TYPE_META;

type FlatResult = SearchResultItem & { type: ResultType };

function flatten(data: SearchResponse): FlatResult[] {
  const out: FlatResult[] = [];
  for (const type of Object.keys(TYPE_META) as ResultType[]) {
    const col = data[type];
    if (col?.results) {
      for (const r of col.results) out.push({ ...r, type });
    }
  }
  return out;
}

// ── sub-components ────────────────────────────────────────────────────────────

function ResultItem({
  item,
  active,
  onClick,
  onMouseEnter,
  labelKey,
  t,
}: {
  item: FlatResult;
  active: boolean;
  onClick: () => void;
  onMouseEnter: () => void;
  labelKey: string;
  t: (key: string, fallback?: string) => string;
}) {
  const meta = TYPE_META[item.type];
  const Icon = TYPE_ICONS[item.type];
  return (
    <button
      type="button"
      onMouseEnter={onMouseEnter}
      onClick={onClick}
      className={`w-full flex items-start gap-3 px-4 py-3 text-left rounded-lg transition-colors ${
        active ? 'bg-primary-brand-light dark:bg-indigo-900/30' : 'hover:bg-muted/60'
      }`}
    >
      <span className={`mt-0.5 flex-shrink-0 p-1.5 rounded-md ${meta.bg}`}>
        <Icon size={14} className={meta.color} />
      </span>
      <span className="flex-1 min-w-0">
        <span className="block text-sm font-semibold text-foreground truncate">
          {item.title || t('layout.search.untitled')}
        </span>
        {item.snippet && (
          <span
            className="block text-xs text-muted-foreground mt-0.5 line-clamp-1"
            dangerouslySetInnerHTML={{ __html: item.snippet }}
          />
        )}
      </span>
      <span className={`flex-shrink-0 text-[10px] font-bold uppercase tracking-wider mt-1 ${meta.color}`}>
        {t(labelKey)}
      </span>
    </button>
  );
}

function GroupLabel({ label }: { label: string }) {
  return (
    <p className="px-4 pt-3 pb-1 text-[10px] font-bold uppercase tracking-widest text-muted-foreground select-none">
      {label}
    </p>
  );
}

// ── main component ────────────────────────────────────────────────────────────

export default function GlobalSearch() {
  const router = useRouter();
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<SearchResponse | null>(null);
  const [activeIdx, setActiveIdx] = useState(0);

  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const debouncedQuery = useDebounce(query, 280);

  // open/close
  const openDialog = useCallback(() => {
    setOpen(true);
    setQuery('');
    setResults(null);
    setActiveIdx(0);
  }, []);

  const closeDialog = useCallback(() => {
    setOpen(false);
    setQuery('');
    setResults(null);
  }, []);

  // global keyboard shortcut
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        open ? closeDialog() : openDialog();
      }
      if (e.key === 'Escape' && open) closeDialog();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, openDialog, closeDialog]);

  // focus input when opened
  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 50);
  }, [open]);

  // search
  useEffect(() => {
    if (!open || !debouncedQuery.trim()) {
      setResults(null);
      return;
    }
    let cancelled = false;
    setLoading(true);
    searchApi
      .search(debouncedQuery, ['classroom', 'exam', 'quiz', 'consumer', 'resource'], { limit: 5 })
      .then((data) => {
        if (!cancelled) {
          setResults(data);
          setActiveIdx(0);
        }
      })
      .catch(() => {
        if (!cancelled) setResults(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [debouncedQuery, open]);

  const flat = results ? flatten(results) : [];

  // keyboard nav inside results
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (!flat.length) return;
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setActiveIdx((i) => Math.min(i + 1, flat.length - 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setActiveIdx((i) => Math.max(i - 1, 0));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        navigate(flat[activeIdx]);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, flat, activeIdx]);

  const navigate = useCallback(
    (item: FlatResult) => {
      const meta = TYPE_META[item.type];
      router.push(meta.href(item));
      closeDialog();
    },
    [router, closeDialog],
  );

  // group flat results by type for display
  const grouped = (Object.keys(TYPE_META) as ResultType[]).reduce<
    Record<ResultType, FlatResult[]>
  >(
    (acc, t) => {
      acc[t] = flat.filter((r) => r.type === t);
      return acc;
    },
    {} as Record<ResultType, FlatResult[]>,
  );

  const totalHits = flat.length;
  let runningIdx = 0;

  if (!open) {
    return (
      <button
        type="button"
        onClick={openDialog}
        className="flex items-center gap-2.5 px-4 py-2 rounded-full bg-muted/60 border border-border hover:bg-muted transition-colors text-sm text-muted-foreground group"
      >
        <Search size={15} className="text-muted-foreground group-hover:text-foreground transition-colors" />
        <span className="hidden sm:block">{t('layout.search.trigger_label')}</span>
        <kbd className="hidden sm:inline-flex items-center gap-0.5 rounded border border-border bg-background px-1.5 py-0.5 text-[10px] font-bold text-muted-foreground">
          ⌘K
        </kbd>
      </button>
    );
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm"
        onClick={closeDialog}
        aria-hidden
      />

      {/* Dialog */}
      <div
        role="dialog"
        aria-modal
        aria-label={t('layout.search.dialog_aria_label')}
        className="fixed left-1/2 top-[15vh] z-50 w-full max-w-xl -translate-x-1/2 rounded-2xl bg-popover shadow-2xl ring-1 ring-border overflow-hidden"
      >
        {/* Search input */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-border">
          {loading ? (
            <Loader2 size={18} className="text-primary-brand animate-spin flex-shrink-0" />
          ) : (
            <Search size={18} className="text-muted-foreground flex-shrink-0" />
          )}
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t('layout.search.placeholder')}
            className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none"
          />
          {query && (
            <button
              type="button"
              onClick={() => { setQuery(''); inputRef.current?.focus(); }}
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              <X size={16} />
            </button>
          )}
          <button
            type="button"
            onClick={closeDialog}
            className="text-[10px] font-bold text-muted-foreground border border-border rounded px-1.5 py-0.5 hover:text-foreground transition-colors"
          >
            ESC
          </button>
        </div>

        {/* Results */}
        <div ref={listRef} className="max-h-[60vh] overflow-y-auto py-2">
          {!query.trim() && (
            <p className="text-center text-sm text-muted-foreground py-10 select-none">
              {t('layout.search.empty_prompt')}
            </p>
          )}

          {query.trim() && !loading && totalHits === 0 && (
            <p className="text-center text-sm text-muted-foreground py-10 select-none">
              {t('layout.search.no_results_for', undefined, { query })}
            </p>
          )}

          {(Object.keys(TYPE_META) as ResultType[]).map((type) => {
            const items = grouped[type];
            if (!items?.length) return null;
            const labelKey = `layout.search.type_${type}`;
            return (
              <div key={type}>
                <GroupLabel label={t(labelKey)} />
                {items.map((item) => {
                  const idx = runningIdx++;
                  return (
                    <ResultItem
                      key={`${item.type}-${item.id}`}
                      item={item}
                      active={activeIdx === idx}
                      onMouseEnter={() => setActiveIdx(idx)}
                      onClick={() => navigate(item)}
                      labelKey={labelKey}
                      t={t}
                    />
                  );
                })}
              </div>
            );
          })}
        </div>

        {/* Footer */}
        {totalHits > 0 && (
          <div className="flex items-center justify-between px-4 py-2.5 border-t border-border bg-muted/30">
            <span className="text-[11px] text-muted-foreground">
              {t('layout.search.results_count_other', undefined, { count: totalHits })}
            </span>
            <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
              <span className="flex items-center gap-1">
                <kbd className="border border-border rounded px-1">↑↓</kbd> {t('layout.search.navigate')}
              </span>
              <span className="flex items-center gap-1">
                <kbd className="border border-border rounded px-1">↵</kbd> {t('layout.search.open')}
              </span>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
