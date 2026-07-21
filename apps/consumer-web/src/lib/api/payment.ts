import BaseRestApiClient from './client';

export type PaymentListItem = {
  uid: string;
  order_id: string;
  amount: number;
  status: 'PENDING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
  order_info?: string;
  pay_url?: string;
  created_at?: string;
  resource_type?: 'classroom' | 'course' | null;
  resource_id?: string | null;
};

export class PaymentApiClient extends BaseRestApiClient {
  public async list(): Promise<PaymentListItem[]> {
    const response = await this.get<PaymentListItem[] | { results: PaymentListItem[] }>(
      '/api/v1/consumer/payment/'
    );
    return Array.isArray(response) ? response : response.results;
  }

  public async findByOrderId(orderId: string): Promise<PaymentListItem | null> {
    const items = await this.list();
    return items.find((p) => p.order_id === orderId) ?? null;
  }
}

export const paymentApi = new PaymentApiClient();
