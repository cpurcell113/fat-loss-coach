import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import type { BodyCompEntry } from '../../types';
import { formatShort } from '../../utils/date-helpers';

export function ProjectionChart({
  entries,
  projectedWeight,
}: {
  entries: BodyCompEntry[];
  projectedWeight: number | null;
}) {
  const data = entries.map(e => ({
    date: formatShort(e.date),
    actual: e.weight,
    target: null as number | null,
  }));

  // Add projection point
  if (projectedWeight) {
    data.push({
      date: 'May 9',
      actual: null as unknown as number,
      target: projectedWeight,
    });
  }

  return (
    <ResponsiveContainer width="100%" height={200}>
      <LineChart data={data} margin={{ top: 5, right: 5, bottom: 0, left: -15 }}>
        <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#8a8578' }} />
        <YAxis
          domain={[215, 255]}
          tick={{ fontSize: 10, fill: '#8a8578' }}
        />
        <Tooltip
          contentStyle={{ backgroundColor: '#141414', border: '1px solid rgba(212,168,83,0.2)', borderRadius: 8, fontSize: 12 }}
        />
        <ReferenceLine y={220} stroke="#22c55e" strokeDasharray="3 3" strokeOpacity={0.5} />
        <Line type="monotone" dataKey="actual" stroke="#d4a853" strokeWidth={2} dot={{ fill: '#d4a853', r: 3 }} connectNulls={false} />
        <Line type="monotone" dataKey="target" stroke="#f59e0b" strokeWidth={1} strokeDasharray="5 5" dot={{ fill: '#f59e0b', r: 3 }} connectNulls />
      </LineChart>
    </ResponsiveContainer>
  );
}
