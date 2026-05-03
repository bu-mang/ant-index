// 메인 대시보드 — 통합 개미지표 게이지 + 시계열 차트 + 종목 테이블
"use client";

import { useMemo } from "react";
import { Header } from "@/components/layout/header";
import { MainContent } from "@/components/layout/main-content";
import { Sidebar } from "@/components/layout/sidebar";
import { Footer } from "@/components/layout/footer";
import { useStocks, useMarketSummary } from "@/lib/queries";
import { ANT_INDEX_LABELS, getLabel } from "@/lib/constants";

export default function DashboardPage() {
  const { data: stocks, isLoading: stocksLoading } = useStocks();
  const { data: marketSummary } = useMarketSummary();

  // 30종목 평균 개미지표
  const avgAntIndex = useMemo(() => {
    if (!stocks?.length) return { value: 50, label: "-", totalPosts: 0 };

    const withData = stocks.filter((s) => s.antIndex != null);
    if (!withData.length) return { value: 50, label: "-", totalPosts: 0 };

    const avg =
      withData.reduce((sum, s) => sum + s.antIndex!, 0) / withData.length;
    const rounded = Math.round(avg * 100) / 100;
    const totalPosts = stocks.reduce((sum, s) => sum + (s.totalPosts ?? 0), 0);

    return {
      value: rounded,
      label: getLabel(rounded, ANT_INDEX_LABELS),
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
      <Header />
      <MainContent
        avgAntIndex={avgAntIndex}
        marketSummary={marketSummary?.summary ?? undefined}
      />
      <Footer />
      <Sidebar stocks={stocks ?? []} />
    </>
  );
}
