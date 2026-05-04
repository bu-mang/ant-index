// 시계열 차트 — 통합 개미지표 단일 라인 or 듀얼 바 차트
"use client";

import { UnifiedLineChart } from "@/components/charts/unified-line-chart";
import { DualBarChart } from "@/components/charts/dual-bar-chart";
import type { HistoryDataPoint } from "@/lib/api";

interface TimeSeriesChartProps {
  // 통합 모드 (단일 라인)
  data?: HistoryDataPoint[];
  // 레거시 듀얼 모드 (바 차트)
  sbData?: HistoryDataPoint[];
  gazuaData?: HistoryDataPoint[];
}

export function TimeSeriesChart({
  data,
  sbData,
  gazuaData,
}: TimeSeriesChartProps) {
  if (data) {
    return <UnifiedLineChart data={data} />;
  }

  return <DualBarChart sbData={sbData} gazuaData={gazuaData} />;
}
