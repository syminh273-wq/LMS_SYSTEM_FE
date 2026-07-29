'use client';

import * as React from 'react';
import { useState, useEffect, useCallback } from 'react';
import type { AppRouterInstance } from 'next/dist/shared/lib/app-router-context.shared-runtime';
import { spaceApi, Classroom, SharingLink } from '@/lib/api';
import { toast } from 'sonner';

type ActiveTab = 'info' | 'docs' | 'chat' | 'meeting' | 'exams' | 'final_exams' | 'quiz' | 'students' | 'ai' | 'blacklist' | 'calendar' | 'leave_request' | 'ranking';

const VALID_TABS: ActiveTab[] = ['info', 'docs', 'chat', 'meeting', 'exams', 'final_exams', 'quiz', 'students', 'ai', 'blacklist', 'calendar', 'leave_request', 'ranking'];

type ExamKind = 'midterm' | 'final' | 'regular';

function isExamKind(value: string | null): value is ExamKind {
  return value === 'midterm' || value === 'final' || value === 'regular';
}

function getCanManageExams() {
  if (typeof window === 'undefined') return true;
  try {
    const raw = localStorage.getItem('userProfile');
    if (!raw) return true;
    const profile = JSON.parse(raw) as { role?: string; user_type?: string; is_admin?: boolean; is_staff?: boolean };
    const role = (profile.role || profile.user_type || '').toLowerCase();
    return profile.is_admin === true || profile.is_staff === true || role === 'admin' || role === 'teacher' || role === 'space' || !role;
  } catch {
    return true;
  }
}

export interface UseClassroomCoreArgs {
  uid: string;
  searchParams: URLSearchParams;
  pathname: string;
  router: AppRouterInstance;
  t: (key: string) => string;
}

export interface UseClassroomCoreResult {
  fetching: boolean;
  classroom: Classroom | null;
  linkData: SharingLink | null;
  activeTab: ActiveTab;
  setActiveTab: React.Dispatch<React.SetStateAction<ActiveTab>>;
  canManageExams: boolean;
  goToTab: (tab: ActiveTab, extras?: Record<string, string | null>) => void;
  goToExamKind: (kind: ExamKind) => void;
  selectedExamKind: ExamKind;
  setSelectedExamKind: React.Dispatch<React.SetStateAction<ExamKind>>;
}

export function useClassroomCore({
  uid,
  searchParams,
  pathname,
  router,
  t,
}: UseClassroomCoreArgs): UseClassroomCoreResult {
  const [fetching, setFetching] = useState(false);
  const [classroom, setClassroom] = useState<Classroom | null>(null);
  const [linkData, setLinkData] = useState<SharingLink | null>(null);
  const [activeTab, setActiveTab] = useState<'info' | 'docs' | 'chat' | 'meeting' | 'exams' | 'final_exams' | 'quiz' | 'students' | 'ai' | 'blacklist' | 'calendar' | 'leave_request' | 'ranking'>('info');
  const [selectedExamKind, setSelectedExamKind] = useState<ExamKind>('midterm');
  const [canManageExams, setCanManageExams] = useState(false);

  useEffect(() => {
    const fetchDetails = async () => {
      try {
        setFetching(true);
        const details = await spaceApi.classrooms.retrieve(uid);
        setClassroom(details);
        if (details.resolve_link) {
          setLinkData(details.resolve_link);
        } else {
          const link = await spaceApi.classrooms.getSharingLink(uid);
          setLinkData(link);
        }
      } catch (error) {
        console.error("Failed to fetch classroom details:", error);
        toast.error(t('classroom.ui.classroom_load_error'));
      } finally {
        setFetching(false);
      }
    };

    fetchDetails();
  }, [uid]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- Permissions are read from browser storage after mount.
    setCanManageExams(getCanManageExams());
  }, []);

  useEffect(() => {
     
    const tab = searchParams.get('tab');
     
    const kind = searchParams.get('kind');

    if (tab && (VALID_TABS as string[]).includes(tab)) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setActiveTab(tab as ActiveTab);
    } else {
      setActiveTab('info');
    }
    if (isExamKind(kind)) {
      setSelectedExamKind(kind);
    }
  }, [searchParams]);

  const buildQueryString = React.useCallback(
    (overrides: Record<string, string | null>) => {
      const next = new URLSearchParams(searchParams.toString());
      for (const [key, value] of Object.entries(overrides)) {
        if (value === null || value === '') next.delete(key);
        else next.set(key, value);
      }
      const qs = next.toString();
      return qs ? `${pathname}?${qs}` : pathname;
    },
    [pathname, searchParams],
  );

  const goToTab = React.useCallback(
    (tab: ActiveTab, extras: Record<string, string | null> = {}) => {
      const overrides: Record<string, string | null> = { tab: tab === 'info' ? null : tab, ...extras };
      if (tab === 'exams' || tab === 'final_exams') {
        if (!('kind' in overrides)) {
          overrides.kind = null;
        }
      } else {
        overrides.kind = null;
      }
      const url = buildQueryString(overrides);
      router.replace(url, { scroll: false });
      setActiveTab(tab);
    },
    [buildQueryString, router],
  );

  const goToExamKind = React.useCallback(
    (kind: ExamKind) => {
      router.replace(buildQueryString({ kind: kind === 'midterm' ? null : kind }), { scroll: false });
      setSelectedExamKind(kind);
    },
    [buildQueryString, router],
  );

  return {
    fetching,
    classroom,
    linkData,
    activeTab,
    setActiveTab,
    canManageExams,
    goToTab,
    goToExamKind,
    selectedExamKind,
    setSelectedExamKind,
  };
}

export default useClassroomCore;
