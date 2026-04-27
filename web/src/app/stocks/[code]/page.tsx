// 종목 상세 페이지 — 개별 종목의 ㅅㅂ지수/가즈아지수 게이지 + 시계열 차트
"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { GaugeChart } from "@/components/gauge-chart";
import { TimeSeriesChart } from "@/components/time-series-chart";
import { PeriodSelector } from "@/components/period-selector";
import {
  useStocks,
  useSbIndex,
  useGazuaIndex,
  useSbHistory,
  useGazuaHistory,
  useSummary,
} from "@/lib/queries";

export default function StockDetailPage() {
  const params = useParams();
  const code = params.code as string;
  const [period, setPeriod] = useState("30d");

  const { data: sbIndex, isLoading: sbLoading } = useSbIndex(code);
  const { data: gazuaIndex, isLoading: gazuaLoading } = useGazuaIndex(code);
  const { data: sbHistory } = useSbHistory(code, period);
  const { data: gazuaHistory } = useGazuaHistory(code, period);
  const { data: summary } = useSummary(code);
  const { data: stocks } = useStocks();

  const stock = stocks?.find((s) => s.code === code);
  const isLoading = sbLoading || gazuaLoading;
  const stockName = sbIndex?.name ?? gazuaIndex?.name ?? code;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96 text-muted-foreground">
        로딩 중...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 뒤로가기 + 종목 정보 */}
      <div className="flex items-center gap-3">
        <Link
          href="/"
          className="text-muted-foreground hover:text-foreground transition text-sm"
        >
          ← 대시보드
        </Link>
      </div>

      <div className="flex items-center gap-3">
        <h1 className="text-2xl font-bold">{stockName}</h1>
        <Badge variant="secondary">{code}</Badge>
        {stock && stock.currentPrice != null && (
          <span className="text-lg font-semibold ml-auto">
            {stock.currentPrice.toLocaleString()}원
            <span
              className={`ml-2 text-sm ${
                (stock.changeRate ?? 0) > 0
                  ? "text-red-500"
                  : (stock.changeRate ?? 0) < 0
                    ? "text-blue-500"
                    : "text-muted-foreground"
              }`}
            >
              {(stock.changeRate ?? 0) > 0 ? "+" : ""}
              {stock.changeRate?.toFixed(2)}%
            </span>
          </span>
        )}
      </div>

      {/* AI 한줄평 */}
      {summary?.summary && (
        <Card>
          <CardContent className="py-4">
            <p className="text-sm text-muted-foreground text-center">
              {summary.summary}
            </p>
          </CardContent>
        </Card>
      )}

      {/* 게이지 섹션 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardContent className="pt-6 flex justify-center">
            <GaugeChart
              value={sbIndex?.value ?? 0}
              label={sbIndex?.label ?? "-"}
              title="ㅅㅂ지수"
              color="red"
              totalPosts={sbIndex?.totalPosts}
            />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6 flex justify-center">
            <GaugeChart
              value={gazuaIndex?.value ?? 0}
              label={gazuaIndex?.label ?? "-"}
              title="가즈아지수"
              color="green"
              totalPosts={gazuaIndex?.totalPosts}
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
    </div>
  );
}
