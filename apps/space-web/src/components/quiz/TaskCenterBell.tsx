import { useRef } from 'react';
import { Button } from '@shared/components/ui/button';
import { useDispatch, useSelector } from 'react-redux';
import { ListTodo, Loader2 } from 'lucide-react';
import { useTranslation } from '@shared/components/LocaleProvider';
import {
  selectActiveTaskCount,
  selectIsPanelOpen,
  setPanelOpen,
} from '@/lib/redux/quizTasksSlice';
import type { RootState } from '@/lib/redux/store';
import TaskCenterPanel from './TaskCenterPanel';

export default function TaskCenterBell() {
  const dispatch = useDispatch();
  const { t } = useTranslation();
  const activeCount = useSelector(selectActiveTaskCount);
  const open = useSelector(selectIsPanelOpen);
  const loading = useSelector((s: RootState) => s.quizTasks.loading);
  const wrapperRef = useRef<HTMLDivElement>(null);

  return (
    <div className="relative" ref={wrapperRef}>
      <Button
        onClick={() => dispatch(setPanelOpen(!open))}
        variant="ghost"
        size="icon"
        className="relative rounded-full hover:bg-muted transition-colors"
        aria-label={t('quizTasks.badge.aria_label')}
      >
        {loading ? (
          <Loader2 size={20} className="text-primary-brand animate-spin" />
        ) : (
          <ListTodo size={20} className={activeCount > 0 ? 'text-primary-brand' : 'text-muted-foreground'} />
        )}
        {activeCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 px-1 items-center justify-center rounded-full bg-primary-brand text-[10px] font-black text-white">
            {activeCount > 99 ? '99+' : activeCount}
          </span>
        )}
      </Button>

      {open && <TaskCenterPanel onClose={() => dispatch(setPanelOpen(false))} />}
    </div>
  );
}
