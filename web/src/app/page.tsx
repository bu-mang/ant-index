// 메인 대시보드 — 전체 종목의 ㅅㅂ지수/가즈아지수 게이지 + 시계열 차트 + 종목 테이블
"use client";

import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { GaugeChart } from "@/components/gauge-chart";
import { TimeSeriesChart } from "@/components/time-series-chart";
import { PeriodSelector } from "@/components/period-selector";
import { StockTable } from "@/components/stock-table";
import {
  useStocks,
  useSbHistory,
  useGazuaHistory,
  useMarketSummary,
} from "@/lib/queries";

// ㅅㅂ지수 레이블 (서버 index.service.ts와 동일)
const SB_LABELS = [
  { max: 20, label: "극도의 평온" },
  { max: 40, label: "평온" },
  { max: 60, label: "보통" },
  { max: 80, label: "불안" },
  { max: 100, label: "극도의 공포" },
];

// 가즈아지수 레이블
const GAZUA_LABELS = [
  { max: 20, label: "침체" },
  { max: 40, label: "조용" },
  { max: 60, label: "보통" },
  { max: 80, label: "흥분" },
  { max: 100, label: "극도의 환희" },
];

function getLabel(value: number, labels: typeof SB_LABELS): string {
  for (const { max, label } of labels) {
    if (value <= max) return label;
  }
  return labels[labels.length - 1].label;
}

// 시계열 차트용 대표 종목 (삼성전자)
const REPRESENTATIVE_CODE = "005930";

export default function DashboardPage() {
  const [period, setPeriod] = useState("7d");
  const { data: stocks, isLoading: stocksLoading } = useStocks();
  const { data: sbHistory } = useSbHistory(REPRESENTATIVE_CODE, period);
  const { data: gazuaHistory } = useGazuaHistory(REPRESENTATIVE_CODE, period);
  const { data: marketSummary } = useMarketSummary();

  // 30종목 평균 계산
  const avgSb = useMemo(() => {
    if (!stocks?.length) return { value: 0, label: "-", totalPosts: 0 };

    const withData = stocks.filter((s) => s.sbIndex != null);
    if (!withData.length) return { value: 0, label: "-", totalPosts: 0 };

    const avg =
      withData.reduce((sum, s) => sum + s.sbIndex!, 0) / withData.length;
    const rounded = Math.round(avg * 100) / 100;
    const totalPosts = stocks.reduce((sum, s) => sum + (s.totalPosts ?? 0), 0);

    return { value: rounded, label: getLabel(rounded, SB_LABELS), totalPosts };
  }, [stocks]);

  const avgGazua = useMemo(() => {
    if (!stocks?.length) return { value: 0, label: "-", totalPosts: 0 };

    const withData = stocks.filter((s) => s.gazuaIndex != null);
    if (!withData.length) return { value: 0, label: "-", totalPosts: 0 };

    const avg =
      withData.reduce((sum, s) => sum + s.gazuaIndex!, 0) / withData.length;
    const rounded = Math.round(avg * 100) / 100;
    const totalPosts = stocks.reduce((sum, s) => sum + (s.totalPosts ?? 0), 0);
    return {
      value: rounded,
      label: getLabel(rounded, GAZUA_LABELS),
      totalPosts,
    };
  }, [stocks]);

  if (stocksLoading) {
    return (
      <div className="flex items-center justify-center h-96 text-muted-foreground">
        로딩 중...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 전체 시장 한줄평 */}
      {marketSummary?.summary && (
        <Card>
          <CardContent className="py-4">
            <p className="text-sm text-muted-foreground text-center">
              {marketSummary.summary}
            </p>
          </CardContent>
        </Card>
      )}

      {/* 게이지 섹션 — 30종목 평균 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardContent className="pt-6 flex justify-center">
            <GaugeChart
              value={avgSb.value}
              label={avgSb.label}
              title="국내주식 ㅅㅂ지수"
              color="red"
              totalPosts={avgSb.totalPosts}
            />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6 flex justify-center">
            <GaugeChart
              value={avgGazua.value}
              label={avgGazua.label}
              title="국내주식 가즈아지수"
              color="green"
              totalPosts={avgGazua.totalPosts}
            />
          </CardContent>
        </Card>
      </div>

      {/* 시계열 차트 */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">지표 추이</CardTitle>
          <PeriodSelector value={period} onChange={setPeriod} />
        </CardHeader>
        <CardContent>
          <TimeSeriesChart
            sbData={sbHistory?.data}
            gazuaData={gazuaHistory?.data}
          />
        </CardContent>
      </Card>

      {/* 종목 테이블 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">종목별 지표</CardTitle>
        </CardHeader>
        <CardContent>
          <StockTable stocks={stocks ?? []} />
        </CardContent>
      </Card>
    </div>
  );
}
