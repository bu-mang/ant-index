// 시계열 차트 — Recharts 라인 차트로 ㅅㅂ지수/가즈아지수 추이를 보여줌
'use client';

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import type { HistoryDataPoint } from '@/lib/api';

interface TimeSeriesChartProps {
  sbData?: HistoryDataPoint[];
  gazuaData?: HistoryDataPoint[];
}

export function TimeSeriesChart({ sbData, gazuaData }: TimeSeriesChartProps) {
  // 두 데이터셋을 날짜 기준으로 병합
  const dateMap = new Map<
    string,
    { date: string; sb?: number; gazua?: number }
  >();

  sbData?.forEach((d) => {
    dateMap.set(d.date, { ...dateMap.get(d.date), date: d.date, sb: d.value });
  });
  gazuaData?.forEach((d) => {
    dateMap.set(d.date, {
      ...dateMap.get(d.date),
      date: d.date,
      gazua: d.value,
    });
  });

  const chartData = Array.from(dateMap.values()).sort((a, b) =>
    a.date.localeCompare(b.date),
  );

  if (chartData.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground">
        데이터가 없습니다
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={chartData}>
        <CartesianGrid strokeDasharray="3 3" stroke="#333" />
        <XAxis
          dataKey="date"
          stroke="#888"
          fontSize={12}
          tickFormatter={(v) => v.slice(5)} // "2026-04-27" → "04-27"
        />
        <YAxis stroke="#888" fontSize={12} domain={[0, 100]} />
        <Tooltip
          contentStyle={{
            backgroundColor: '#1a1a1a',
            border: '1px solid #333',
            borderRadius: '8px',
          }}
          labelStyle={{ color: '#888' }}
        />
        <Legend />
        <Line
          type="monotone"
          dataKey="sb"
          name="ㅅㅂ지수"
          stroke="#ef4444"
          strokeWidth={2}
          dot={false}
        />
        <Line
          type="monotone"
          dataKey="gazua"
          name="가즈아지수"
          stroke="#22c55e"
          strokeWidth={2}
          dot={false}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
