import BaseRestApiClient from './client';
import type { PaymentListItem, PaymentHistoryParams } from './payment';

class SpacePaymentApiClient extends BaseRestApiClient {
  public async getHistory(params?: PaymentHistoryParams): Promise<PaymentListItem[]> {
    const sp = new URLSearchParams();
    if (params?.status) sp.set('status', params.status.toLowerCase());
    if (params?.resource_type) sp.set('resource_type', params.resource_type);
    if (params?.resource_id) sp.set('resource_id', params.resource_id);
    if (params?.limit) sp.set('limit', String(params.limit));
    const qs = sp.toString();
    return this.get<PaymentListItem[]>(`/api/v1/space/payment/${qs ? `?${qs}` : ''}`);
  }
}

export const spacePaymentApi = new SpacePaymentApiClient();
