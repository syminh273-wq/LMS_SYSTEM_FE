export type PaymentStatus = 'PENDING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
export type PaymentResourceType = 'classroom' | 'course';

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

export type PaymentSummaryByClassroom = {
  classroom_uid: string;
  classroom_name: string;
  total_count: number;
  total_revenue: number;
  completed_count: number;
  pending_count: number;
};

export type PaymentSummary = {
  total_count: number;
  total_revenue: number;
  completed_count: number;
  pending_count: number;
  failed_count: number;
  cancelled_count: number;
  by_classroom: PaymentSummaryByClassroom[];
};

// ── Analytics (dashboard) ──────────────────────────────────────────────

export type PaymentBucket = 'day' | 'week' | 'month';

export type PaymentSummaryParams = {
  from?: string;
  to?: string;
  status?: PaymentStatus | 'all';
  resource_id?: string;
  bucket?: PaymentBucket;
};

export type PaymentKpis = {
  total_revenue: number;
  total_transactions: number;
  total_paid_amount: number;
  total_pending_amount: number;
  refunded_amount: number;
  failed_count: number;
};

export type PaymentStatusDistributionPoint = {
  status: 'pending' | 'completed' | 'failed' | 'cancelled';
  label: string;
  count: number;
  amount: number;
  percentage: number;
};

export type PaymentRevenueTrendPoint = {
  date: string;
  revenue: number;
  transaction_count: number;
};

export type PaymentAnalyticsSummary = {
  kpis: PaymentKpis;
  status_distribution: PaymentStatusDistributionPoint[];
  revenue_trend: PaymentRevenueTrendPoint[];
  by_classroom: PaymentSummaryByClassroom[];
  filters: {
    from: string | null;
    to: string | null;
    status: string | null;
    resource_id: string | null;
    bucket: PaymentBucket;
  };
  approximated: boolean;
};
