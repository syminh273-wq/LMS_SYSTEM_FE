import AbstractRestApiClient from './client';

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

const VALID_STATUSES: readonly PaymentStatus[] = ['PENDING', 'COMPLETED', 'FAILED', 'CANCELLED'];

function normalizeStatus(raw: unknown): PaymentStatus {
  if (typeof raw !== 'string') return 'PENDING';
  const upper = raw.toUpperCase();
  return (VALID_STATUSES as readonly string[]).includes(upper) ? (upper as PaymentStatus) : 'PENDING';
}

export function normalizePayment(item: PaymentListItem): PaymentListItem {
  return { ...item, status: normalizeStatus(item.status) };
}

class PaymentApiClient extends AbstractRestApiClient {
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
}

export const paymentApi = new PaymentApiClient();
