// 메인 대시보드 — 전체 종목의 ㅅㅂ지수/가즈아지수 게이지 + 시계열 차트 + 종목 테이블
"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { GaugeChart } from "@/components/charts/gauge-chart";
import { AntHero } from "@/components/brand/ant-hero";
import { TimeSeriesChart } from "@/components/charts/time-series-chart";
import { PeriodSelector } from "@/components/charts/period-selector";
import { StockTable } from "@/components/stock-table";
import { ThemeToggle } from "@/components/theme-toggle";
import {
  useStocks,
  useSbHistory,
  useGazuaHistory,
  useMarketSummary,
} from "@/lib/queries";
import { SB_LABELS, GAZUA_LABELS, getLabel } from "@/lib/constants";

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
    <>
      {/* 헤더 — fixed, 사이드바 영역 제외 */}
      <header className="fixed top-0 left-0 lg:right-120 right-0 h-14 border-b border-border bg-background z-10">
        <nav className="max-w-432 mx-auto px-4 h-full flex items-center justify-between">
          <Link href="/" className="text-lg font-bold tracking-tight">
            개미지표
          </Link>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <Link href="/" className="hover:text-foreground transition">
              대시보드
            </Link>
            <ThemeToggle />
          </div>
        </nav>
      </header>

      {/* 본문 — 헤더 아래, 사이드바 왼쪽 */}
      <main className="pt-14 lg:mr-120">
        <div className="max-w-432 mx-auto px-12 py-6 space-y-6">
          {/* 메인 배너 — 한줄평 + 게이지 + 개미 이미지 */}
          <section className="py-8 flex gap-8">
            {/* 좌측: 한줄평 + 게이지 */}
            <div className="flex-1 min-w-0 space-y-12 ">
              {marketSummary?.summary && (
                <div className="flex flex-col gap-3">
                  <Badge variant="default">증시요약</Badge>
                  <p className="text-4xl font-extrabold max-w-150 leading-snug break-keep">
                    {marketSummary.summary}
                  </p>
                </div>
              )}

              <div className="flex gap-12">
                <GaugeChart
                  value={avgSb.value}
                  label={avgSb.label}
                  title="국내주식 ㅅㅂ지수"
                  color="red"
                  totalPosts={avgSb.totalPosts}
                />
                <GaugeChart
                  value={avgGazua.value}
                  label={avgGazua.label}
                  title="국내주식 가즈아지수"
                  color="green"
                  totalPosts={avgGazua.totalPosts}
                />
              </div>
            </div>

            {/* 우측: 개미 이미지 */}
            <div className="hidden md:flex items-center justify-center w-80 shrink-0">
              <AntHero sb={avgSb.value} gazua={avgGazua.value} />
            </div>
          </section>

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
      </main>

      {/* 우측 사이드바: 종목별 지표 — fixed, 전체 높이 */}
      <aside className="hidden lg:flex flex-col w-120 fixed right-0 top-0 bottom-0 border-l border-border bg-background overflow-y-auto">
        <div className="px-4 py-4 border-b border-border">
          <h2 className="text-base font-semibold">종목별 지표</h2>
        </div>
        <div className="px-4 py-4 overflow-y-auto">
          <StockTable stocks={stocks ?? []} />
        </div>
      </aside>
    </>
  );
}
