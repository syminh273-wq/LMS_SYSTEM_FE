import AbstractRestApiClient from './client';
import { normalizePayment } from './payment';
import type { PaymentListItem } from './payment';
import type { JoinHistoryItem } from './classroom';

export type HistoryOverview = {
  payments: PaymentListItem[];
  joins: JoinHistoryItem[];
};

const CLASSROOM_ORDER_INFO_PREFIX = 'Lớp học: ';

function toJoinHistory(payments: PaymentListItem[]): JoinHistoryItem[] {
  return payments
    .filter((p) => p.status === 'COMPLETED' && p.resource_type === 'classroom' && p.resource_id)
    .map((p) => ({
      classroom_uid: p.resource_id as string,
      classroom_name: (p.order_info || '').startsWith(CLASSROOM_ORDER_INFO_PREFIX)
        ? (p.order_info as string).slice(CLASSROOM_ORDER_INFO_PREFIX.length)
        : p.order_info || '',
      teacher_id: p.teacher_id || null,
      joined_at: p.updated_at || null,
      amount: p.amount,
      order_id: p.order_id,
    }));
}

class HistoryApiClient extends AbstractRestApiClient {
  public async getOverview(limit: number = 100): Promise<HistoryOverview> {
    const sp = new URLSearchParams();
    sp.set('limit', String(limit));
    const res = await this.get<{ payments: PaymentListItem[] }>(
      `/api/v1/consumer/history/?${sp.toString()}`
    );
    const payments = (res.payments || []).map(normalizePayment);
    return { payments, joins: toJoinHistory(payments) };
  }
}

export const historyApi = new HistoryApiClient();
