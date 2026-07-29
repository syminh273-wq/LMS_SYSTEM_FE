import * as React from 'react';
import { useState, useCallback, useEffect } from 'react';
import { spaceApi } from '@/lib/api';
import type { ActivityLog } from '@/lib/api/types';

export interface UseClassroomActivityArgs {
  uid: string;
  activeTab: string;
}

export interface UseClassroomActivityResult {
  activityLogs: ActivityLog[];
  activityLevel: 'major' | 'detail';
  setActivityLevel: React.Dispatch<React.SetStateAction<'major' | 'detail'>>;
  loadingActivity: boolean;
  fetchActivity: (level: 'major' | 'detail') => Promise<void>;
}

export function useClassroomActivity({
  uid,
  activeTab,
}: UseClassroomActivityArgs): UseClassroomActivityResult {
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [activityLevel, setActivityLevel] = useState<'major' | 'detail'>('major');
  const [loadingActivity, setLoadingActivity] = useState(false);

  const fetchActivity = useCallback(async (level: 'major' | 'detail') => {
    setLoadingActivity(true);
    try {
      const logs = await spaceApi.classrooms.getActivity(uid, level, 30);
      setActivityLogs(logs);
    } catch {
      // silently fail — activity log is non-critical
    } finally {
      setLoadingActivity(false);
    }
  }, [uid]);

  useEffect(() => {
    if (activeTab === 'info') {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- Entering the tab initiates its request.
      void fetchActivity(activityLevel);
    }
  }, [activeTab, activityLevel, fetchActivity]);

  return {
    activityLogs,
    activityLevel,
    setActivityLevel,
    loadingActivity,
    fetchActivity,
  };
}

export default useClassroomActivity;
