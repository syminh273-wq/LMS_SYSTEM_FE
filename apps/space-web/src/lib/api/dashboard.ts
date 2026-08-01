import AbstractRestApiClient from './client';

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
  top_classes: DashboardTopClass[];
};

class DashboardApiClient extends AbstractRestApiClient {
  public async summary(): Promise<DashboardSummary> {
    return this.get<DashboardSummary>('/api/v1/space/dashboard/summary/');
  }
}

export const dashboardApi = new DashboardApiClient();
