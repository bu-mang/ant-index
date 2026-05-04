"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { DateTick } from "@/components/charts/date-tick";
import type { HistoryDataPoint } from "@/lib/api";

const dualConfig = {
  sb: {
    label: "돔황챠지수",
    color: "var(--sb)",
  },
  gazua: {
    label: "가즈아지수",
    color: "var(--gazua)",
  },
} satisfies ChartConfig;

interface DualBarChartProps {
  sbData?: HistoryDataPoint[];
  gazuaData?: HistoryDataPoint[];
}

export function DualBarChart({ sbData, gazuaData }: DualBarChartProps) {
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
  const lastDate = chartData[chartData.length - 1]?.date ?? "";

  const maxValue = Math.max(
    ...chartData.map((d) => Math.max(d.sb ?? 0, d.gazua ?? 0)),
  );
  const yMax = Math.min(100, Math.ceil(maxValue + 10));

  return (
    <div>
      <ChartContainer config={dualConfig} className="h-85 w-full">
        {chartData.length === 0 ? (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            데이터가 없습니다
          </div>
        ) : (
          <BarChart
            data={chartData}
            margin={{ top: 8, right: 8, bottom: 16, left: -16 }}
          >
            <CartesianGrid vertical={false} strokeDasharray="3 3" />
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={true}
              tickMargin={8}
              tick={(props) => <DateTick {...props} lastDate={lastDate} />}
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
          <div
            className="h-2 w-2 shrink-0 rounded-xs"
            style={{ backgroundColor: "var(--color-sb)" }}
          />
          돔황챠지수
        </div>
        <div className="flex items-center gap-1.5">
          <div
            className="h-2 w-2 shrink-0 rounded-xs"
            style={{ backgroundColor: "var(--color-gazua)" }}
          />
          가즈아지수
        </div>
      </div>
    </div>
  );
}
