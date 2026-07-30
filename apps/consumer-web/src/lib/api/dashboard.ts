import BaseRestApiClient from './client';
import type { DashboardSummary } from './types';

class ConsumerDashboardApiClient extends BaseRestApiClient {
  public async getSummary(): Promise<DashboardSummary> {
    return this.get<DashboardSummary>('/api/v1/consumer/dashboard/summary/');
  }
}

export const consumerDashboardApi = new ConsumerDashboardApiClient();
