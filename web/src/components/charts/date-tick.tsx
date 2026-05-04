"use client";

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { formatDateShort } from "@/lib/utils";

export function DateTick(
  props: Record<string, unknown> & { lastDate: string },
) {
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
          {formatDateShort(payload.value)}
        </text>
      </g>
    );
  }

  return (
    <g transform={`translate(${x},${y})`}>
      <text dy={8} textAnchor="middle" fontSize={12} fill="var(--accent)">
        {formatDateShort(payload.value)}
      </text>
      <foreignObject x={-40} y={10} width={80} height={22} overflow="visible">
        <TooltipProvider delay={200}>
          <Tooltip>
            <TooltipTrigger>
              <span
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
              </span>
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
