import BaseRestApiClient from './client';

export type PaymentStatus = 'PENDING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
type PaymentResourceType = 'classroom' | 'course';

export type PaymentListItem = {
  uid: string;
  consumer_id?: string;
  teacher_id?: string | null;
  order_id: string;
  amount: number;
  order_info?: string;
  status: PaymentStatus;
  pay_url?: string;
  result_code?: number;
  trans_id?: number;
  created_at?: string;
  updated_at?: string;
  resource_type?: PaymentResourceType | null;
  resource_id?: string | null;
  resource_name?: string | null;
  teacher_name?: string | null;
};

type PaymentHistoryParams = {
  status?: PaymentStatus;
  resource_type?: PaymentResourceType;
  limit?: number;
};

const VALID_STATUSES: readonly PaymentStatus[] = ['PENDING', 'COMPLETED', 'FAILED', 'CANCELLED'];

function normalizeStatus(raw: unknown): PaymentStatus {
  if (typeof raw !== 'string') return 'PENDING';
  const upper = raw.toUpperCase();
  return (VALID_STATUSES as readonly string[]).includes(upper) ? (upper as PaymentStatus) : 'PENDING';
}

export function normalizePayment(item: PaymentListItem): PaymentListItem {
  return { ...item, status: normalizeStatus(item.status) };
}

class PaymentApiClient extends BaseRestApiClient {
  public async list(params?: PaymentHistoryParams): Promise<PaymentListItem[]> {
    const qs = buildQueryString(params);
    const response = await this.get<PaymentListItem[] | { results: PaymentListItem[] }>(
      `/api/v1/consumer/payment/${qs ? `?${qs}` : ''}`
    );
    const data = Array.isArray(response) ? response : response.results;
    return data.map(normalizePayment);
  }

  public async findByOrderId(orderId: string): Promise<PaymentListItem | null> {
    try {
      const item = await this.get<PaymentListItem>(
        `/api/v1/consumer/payment/by-order/${encodeURIComponent(orderId)}/`
      );
      return item ? normalizePayment(item) : null;
    } catch (err) {
      return null;
    }
  }

  public async getHistory(params?: PaymentHistoryParams): Promise<PaymentListItem[]> {
    return this.list(params);
  }
}

function buildQueryString(params?: PaymentHistoryParams): string {
  if (!params) return '';
  const sp = new URLSearchParams();
  if (params.status) sp.set('status', params.status.toLowerCase());
  if (params.resource_type) sp.set('resource_type', params.resource_type);
  if (params.limit) sp.set('limit', String(params.limit));
  return sp.toString();
}

export const paymentApi = new PaymentApiClient();
