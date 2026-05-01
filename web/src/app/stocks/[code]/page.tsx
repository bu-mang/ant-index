// 종목 상세 페이지 — 개별 종목의 통합 개미지표 게이지 + 시계열 차트
"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { GaugeChart } from "@/components/charts/gauge-chart";
import { TimeSeriesChart } from "@/components/charts/time-series-chart";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  useStocks,
  useAntIndex,
  useAntIndexHistory,
  useSummary,
} from "@/lib/queries";

export default function StockDetailPage() {
  const params = useParams();
  const code = params.code as string;

  const { data: antIndex, isLoading } = useAntIndex(code);
  const { data: antHistory7d } = useAntIndexHistory(code, "7d");
  const { data: antHistory30d } = useAntIndexHistory(code, "30d");
  const { data: antHistory90d } = useAntIndexHistory(code, "90d");
  const { data: summary } = useSummary(code);
  const { data: stocks } = useStocks();

  const stock = stocks?.find((s) => s.code === code);
  const stockName = antIndex?.name ?? code;

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
                  ? "text-[#fa342c]"
                  : (stock.changeRate ?? 0) < 0
                    ? "text-[#217cf9]"
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

      {/* 게이지 섹션 — 통합 개미지표 */}
      <Card>
        <CardContent className="pt-6 flex justify-center">
          <div className="max-w-80 w-full">
            <GaugeChart
              value={antIndex?.value ?? 50}
              label={antIndex?.label ?? "-"}
              title="개미지표"
              color="gradient"
              totalPosts={antIndex?.totalPosts}
            />
          </div>
        </CardContent>
      </Card>

      {/* 시계열 차트 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">지표 추이</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="30d">
            <div className="flex items-center justify-end mb-4">
              <TabsList>
                <TabsTrigger value="7d">7일</TabsTrigger>
                <TabsTrigger value="30d">30일</TabsTrigger>
                <TabsTrigger value="90d">90일</TabsTrigger>
              </TabsList>
            </div>
            <TabsContent value="7d">
              <TimeSeriesChart data={antHistory7d?.data} />
            </TabsContent>
            <TabsContent value="30d">
              <TimeSeriesChart data={antHistory30d?.data} />
            </TabsContent>
            <TabsContent value="90d">
              <TimeSeriesChart data={antHistory90d?.data} />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
