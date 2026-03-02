import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import type { BodyCompEntry } from '../../types';
import { formatShort } from '../../utils/date-helpers';

export function WeightTrendChart({ entries }: { entries: BodyCompEntry[] }) {
  const data = entries.map(e => ({
    date: formatShort(e.date),
    weight: e.weight,
  }));

  return (
    <ResponsiveContainer width="100%" height={160}>
      <LineChart data={data} margin={{ top: 5, right: 5, bottom: 0, left: -15 }}>
        <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#8a8578' }} />
        <YAxis
          domain={['dataMin - 2', 'dataMax + 2']}
          tick={{ fontSize: 10, fill: '#8a8578' }}
          tickFormatter={v => `${v}`}
        />
        <Tooltip
          contentStyle={{ backgroundColor: '#141414', border: '1px solid rgba(212,168,83,0.2)', borderRadius: 8, fontSize: 12 }}
          labelStyle={{ color: '#8a8578' }}
        />
        <ReferenceLine y={220} stroke="#22c55e" strokeDasharray="3 3" strokeOpacity={0.5} />
        <Line
          type="monotone"
          dataKey="weight"
          stroke="#d4a853"
          strokeWidth={2}
          dot={{ fill: '#d4a853', r: 3 }}
          activeDot={{ r: 5 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
