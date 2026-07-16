import { createSelector, createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { QuizTask, QuizTaskStatus } from '@/lib/api/types';

export type TaskCenterTab = 'all' | 'active' | 'completed' | 'failed';

export interface QuizTasksState {
  byId: Record<string, QuizTask>;
  ids: string[];
  panelOpen: boolean;
  activeTab: TaskCenterTab;
  loading: boolean;
  lastError: string | null;
  lastFetchedAt: number | null;
  notifiedTaskIds: string[];
}

const initialState: QuizTasksState = {
  byId: {},
  ids: [],
  panelOpen: false,
  activeTab: 'all',
  loading: false,
  lastError: null,
  lastFetchedAt: null,
  notifiedTaskIds: [],
};

const TERMINAL: QuizTaskStatus[] = ['completed', 'failed', 'archived'];

const sortTasks = (tasks: QuizTask[]): QuizTask[] => {
  return [...tasks].sort((a, b) => {
    const aActive = !TERMINAL.includes(a.status);
    const bActive = !TERMINAL.includes(b.status);
    if (aActive !== bActive) return aActive ? -1 : 1;
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });
};

const replaceTasks = (state: QuizTasksState, tasks: QuizTask[]) => {
  const map: Record<string, QuizTask> = {};
  for (const t of tasks) map[t.id] = t;
  state.byId = map;
  state.ids = sortTasks(tasks).map(t => t.id);
  state.lastFetchedAt = Date.now();
};

const quizTasksSlice = createSlice({
  name: 'quizTasks',
  initialState,
  reducers: {
    setPanelOpen: (state, action: PayloadAction<boolean>) => {
      state.panelOpen = action.payload;
    },
    togglePanel: (state) => {
      state.panelOpen = !state.panelOpen;
    },
    setActiveTab: (state, action: PayloadAction<TaskCenterTab>) => {
      state.activeTab = action.payload;
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.lastError = action.payload;
    },
    setTasks: (state, action: PayloadAction<QuizTask[]>) => {
      replaceTasks(state, action.payload);
    },
    upsertTask: (state, action: PayloadAction<QuizTask>) => {
      const t = action.payload;
      const existing = state.byId[t.id];
      state.byId[t.id] = t;
      if (!existing) {
        state.ids = [t.id, ...state.ids];
      } else {
        const isTerminalNew = TERMINAL.includes(t.status);
        const wasActive = !TERMINAL.includes(existing.status);
        if (isTerminalNew && wasActive) {
          state.ids = [t.id, ...state.ids.filter(id => id !== t.id)];
        }
      }
      state.ids = sortTasks(Object.values(state.byId)).map(x => x.id);
    },
    removeTask: (state, action: PayloadAction<string>) => {
      const id = action.payload;
      delete state.byId[id];
      state.ids = state.ids.filter(x => x !== id);
      state.notifiedTaskIds = state.notifiedTaskIds.filter(x => x !== id);
    },
    markNotified: (state, action: PayloadAction<string>) => {
      const id = action.payload;
      if (!state.notifiedTaskIds.includes(id)) {
        state.notifiedTaskIds.push(id);
      }
    },
    clearAll: (state) => {
      state.byId = {};
      state.ids = [];
      state.lastError = null;
      state.lastFetchedAt = null;
      state.notifiedTaskIds = [];
    },
  },
});

export const {
  setPanelOpen,
  togglePanel,
  setActiveTab,
  setLoading,
  setError,
  setTasks,
  upsertTask,
  removeTask,
  markNotified,
  clearAll,
} = quizTasksSlice.actions;

export default quizTasksSlice.reducer;

// ── Selectors ────────────────────────────────────────────────────────────────

import type { RootState } from './store';

const selectById = (state: RootState) => state.quizTasks.byId;
const selectIds = (state: RootState) => state.quizTasks.ids;

export const selectAllTasks = createSelector(
  [selectById, selectIds],
  (byId, ids): QuizTask[] => {
    const out: QuizTask[] = [];
    for (const id of ids) {
      const t = byId[id];
      if (t) out.push(t);
    }
    return out;
  },
);

export const selectActiveTasks = createSelector(
  [selectAllTasks],
  (tasks): QuizTask[] =>
    tasks.filter(t => t.status === 'queued' || t.status === 'running'),
);

export const selectActiveTaskCount = createSelector(
  [selectActiveTasks],
  (tasks) => tasks.length,
);

export const selectTaskById = (state: RootState, id: string): QuizTask | undefined => {
  return state.quizTasks.byId[id];
};

export const selectIsPanelOpen = (state: RootState): boolean => state.quizTasks.panelOpen;
export const selectActiveTab = (state: RootState): TaskCenterTab => state.quizTasks.activeTab;
