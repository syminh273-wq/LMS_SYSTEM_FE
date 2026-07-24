'use client';

import * as React from 'react';
import { useMemo, useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useDispatch, useSelector } from 'react-redux';
import { Loader2, CheckCircle2, XCircle, Clock, RotateCw, ExternalLink, X, Trash2, ListTodo } from 'lucide-react';
import { toast } from 'sonner';
import { quizTasksApi } from '@/lib/api/quiz-tasks';
import { useTranslation } from '@shared/components/LocaleProvider';
import type { QuizTask, QuizTaskStatus } from '@/lib/api/types';
import {
  removeTask,
  selectActiveTaskCount,
  selectActiveTab,
  setActiveTab,
  upsertTask,
  type TaskCenterTab,
} from '@/lib/redux/quizTasksSlice';
import type { RootState } from '@/lib/redux/store';

const TABS: TaskCenterTab[] = ['all', 'active', 'completed', 'failed'];

const STATUS_ICON: Record<QuizTaskStatus, React.ComponentType<{ size?: number; className?: string }>> = {
  queued: Clock,
  running: Loader2,
  completed: CheckCircle2,
  failed: XCircle,
  archived: Clock,
};

const STATUS_CLASS: Record<QuizTaskStatus, string> = {
  queued: 'text-amber-500',
  running: 'text-primary-brand',
  completed: 'text-emerald-500',
  failed: 'text-rose-500',
  archived: 'text-muted-foreground',
};

function filterTasks(tasks: QuizTask[], tab: TaskCenterTab): QuizTask[] {
  if (tab === 'all') return tasks;
  if (tab === 'active') return tasks.filter(t => t.status === 'queued' || t.status === 'running');
  if (tab === 'completed') return tasks.filter(t => t.status === 'completed');
  if (tab === 'failed') return tasks.filter(t => t.status === 'failed');
  return tasks;
}

function formatRelative(iso: string, t: (k: string, f?: string, v?: Record<string, string | number>) => string): string {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (diff < 60) return t('quizTasks.progress.just_now');
  if (diff < 3600) return t('quizTasks.progress.minutes_ago', undefined, { count: Math.floor(diff / 60) });
  if (diff < 86400) return t('quizTasks.progress.hours_ago', undefined, { count: Math.floor(diff / 3600) });
  return t('quizTasks.progress.days_ago', undefined, { count: Math.floor(diff / 86400) });
}

type Props = {
  onClose: () => void;
};

export default function TaskCenterPanel({ onClose }: Props) {
  const dispatch = useDispatch();
  const router = useRouter();
  const { t } = useTranslation();
  const tasks = useSelector((s: RootState) => s.quizTasks.ids.map(id => s.quizTasks.byId[id]).filter(Boolean) as QuizTask[]);
  const tab = useSelector(selectActiveTab);
  const activeCount = useSelector(selectActiveTaskCount);
  const loading = useSelector((s: RootState) => s.quizTasks.loading);
  const lastError = useSelector((s: RootState) => s.quizTasks.lastError);
  const lastFetchedAt = useSelector((s: RootState) => s.quizTasks.lastFetchedAt);
  const [now, setNow] = useState<number>(0);
  const [busyTaskId, setBusyTaskId] = useState<string | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const update = () => setNow(Date.now());
    update();
    const id = setInterval(update, 30000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 30000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (!lastFetchedAt) return;
    const remaining = Math.max(0, lastFetchedAt + 60000 - now);
    const id = setTimeout(() => setNow(Date.now()), remaining + 100);
    return () => clearTimeout(id);
  }, [lastFetchedAt, now]);

  const visible = useMemo(() => {
    const seen = new Set<string>();
    const out: QuizTask[] = [];
    for (const task of filterTasks(tasks, tab)) {
      if (seen.has(task.id)) continue;
      seen.add(task.id);
      out.push(task);
    }
    return out;
  }, [tasks, tab]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [onClose]);

  const handleOpen = (task: QuizTask) => {
    if (task.quiz_uid) {
      onClose();
      router.push(`/space/quizzes/${task.quiz_uid}`);
    }
  };

  const handleRetry = async (task: QuizTask) => {
    if (task.status !== 'failed') return;
    setBusyTaskId(task.id);
    try {
      const updated = await quizTasksApi.retry(task.id);
      dispatch(upsertTask(updated));
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : t('quizTasks.toast.retry_error'));
    } finally {
      setBusyTaskId(null);
    }
  };

  const handleDismiss = async (task: QuizTask) => {
    setBusyTaskId(task.id);
    try {
      await quizTasksApi.dismiss(task.id);
      dispatch(removeTask(task.id));
    } catch (err: unknown) {
      dispatch(removeTask(task.id));
      toast.error(err instanceof Error ? err.message : t('quizTasks.toast.dismiss_error'));
    } finally {
      setBusyTaskId(null);
    }
  };

  return (
    <div
      ref={panelRef}
      className="absolute right-0 top-12 z-50 w-[380px] max-h-[560px] flex flex-col rounded-2xl border border-border bg-card shadow-2xl overflow-hidden"
      role="dialog"
      aria-label={t('quizTasks.panel.title')}
    >
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <div className="flex items-center gap-2">
          <ListTodo size={16} className="text-primary-brand" />
          <span className="text-sm font-black text-foreground">{t('quizTasks.panel.title')}</span>
          {activeCount > 0 && (
            <span className="text-[10px] font-black uppercase text-primary-brand">
              {t('quizTasks.panel.subtitle', undefined, { count: activeCount })}
            </span>
          )}
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition"
          aria-label="Close"
        >
          <X size={16} />
        </button>
      </div>

      <div className="flex items-center gap-1 px-3 py-2 border-b border-border bg-muted/30">
        {TABS.map(key => (
          <button
            key={key}
            onClick={() => dispatch(setActiveTab(key))}
            className={`flex-1 px-2 py-1.5 rounded-lg text-[11px] font-black uppercase tracking-wide transition ${
              tab === key
                ? 'bg-primary-brand text-white shadow-sm'
                : 'text-muted-foreground hover:bg-muted'
            }`}
          >
            {t(`quizTasks.panel.tabs.${key}`)}
          </button>
        ))}
      </div>

      {lastError && (
        <div className="px-4 py-1.5 bg-amber-500/10 border-b border-amber-500/20 text-[11px] font-bold text-amber-600 flex items-center gap-2">
          <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />
          {t('quizTasks.panel.reconnecting')}
        </div>
      )}

      <div className="flex-1 overflow-y-auto">
        {visible.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
            <ListTodo size={28} className="mb-2 opacity-30" />
            <p className="text-xs font-bold">{t('quizTasks.panel.empty')}</p>
            <p className="text-[10px] mt-1 text-center px-6">{t('quizTasks.panel.empty_hint')}</p>
          </div>
        ) : (
          <ul className="divide-y divide-border">
            {visible.map((task, idx) => (
              <TaskRow
                key={task.id ? `task-${task.id}` : `task-idx-${idx}`}
                task={task}
                now={now}
                busy={busyTaskId === task.id}
                onOpen={() => handleOpen(task)}
                onRetry={() => void handleRetry(task)}
                onDismiss={() => void handleDismiss(task)}
              />
            ))}
          </ul>
        )}
      </div>

      {loading && (
        <div className="px-4 py-1.5 border-t border-border bg-muted/30 text-[10px] text-muted-foreground font-bold flex items-center gap-2">
          <Loader2 size={11} className="animate-spin" />
          <span>…</span>
        </div>
      )}
    </div>
  );
}

