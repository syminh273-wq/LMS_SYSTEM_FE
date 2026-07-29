import dynamic from 'next/dynamic';
import { Card, CardContent } from '@shared/components/ui/card';
import { Loader2, PieChart as PieIcon } from 'lucide-react';
import type { PaymentStatusDistributionPoint } from '@/lib/api/payment';

const ResponsiveContainer = dynamic(
  () => import('recharts').then((m) => m.ResponsiveContainer),
  { ssr: false }
);
const PieChart = dynamic(() => import('recharts').then((m) => m.PieChart), { ssr: false });
const Pie = dynamic(() => import('recharts').then((m) => m.Pie), { ssr: false });
const Cell = dynamic(() => import('recharts').then((m) => m.Cell), { ssr: false });
const Tooltip = dynamic(() => import('recharts').then((m) => m.Tooltip), { ssr: false });
const Legend = dynamic(() => import('recharts').then((m) => m.Legend), { ssr: false });

const COLOR_MAP: Record<string, string> = {
  completed: '#059669', // emerald-600
  pending: '#d97706', // amber-600
  failed: '#e11d48', // rose-600
  cancelled: '#475569', // slate-600
};

type Props = {
  data: PaymentStatusDistributionPoint[];
  loading?: boolean;
};

export function PaymentStatusDonut({ data, loading }: Props) {
  const visible = (data || []).filter((d) => d.count > 0);
  const hasData = visible.length > 0;

  return (
    <Card className="h-full">
      <CardContent className="p-4 sm:p-5">
        <div className="flex items-center gap-2 mb-3">
          <PieIcon size={16} className="text-primary-brand" />
          <h3 className="text-[12px] font-extrabold uppercase tracking-wide text-muted-foreground">
            Phân bố trạng thái
          </h3>
        </div>

        <div className="h-[220px] sm:h-[260px] relative">
          {loading && (
            <div className="absolute inset-0 flex items-center justify-center bg-background/60 z-10">
              <Loader2 size={24} className="animate-spin text-muted-foreground" />
            </div>
          )}
          {!hasData && !loading ? (
            <div className="h-full flex items-center justify-center text-[12px] text-muted-foreground">
              Chưa có giao dịch nào.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={visible}
                  dataKey="count"
                  nameKey="label"
                  innerRadius={50}
                  outerRadius={85}
                  paddingAngle={2}
                  stroke="#fff"
                  strokeWidth={2}
                >
                  {visible.map((entry) => (
                    <Cell key={entry.status} fill={COLOR_MAP[entry.status] ?? '#94a3b8'} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#fff',
                    border: '1px solid #e2e8f0',
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                  formatter={((value: number | string, _name: string, props: { payload?: { percentage?: number; label?: string } }) => {
                    const pct = props?.payload?.percentage ?? 0;
                    const label = props?.payload?.label ?? '';
                    return [`${value} (${pct}%)`, label];
                  }) as never}
                />
                <Legend
                  verticalAlign="bottom"
                  height={32}
                  iconType="circle"
                  wrapperStyle={{ fontSize: 11 }}
                />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

