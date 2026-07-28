import BaseRestApiClient from './client';

type DashboardKpis = {
  total_classrooms: number;
  active_classrooms: number;
  total_students: number;
  completion_rate_pct: number;
  certificates_issued: number;
  exams_published: number;
  submissions: number;
  graded: number;
};

type DashboardWeeklyPoint = {
  date: string;
  weekday: string;
  enrolled: number;
  submitted: number;
};

type DashboardTopClass = {
  uid: string;
  name: string;
  students: number;
  max: number;
  submissions: number;
  progress: number;
};

export type DashboardSummary = {
  kpis: DashboardKpis;
  weekly_trend: DashboardWeeklyPoint[];
  top_classes: DashboardTopClass[];
  recent_activity: import('./types').ActivityLog[];
};

type DashboardUsage = {
  storage_used_mb: number;
  storage_limit_mb: number;
  api_calls_this_month: number;
  api_calls_limit: number;
  active_classrooms: number;
  total_classrooms: number;
  published_exams: number;
};

class DashboardApiClient extends BaseRestApiClient {
  public async summary(): Promise<DashboardSummary> {
    return this.get<DashboardSummary>('/api/v1/space/dashboard/summary/');
  }

  public async usage(): Promise<DashboardUsage> {
    return this.get<DashboardUsage>('/api/v1/space/dashboard/usage/');
  }
}

export const dashboardApi = new DashboardApiClient();
