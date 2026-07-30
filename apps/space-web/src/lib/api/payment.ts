export type PaymentStatus = 'PENDING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
type PaymentResourceType = 'classroom' | 'course';

export type PaymentListItem = {
  uid: string;
  consumer_id?: string;
  teacher_id?: string | null;
  order_id: string;
  amount: number;
  order_info?: string;
  status: PaymentStatus | string;
  pay_url?: string;
  result_code?: number;
  trans_id?: number;
  created_at?: string;
  updated_at?: string;
  resource_type?: PaymentResourceType | null;
  resource_id?: string | null;
};

export type PaymentHistoryParams = {
  status?: PaymentStatus;
  resource_type?: PaymentResourceType;
  resource_id?: string;
  limit?: number;
};
