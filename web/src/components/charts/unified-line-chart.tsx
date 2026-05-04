"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  ReferenceLine,
} from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { DateTick } from "@/components/charts/date-tick";
import type { HistoryDataPoint } from "@/lib/api";
import { ANT_INDEX_LABELS, getLabel } from "@/lib/constants";

const unifiedConfig = {
  value: {
    label: "개미지표",
    color: "var(--foreground)",
  },
} satisfies ChartConfig;

interface UnifiedLineChartProps {
  data: HistoryDataPoint[];
}

export function UnifiedLineChart({ data }: UnifiedLineChartProps) {
  const chartData = [...data].sort((a, b) => a.date.localeCompare(b.date));
  const lastDate = chartData[chartData.length - 1]?.date ?? "";
  const maxValue = Math.max(...chartData.map((d) => d.value), 0);
  const yMax = Math.min(100, Math.ceil(maxValue + 10));

  return (
    <ChartContainer config={unifiedConfig} className="h-85 w-full">
      {chartData.length === 0 ? (
        <div className="flex items-center justify-center h-full text-muted-foreground">
          데이터가 없습니다
        </div>
      ) : (
        <LineChart
          data={chartData}
          margin={{ top: 24, right: 30, bottom: 16, left: -16 }}
        >
          <defs>
            <linearGradient id="lineGradient" x1="0" y1="0" x2="1" y2="0">
              {chartData.map((d, i) => (
                <stop
                  key={i}
                  offset={`${(i / Math.max(chartData.length - 1, 1)) * 100}%`}
                  stopColor={`color-mix(in srgb, var(--sb) ${100 - d.value}%, var(--gazua))`}
                />
              ))}
            </linearGradient>
          </defs>
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
          <ReferenceLine
            y={50}
            stroke="var(--muted-foreground)"
            strokeDasharray="4 4"
            strokeOpacity={0.4}
          />
          <ChartTooltip
            content={
              <ChartTooltipContent
                formatter={(val) => {
                  const v = typeof val === "number" ? val : Number(val);
                  const lbl = getLabel(v, ANT_INDEX_LABELS);
                  return (
                    <span className="font-mono font-medium tabular-nums">
                      {v.toLocaleString()} ({lbl})
                    </span>
                  );
                }}
              />
            }
          />
          <Line
            type="linear"
            dataKey="value"
            stroke="url(#lineGradient)"
            strokeWidth={2}
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            activeDot={(props: any) => {
              const cx = props.cx as number;
              const cy = props.cy as number;
              const val = (props.payload?.value as number) ?? 50;
              const activeColor = `color-mix(in srgb, var(--sb) ${100 - val}%, var(--gazua))`;
              return (
                <g>
                  <circle
                    cx={cx}
                    cy={cy}
                    r={8}
                    fill={activeColor}
                    opacity={0.15}
                  >
                    <animate
                      attributeName="r"
                      from="4"
                      to="14"
                      dur="1.2s"
                      repeatCount="indefinite"
                    />
                    <animate
                      attributeName="opacity"
                      from="0.3"
                      to="0"
                      dur="1.2s"
                      repeatCount="indefinite"
                    />
                  </circle>
                  <circle
                    cx={cx}
                    cy={cy}
                    r={4.5}
                    fill={activeColor}
                    strokeWidth={0}
                  />
                </g>
              );
            }}
            dot={(props: Record<string, unknown>) => {
              const { cx, cy, index, payload } = props as {
                cx: number;
                cy: number;
                index: number;
                payload: { value: number };
              };
              const isLast = index === chartData.length - 1;
              const r = isLast ? 5 : 3;
              const fontSize = isLast ? 15 : 10;
              const lbl = getLabel(payload.value, ANT_INDEX_LABELS);
              const dotColor = `color-mix(in srgb, var(--sb) ${100 - payload.value}%, var(--gazua))`;
              return (
                <g key={index}>
                  <circle
                    cx={cx}
                    cy={cy}
                    r={r}
                    fill={dotColor}
                    strokeWidth={0}
                  />
                  <text
                    x={cx}
                    y={cy - (isLast ? 14 : 10)}
                    textAnchor="middle"
                    fontSize={fontSize}
                    fontFamily='"Mbc1961", sans-serif'
                    fill={dotColor}
                  >
                    {lbl}
                  </text>
                </g>
              );
            }}
          />
        </LineChart>
      )}
    </ChartContainer>
  );
}
