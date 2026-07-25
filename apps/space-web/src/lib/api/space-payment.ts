import BaseRestApiClient from './client';
import type {
  PaymentListItem,
  PaymentHistoryParams,
  PaymentAnalyticsSummary,
  PaymentSummaryParams,
} from './payment';

export class SpacePaymentApiClient extends BaseRestApiClient {
  public async getHistory(params?: PaymentHistoryParams): Promise<PaymentListItem[]> {
    const sp = new URLSearchParams();
    if (params?.status) sp.set('status', params.status.toLowerCase());
    if (params?.resource_type) sp.set('resource_type', params.resource_type);
    if (params?.resource_id) sp.set('resource_id', params.resource_id);
    if (params?.limit) sp.set('limit', String(params.limit));
    const qs = sp.toString();
    return this.get<PaymentListItem[]>(`/api/v1/space/payment/${qs ? `?${qs}` : ''}`);
  }

  public async getSummary(params?: PaymentSummaryParams): Promise<PaymentAnalyticsSummary> {
    const sp = new URLSearchParams();
    if (params?.from) sp.set('from', params.from);
    if (params?.to) sp.set('to', params.to);
    if (params?.status && params.status !== 'all') sp.set('status', params.status.toLowerCase());
    if (params?.resource_id) sp.set('resource_id', params.resource_id);
    if (params?.bucket) sp.set('bucket', params.bucket);
    const qs = sp.toString();
    return this.get<PaymentAnalyticsSummary>(
      `/api/v1/space/payment/summary/${qs ? `?${qs}` : ''}`
    );
  }
}

export const spacePaymentApi = new SpacePaymentApiClient();
