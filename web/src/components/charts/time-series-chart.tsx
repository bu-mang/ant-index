// 시계열 차트 — 통합 개미지표 단일 라인 or 듀얼 바 차트
"use client";

import {
  LineChart,
  Line,
  BarChart,
  Bar,
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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { HistoryDataPoint } from "@/lib/api";
import { ANT_INDEX_LABELS, getLabel } from "@/lib/constants";

const DAY_NAMES = ["일", "월", "화", "수", "목", "금", "토"];

/** "2026-05-05" → "05.05(월)" */
function formatDateWithDay(dateStr: string): string {
  const [, m, d] = dateStr.split("-");
  const day = DAY_NAMES[new Date(dateStr + "T00:00:00+09:00").getDay()];
  return `${m}.${d}(${day})`;
}

function DateTick(props: Record<string, unknown> & { lastDate: string }) {
  const { x, y, payload, lastDate } = props as {
    x: number;
    y: number;
    payload: { value: string };
    lastDate: string;
  };
  const isToday = payload.value === lastDate;

  if (!isToday) {
    return (
      <g transform={`translate(${x},${y})`}>
        <text
          dy={8}
          textAnchor="middle"
          fontSize={12}
          fill="currentColor"
          className="text-muted-foreground"
        >
          {formatDateWithDay(payload.value)}
        </text>
      </g>
    );
  }

  return (
    <g transform={`translate(${x},${y})`}>
      {/* <animateTransform
        attributeName="transform"
        type="translate"
        values={`${x} ${y}; ${x} ${y - 2}; ${x} ${y}`}
        dur="1.8s"
        repeatCount="indefinite"
      /> */}
      <text dy={8} textAnchor="middle" fontSize={12} fill="var(--accent)">
        {formatDateWithDay(payload.value)}
      </text>
      <foreignObject x={-40} y={10} width={80} height={22} overflow="visible">
        <TooltipProvider delay={200}>
          <Tooltip>
            <TooltipTrigger>
              <text
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 2,
                  width: 80,
                  cursor: "help",
                  fontSize: 11,
                  fontWeight: 600,
                  color: "var(--accent)",
                }}
              >
                오늘
                <svg
                  width="10"
                  height="10"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="var(--accent)"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="12" cy="12" r="10" />
                  <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
                  <line x1="12" y1="17" x2="12.01" y2="17" />
                </svg>
              </text>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="max-w-56 text-xs">
              타임라인에서의 &apos;오늘&apos;은 00:00AM부터 수집된 값으로, 아직
              데이터가 부족한 새벽시간대에는 부정확할 수 있습니다.
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </foreignObject>
    </g>
  );
}

interface TimeSeriesChartProps {
  // 통합 모드 (단일 라인)
  data?: HistoryDataPoint[];
  // 레거시 듀얼 모드 (바 차트)
  sbData?: HistoryDataPoint[];
  gazuaData?: HistoryDataPoint[];
}

const unifiedConfig = {
  value: {
    label: "개미지표",
    color: "var(--foreground)",
  },
} satisfies ChartConfig;

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

export function TimeSeriesChart({
  data,
  sbData,
  gazuaData,
}: TimeSeriesChartProps) {
  // 통합 모드
  if (data) {
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

  // 레거시 듀얼 모드
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
