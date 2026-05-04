// 종목 상세 페이지 — 개별 종목의 통합 개미지표 게이지 + 시계열 차트
"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { GaugeChart } from "@/components/charts/gauge-chart";
import { TimeSeriesChart } from "@/components/charts/time-series-chart";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { TrendingUp, TrendingDown, Minus, Flame } from "lucide-react";
import {
  useStocks,
  useAntIndex,
  useAntIndexHistory,
  useSummary,
  useStats,
  usePriceDetail,
  useHotComments,
} from "@/lib/queries";

export default function StockDetailPage() {
  const params = useParams();
  const code = params.code as string;

  const { data: antIndex, isLoading } = useAntIndex(code);
  const { data: antHistory7d } = useAntIndexHistory(code, "7d");
  const { data: antHistory30d } = useAntIndexHistory(code, "30d");
  const { data: antHistory90d } = useAntIndexHistory(code, "90d");
  const { data: summary } = useSummary(code);
  const { data: stats } = useStats(code);
  const { data: priceDetail } = usePriceDetail(code);
  const { data: hotComments } = useHotComments(code);
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
    <main className="pt-14 lg:mr-108 min-h-screen">
      <div className="max-w-432 mx-auto px-12 py-6 space-y-6">
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

        {/* 기본정보 카드 */}
        {priceDetail && (
          <div className="grid grid-cols-4 gap-3">
            {priceDetail.volume != null && (
              <Card>
                <CardContent className="pt-4 pb-3 px-4">
                  <p className="text-xs text-muted-foreground mb-1">거래량</p>
                  <p className="text-base font-bold">
                    {priceDetail.volume >= 1_000_000
                      ? `${(priceDetail.volume / 1_000_000).toFixed(1)}M`
                      : priceDetail.volume >= 1_000
                        ? `${(priceDetail.volume / 1_000).toFixed(0)}K`
                        : priceDetail.volume.toLocaleString()}
                  </p>
                </CardContent>
              </Card>
            )}
            {priceDetail.marketCap != null && (
              <Card>
                <CardContent className="pt-4 pb-3 px-4">
                  <p className="text-xs text-muted-foreground mb-1">시가총액</p>
                  <p className="text-base font-bold">
                    {priceDetail.marketCap >= 10000
                      ? `${(priceDetail.marketCap / 10000).toFixed(0)}조`
                      : `${priceDetail.marketCap.toLocaleString()}억`}
                  </p>
                </CardContent>
              </Card>
            )}
            {priceDetail.per != null && (
              <Card>
                <CardContent className="pt-4 pb-3 px-4">
                  <p className="text-xs text-muted-foreground mb-1">PER</p>
                  <p className="text-base font-bold">{priceDetail.per.toFixed(2)}배</p>
                </CardContent>
              </Card>
            )}
            {priceDetail.pbr != null && (
              <Card>
                <CardContent className="pt-4 pb-3 px-4">
                  <p className="text-xs text-muted-foreground mb-1">PBR</p>
                  <p className="text-base font-bold">{priceDetail.pbr.toFixed(2)}배</p>
                </CardContent>
              </Card>
            )}
            {priceDetail.dividendYield != null && (
              <Card>
                <CardContent className="pt-4 pb-3 px-4">
                  <p className="text-xs text-muted-foreground mb-1">배당수익률</p>
                  <p className="text-base font-bold">{priceDetail.dividendYield.toFixed(2)}%</p>
                </CardContent>
              </Card>
            )}
            {priceDetail.high52w != null && priceDetail.low52w != null && (
              <Card>
                <CardContent className="pt-4 pb-3 px-4">
                  <p className="text-xs text-muted-foreground mb-1">52주 고/저</p>
                  <p className="text-base font-bold">
                    <span className="text-[#fa342c]">{priceDetail.high52w.toLocaleString()}</span>
                    <span className="text-muted-foreground mx-0.5">/</span>
                    <span className="text-[#217cf9]">{priceDetail.low52w.toLocaleString()}</span>
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        )}

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

        {/* 핫댓글 */}
        {hotComments && hotComments.comments.length > 0 && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-1.5">
                <Flame className="size-4 text-orange-500" />
                핫댓글
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {hotComments.comments.map((c, i) => (
                <div
                  key={i}
                  className="flex items-start justify-between gap-3 py-2 border-b border-border last:border-0"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <Badge
                      variant="outline"
                      className={
                        c.sentimentLabel === "BULL"
                          ? "text-gazua border-gazua shrink-0"
                          : c.sentimentLabel === "BEAR"
                            ? "text-sb border-sb shrink-0"
                            : "text-muted-foreground shrink-0"
                      }
                    >
                      {c.sentimentLabel === "BULL"
                        ? "상승"
                        : c.sentimentLabel === "BEAR"
                          ? "하락"
                          : "중립"}
                    </Badge>
                    <p className="text-sm truncate font-mono">
                      {c.maskedContent}
                    </p>
                  </div>
                  <span className="text-xs text-muted-foreground whitespace-nowrap shrink-0">
                    ❤️ {c.likeBucket}
                  </span>
                </div>
              ))}
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

        {/* 통계 카드 */}
        {stats && (
          <div className="grid grid-cols-4 gap-3">
            <Card>
              <CardContent className="pt-4 pb-3 px-4">
                <p className="text-xs text-muted-foreground mb-1">총 글 수</p>
                <p className="text-xl font-bold">{stats.totalPosts.toLocaleString()}</p>
                {stats.postChangeRate != null && (
                  <div className="flex items-center gap-1 mt-1">
                    {stats.postChangeRate > 0 ? (
                      <TrendingUp className="size-3 text-[#fa342c]" />
                    ) : stats.postChangeRate < 0 ? (
                      <TrendingDown className="size-3 text-[#217cf9]" />
                    ) : (
                      <Minus className="size-3 text-muted-foreground" />
                    )}
                    <span
                      className={`text-xs font-medium ${
                        stats.postChangeRate > 0
                          ? "text-[#fa342c]"
                          : stats.postChangeRate < 0
                            ? "text-[#217cf9]"
                            : "text-muted-foreground"
                      }`}
                    >
                      {stats.postChangeRate > 0 ? "+" : ""}
                      {stats.postChangeRate}%
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4 pb-3 px-4">
                <p className="text-xs text-muted-foreground mb-1">상승론자</p>
                <p className="text-xl font-bold text-gazua">{stats.bullPercent}%</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4 pb-3 px-4">
                <p className="text-xs text-muted-foreground mb-1">하락론자</p>
                <p className="text-xl font-bold text-sb">{stats.bearPercent}%</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4 pb-3 px-4">
                <p className="text-xs text-muted-foreground mb-1">중립</p>
                <p className="text-xl font-bold text-muted-foreground">{stats.neutralPercent}%</p>
              </CardContent>
            </Card>
          </div>
        )}

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
    </main>
  );
}
