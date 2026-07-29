'use client';

import dynamic from 'next/dynamic';
import { Card, CardContent } from '@shared/components/ui/card';
import { Loader2, TrendingUp } from 'lucide-react';
import type { PaymentRevenueTrendPoint } from '@/lib/api/payment';

const ResponsiveContainer = dynamic(
  () => import('recharts').then((m) => m.ResponsiveContainer),
  { ssr: false }
);
const LineChart = dynamic(() => import('recharts').then((m) => m.LineChart), { ssr: false });
const Line = dynamic(() => import('recharts').then((m) => m.Line), { ssr: false });
const XAxis = dynamic(() => import('recharts').then((m) => m.XAxis), { ssr: false });
const YAxis = dynamic(() => import('recharts').then((m) => m.YAxis), { ssr: false });
const CartesianGrid = dynamic(
  () => import('recharts').then((m) => m.CartesianGrid),
  { ssr: false }
);
const Tooltip = dynamic(() => import('recharts').then((m) => m.Tooltip), { ssr: false });

function formatVND(amount: number): string {
  if (amount >= 1_000_000_000) return `${(amount / 1_000_000_000).toFixed(1)}B`;
  if (amount >= 1_000_000) return `${(amount / 1_000_000).toFixed(1)}M`;
  if (amount >= 1_000) return `${(amount / 1_000).toFixed(0)}K`;
  return String(amount);
}

function formatVNDFull(amount: number): string {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(amount);
}

type Props = {
  data: PaymentRevenueTrendPoint[];
  loading?: boolean;
};

export function RevenueTrendChart({ data, loading }: Props) {
  const hasData = data && data.length > 0;

  return (
    <Card className="h-full">
      <CardContent className="p-4 sm:p-5">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <TrendingUp size={16} className="text-primary-brand" />
            <h3 className="text-[12px] font-extrabold uppercase tracking-wide text-muted-foreground">
              Xu hướng doanh thu
            </h3>
          </div>
        </div>

        <div className="h-[220px] sm:h-[260px] relative">
          {loading && (
            <div className="absolute inset-0 flex items-center justify-center bg-background/60 z-10">
              <Loader2 size={24} className="animate-spin text-muted-foreground" />
            </div>
          )}
          {!hasData && !loading ? (
            <div className="h-full flex items-center justify-center text-[12px] text-muted-foreground">
              Chưa có dữ liệu doanh thu trong khoảng này.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data} margin={{ top: 10, right: 12, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 10, fill: '#64748b' }}
                  stroke="#cbd5e1"
                />
                <YAxis
                  tick={{ fontSize: 10, fill: '#64748b' }}
                  stroke="#cbd5e1"
                  tickFormatter={(v: number) => formatVND(v)}
                  width={56}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#fff',
                    border: '1px solid #e2e8f0',
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                  formatter={((value: number | string) => [formatVNDFull(Number(value)), 'Doanh thu']) as never}
                />
                <Line
                  type="monotone"
                  dataKey="revenue"
                  stroke="#4f46e5"
                  strokeWidth={2.5}
                  dot={{ r: 3, fill: '#4f46e5' }}
                  activeDot={{ r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