type RowProps = {
  task: QuizTask;
  now: number;
  busy: boolean;
  onOpen: () => void;
  onRetry: () => void;
  onDismiss: () => void;
};

function TaskRow({ task, now, busy, onOpen, onRetry, onDismiss }: RowProps) {
  const { t } = useTranslation();
  const Icon = STATUS_ICON[task.status] ?? Clock;
  const colorClass = STATUS_CLASS[task.status] ?? 'text-muted-foreground';
  const isActive = task.status === 'queued' || task.status === 'running';
  const isFailed = task.status === 'failed';
  const isCompleted = task.status === 'completed';
  const progress = isActive
    ? Math.max(0, Math.min(100, task.progress ?? 0))
    : isCompleted ? 100 : 0;
  const stepLabel = task.total_steps > 0
    ? t('quizTasks.progress.step', undefined, { current: task.current_step, total: task.total_steps })
    : null;

  void now;

  return (
    <li className="px-4 py-3 hover:bg-muted/40 transition">
      <div className="flex items-start gap-3">
        <div className={`mt-0.5 h-8 w-8 shrink-0 rounded-full flex items-center justify-center bg-muted ${colorClass}`}>
          <Icon size={15} className={task.status === 'running' ? 'animate-spin' : ''} />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-sm font-bold text-foreground truncate flex-1">{task.title || t('quizTasks.status.queued')}</p>
            <span className={`text-[10px] font-black uppercase ${colorClass}`}>
              {t(`quizTasks.status.${task.status}`)}
            </span>
          </div>

          {isActive && (
            <div className="mt-1.5">
              <div className="flex items-center justify-between text-[10px] font-bold text-muted-foreground mb-0.5">
                <span>{stepLabel ?? t('quizTasks.progress.running', undefined, { percent: progress })}</span>
                {stepLabel && <span>{progress}%</span>}
              </div>
              <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full bg-primary-brand transition-all duration-500"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}

          {isFailed && task.error_message && (
            <p className="text-[11px] text-rose-500 mt-1 line-clamp-2">{task.error_message}</p>
          )}

          <p className="text-[10px] text-muted-foreground mt-1.5 font-medium">
            {formatRelative(task.created_at, t)}
          </p>

          <div className="mt-2 flex items-center gap-2">
            {isCompleted && task.quiz_uid && (
              <button
                onClick={onOpen}
                disabled={busy}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-black bg-primary-brand text-white hover:bg-primary-brand-dark transition disabled:opacity-50"
              >
                <ExternalLink size={11} />
                {t('quizTasks.actions.open')}
              </button>
            )}
            {isFailed && (
              <button
                onClick={onRetry}
                disabled={busy}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-black border border-border text-foreground hover:bg-muted transition disabled:opacity-50"
              >
                {busy ? <Loader2 size={11} className="animate-spin" /> : <RotateCw size={11} />}
                {t('quizTasks.actions.retry')}
              </button>
            )}
            {(isCompleted || isFailed) && (
              <button
                onClick={onDismiss}
                disabled={busy}
                className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold text-muted-foreground hover:text-rose-500 hover:bg-rose-500/10 transition disabled:opacity-50"
                aria-label={t('quizTasks.actions.dismiss')}
              >
                <Trash2 size={11} />
              </button>
            )}
          </div>
        </div>
      </div>
    </li>
  );
}
