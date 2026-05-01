// 시계열 차트 — 바 차트 + 라인 차트 동시 렌더
"use client";

import { BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import type { HistoryDataPoint } from "@/lib/api";

interface TimeSeriesChartProps {
  sbData?: HistoryDataPoint[];
  gazuaData?: HistoryDataPoint[];
}

const chartConfig = {
  sb: {
    label: "ㅅㅂ지수",
    color: "var(--sb)",
  },
  gazua: {
    label: "가즈아지수",
    color: "var(--gazua)",
  },
} satisfies ChartConfig;

export function TimeSeriesChart({ sbData, gazuaData }: TimeSeriesChartProps) {
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

  const maxValue = Math.max(
    ...chartData.map((d) => Math.max(d.sb ?? 0, d.gazua ?? 0)),
  );
  const yMax = Math.min(100, Math.ceil(maxValue + 10));

  return (
    <div>
      <ChartContainer config={chartConfig} className="h-75 w-full">
        {chartData.length === 0 ? (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            데이터가 없습니다
          </div>
        ) : (
          <BarChart
            data={chartData}
            margin={{ top: 8, right: 8, bottom: 0, left: -16 }}
          >
            <CartesianGrid vertical={false} strokeDasharray="3 3" />
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={true}
              fontSize={12}
              tickMargin={8}
              tickFormatter={(v) => v?.slice(5)}
            />
            <YAxis
              tickLine={false}
              axisLine={true}
              fontSize={12}
              tickMargin={8}
              domain={[0, yMax]}
            />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Bar
              dataKey="sb"
              fill="var(--color-sb)"
              radius={[4, 4, 0, 0]}
              opacity={1}
            />
            <Bar
              dataKey="gazua"
              fill="var(--color-gazua)"
              radius={[4, 4, 0, 0]}
              opacity={1}
            />
          </BarChart>
        )}
      </ChartContainer>
      <div className="flex items-center justify-center gap-4 pt-3 text-xs">
        <div className="flex items-center gap-1.5">
          <div className="h-2 w-2 shrink-0 rounded-[2px]" style={{ backgroundColor: "var(--color-sb)" }} />
          ㅅㅂ지수
        </div>
        <div className="flex items-center gap-1.5">
          <div className="h-2 w-2 shrink-0 rounded-[2px]" style={{ backgroundColor: "var(--color-gazua)" }} />
          가즈아지수
        </div>
      </div>
    </div>
  );
}
