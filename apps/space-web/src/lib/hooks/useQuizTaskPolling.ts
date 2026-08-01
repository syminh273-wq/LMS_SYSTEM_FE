import { useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { toast } from 'sonner';
import { quizTasksApi } from '@/lib/api/quiz-tasks';
import { useTranslation } from '@shared/components/LocaleProvider';
import type { QuizTask, QuizTaskStatus } from '@/lib/api/types';
import {
  setError,
  setLoading,
  setTasks,
  markNotified,
  upsertTask,
  selectActiveTaskCount,
  selectIsPanelOpen,
  selectAllTasks,
  clearAll,
} from '@/lib/redux/quizTasksSlice';
import type { RootState } from '@/lib/redux/store';

const PANEL_INTERVALS_MS = [2000, 3000, 5000];
const IDLE_INTERVAL_MS = 15000;
const MAX_BACKOFF_MS = 60000;

const ACTIVE_STATUSES: QuizTaskStatus[] = ['queued', 'running'];

export function useQuizTaskPolling() {
  const dispatch = useDispatch();
  const { t } = useTranslation();
  const panelOpen = useSelector((state: RootState) => selectIsPanelOpen(state));
  const activeCount = useSelector((state: RootState) => selectActiveTaskCount(state));
  const reduxAuthed = useSelector((state: RootState) => state.user.isAuthenticated);
  const tasksState = useSelector((state: RootState) => state.quizTasks);
  const notifiedIds = tasksState.notifiedTaskIds;

  // `tick` is only (re)created once per `authed` change and then re-invokes itself
  // recursively via setTimeout, so it must never read `tasksState`/`notifiedIds`
  // directly (those closures go stale). Refs give it a live view instead.
  const tasksStateRef = useRef(tasksState);
  useEffect(() => {
    tasksStateRef.current = tasksState;
  }, [tasksState]);

  const notifiedIdsRef = useRef(notifiedIds);
  useEffect(() => {
    notifiedIdsRef.current = notifiedIds;
  }, [notifiedIds]);

  // Use accessToken from localStorage as the source of truth.
  // The user slice's `isAuthenticated` flag is only set for consumer-web,
  // not for space-web (where we only store the token in localStorage).
  const [tokenPresent, setTokenPresent] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return Boolean(localStorage.getItem('accessToken'));
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const check = () => setTokenPresent(Boolean(localStorage.getItem('accessToken')));
    check();
    window.addEventListener('storage', check);
    const id = window.setInterval(check, 5000);
    return () => {
      window.removeEventListener('storage', check);
      window.clearInterval(id);
    };
  }, [reduxAuthed]);

  const authed = tokenPresent;

  const panelTickRef = useRef(0);
  const errorBackoffRef = useRef(0);
  const lastIntervalRef = useRef<number | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inFlightRef = useRef(false);

  const clearTimer = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };

  const computeInterval = (): number => {
    if (activeCount === 0) return IDLE_INTERVAL_MS;
    if (panelOpen) {
      const idx = Math.min(panelTickRef.current, PANEL_INTERVALS_MS.length - 1);
      return PANEL_INTERVALS_MS[idx];
    }
    return IDLE_INTERVAL_MS;
  };

  const scheduleNext = () => {
    clearTimer();
    const next = computeInterval();
    lastIntervalRef.current = next;
    timerRef.current = setTimeout(() => {
      void tick();
    }, next);
  };

  const tick = async () => {
    if (inFlightRef.current) {
      scheduleNext();
      return;
    }
    if (typeof document !== 'undefined' && document.hidden) {
      scheduleNext();
      return;
    }
    inFlightRef.current = true;
    try {
      dispatch(setLoading(true));

      // Try batch list first
      let listOk = false;
      let latestTasks: QuizTask[] = tasksStateRef.current.ids
        .map(id => tasksStateRef.current.byId[id])
        .filter((t): t is QuizTask => !!t);
      try {
        const tasks = await quizTasksApi.list();
        dispatch(setTasks(tasks));
        dispatch(setError(null));
        errorBackoffRef.current = 0;
        listOk = true;
        latestTasks = tasks;
      } catch (err: unknown) {
        // Fall through to per-task fallback
        const message = err instanceof Error ? err.message : 'Network error';
        dispatch(setError(message));
      }

      // If list failed, OR if some active tasks may have completed
      // server-side, also probe each active task via /tasks/<id>/
      const latestById = new Map(latestTasks.map(t => [t.id, t]));
      const activeIds = latestTasks
        .filter(t => ACTIVE_STATUSES.includes(t.status))
        .map(t => t.id);

      for (const id of activeIds) {
        try {
          const fresh = await quizTasksApi.retrieve(id);
          dispatch(upsertTask(fresh));
          latestById.set(id, fresh);
        } catch {
          // ignore individual probe errors
        }
      }

      if (listOk) {
        for (const task of latestById.values()) {
          if (
            (task.status === 'completed' || task.status === 'failed') &&
            !notifiedIdsRef.current.includes(task.id)
          ) {
            handleTerminal(task);
          }
        }
      }

      if (panelOpen) {
        panelTickRef.current = Math.min(panelTickRef.current + 1, PANEL_INTERVALS_MS.length - 1);
      } else {
        panelTickRef.current = 0;
      }

      if (!listOk) {
        errorBackoffRef.current = Math.min(
          (errorBackoffRef.current || 5000) * 2,
          MAX_BACKOFF_MS,
        );
        lastIntervalRef.current = errorBackoffRef.current;
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Network error';
      dispatch(setError(message));
      errorBackoffRef.current = Math.min(
        (errorBackoffRef.current || 5000) * 2,
        MAX_BACKOFF_MS,
      );
      lastIntervalRef.current = errorBackoffRef.current;
    } finally {
      dispatch(setLoading(false));
      inFlightRef.current = false;
      const next = errorBackoffRef.current > 0 ? errorBackoffRef.current : computeInterval();
      clearTimer();
      timerRef.current = setTimeout(() => {
        void tick();
      }, next);
    }
  };

  const handleTerminal = (task: QuizTask) => {
    if (!notifiedIdsRef.current.includes(task.id)) {
      notifiedIdsRef.current = [...notifiedIdsRef.current, task.id];
    }
    dispatch(markNotified(task.id));

    if (task.status === 'completed') {
      toast.success(t('quizTasks.toast.completed', undefined, { title: task.title }), {
        description: t('quizTasks.toast.completed_desc'),
        duration: 8000,
        action: task.quiz_uid
          ? {
              label: t('quizTasks.toast.open'),
              onClick: () => {
                window.location.href = `/space/quizzes/${task.quiz_uid}`;
              },
            }
          : undefined,
      });
    } else if (task.status === 'failed') {
      toast.error(t('quizTasks.toast.failed', undefined, { title: task.title }), {
        description: task.error_message ?? t('quizTasks.toast.failed_desc'),
        duration: 10000,
      });
    }
  };

  useEffect(() => {
    if (!authed) {
      clearTimer();
      dispatch(clearAll());
      return;
    }
    panelTickRef.current = 0;
    errorBackoffRef.current = 0;
    void tick();

    const onVisibility = () => {
      if (!document.hidden) {
        clearTimer();
        void tick();
      }
    };
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      clearTimer();
      document.removeEventListener('visibilitychange', onVisibility);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authed]);

  useEffect(() => {
    if (lastIntervalRef.current == null) return;
    if (errorBackoffRef.current > 0) return;
    clearTimer();
    scheduleNext();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [panelOpen, activeCount]);
}
