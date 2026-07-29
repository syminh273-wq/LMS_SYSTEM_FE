import { useTranslation } from '@shared/components/LocaleProvider';
import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

export default function GradeLineChart({ data }: { data: { name: string; grade: number; index: number }[] }) {
  const { t } = useTranslation();
  return (
    <ResponsiveContainer width="100%" height={220}>
      <LineChart data={data} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
        <XAxis dataKey="name" tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }} />
        <YAxis domain={[0, 10]} tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }} />
        <Tooltip
          contentStyle={{ fontSize: 12, fontWeight: 700 }}
          formatter={value => [typeof value === 'number' ? value.toFixed(1) : String(value ?? '--'), t('classroom.ui.score_avg')]}
        />
        <ReferenceLine y={5} stroke="#f59e0b" strokeDasharray="4 2" label={{ value: t('classroom.ui.analyze_trend'), fontSize: 10, fill: '#f59e0b' }} />
        <Line
          type="monotone"
          dataKey="grade"
          stroke="#6366f1"
          strokeWidth={2.5}
          dot={{ r: 5, fill: '#6366f1', strokeWidth: 0 }}
          activeDot={{ r: 7, fill: '#4f46e5' }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
