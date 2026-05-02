"use client";

import { Badge } from "@/components/ui/badge";
import { GaugeChart } from "@/components/charts/gauge-chart";
import { TimeSeriesChart } from "@/components/charts/time-series-chart";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Construction } from "lucide-react";
import { TaegukIcon } from "@/components/icons/taeguk";
// import { USFlagIcon } from "@/components/icons/us-flag";
import { useMarketAntIndexHistory } from "@/lib/queries";
import { ANT_INDEX_LABELS, getLabel } from "@/lib/constants";
import { useMemo } from "react";

interface MainContentProps {
  avgAntIndex: { value: number; label: string; totalPosts: number };
  marketSummary?: string;
}

/** 날짜 문자열(YYYY-MM-DD)로 N일 전 날짜를 반환 */
function daysAgoStr(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toLocaleDateString("sv-SE", { timeZone: "Asia/Seoul" });
}

export function MainContent({ avgAntIndex, marketSummary }: MainContentProps) {
  const { data: antHistory7d } = useMarketAntIndexHistory("7d");
  const { data: antHistory30d } = useMarketAntIndexHistory("30d");
  const { data: antHistory90d } = useMarketAntIndexHistory("90d");

  const pastSnapshots = useMemo(() => {
    const allData = antHistory90d?.data ?? antHistory30d?.data ?? [];
    if (!allData.length) return [];

    const entries = [
      { label: "어제", days: 1 },
      { label: "일주일 전", days: 7 },
      { label: "한 달 전", days: 30 },
      { label: "세 달 전", days: 90 },
    ];

    return entries.map((e) => {
      const targetDate = daysAgoStr(e.days);
      // 정확한 날짜 먼저, 없으면 가장 가까운 과거 날짜
      let point = allData.find((d) => d.date === targetDate);
      if (!point) {
        const past = allData
          .filter((d) => d.date <= targetDate)
          .sort((a, b) => b.date.localeCompare(a.date));
        point = past[0] ?? allData[0];
      }
      return {
        label: e.label,
        value: point.value,
        indexLabel: getLabel(point.value, ANT_INDEX_LABELS),
      };
    });
  }, [antHistory30d, antHistory90d]);

  return (
    <main className="pt-14 lg:mr-108 min-h-screen">
      <div className="max-w-432 mx-auto px-12 py-6 space-y-6">
        {/* 한줄평 — 탭과 무관하게 항상 표시 */}
        {marketSummary && (
          <section className="py-16 pb-8">
            <div className="flex flex-col items-start gap-3">
              <Badge variant="default">증시요약</Badge>
              <p
                className="text-5xl text-left font-normal max-w-150 leading-snug break-keep"
                style={{
                  fontFamily: '"Mbc1961", sans-serif',
                }}
              >
                {marketSummary}
              </p>
            </div>
          </section>
        )}

        {/* 디바이더 */}
        <div
          className="h-px w-full max-w-150 opacity-30"
          style={{
            background:
              "linear-gradient(to right, var(--foreground) 0%, transparent 100%)",
          }}
        />

        {/* 탭 — 차트만 전환 */}
        <Tabs defaultValue="overview">
          <div className="flex items-center justify-start gap-4">
            {/* 시장 선택 칩 */}
            <Tabs defaultValue="kr">
              <TabsList>
                <TabsTrigger value="kr">
                  <TaegukIcon className="size-3" /> 국장
                </TabsTrigger>
                <TooltipProvider delay={200}>
                  <Tooltip>
                    <TooltipTrigger className="inline-flex items-center gap-0.5 px-1.5 py-0.5 text-sm font-medium text-muted-foreground/40 cursor-not-allowed">
                      {/* <USFlagIcon className="size-3" />  */}
                      미장 <Construction className="size-3" />
                    </TooltipTrigger>
                    <TooltipContent>준비중</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </TabsList>
            </Tabs>

            {/* 차트 탭 */}
            <TabsList>
              <TabsTrigger value="overview">현재상황</TabsTrigger>
              <TabsTrigger value="timeline">타임라인</TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="overview">
            <section className="pt-4 pb-8">
              <div className="flex gap-8">
                <div className="w-200 shrink-0">
                  <GaugeChart
                    value={avgAntIndex.value}
                    label={avgAntIndex.label}
                    color="gradient"
                    totalPosts={avgAntIndex.totalPosts}
                  />
                </div>

                {pastSnapshots.length > 0 && (
                  <div className="flex-1 flex flex-col justify-between py-8">
                    {pastSnapshots.map((snap) => {
                      const color = `color-mix(in srgb, var(--sb) ${100 - snap.value}%, var(--gazua))`;
                      return (
                        <div
                          key={snap.label}
                          className="flex items-center gap-3"
                        >
                          <div className="shrink-0">
                            <p className="text-xs text-muted-foreground">
                              {snap.label}
                            </p>
                            <p className="text-sm font-bold">
                              {snap.indexLabel}
                            </p>
                          </div>
                          <div className="flex-1 border-b border-dashed border-muted-foreground/30" />
                          <div
                            className="shrink-0 flex items-center justify-center size-10 rounded-full border-2 text-sm font-bold"
                            style={{
                              borderColor: color,
                              color,
                            }}
                          >
                            {Math.round(snap.value)}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </section>
          </TabsContent>

          <TabsContent value="timeline">
            <section className="py-6">
              <Tabs defaultValue="7d">
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
            </section>
          </TabsContent>
        </Tabs>
      </div>
    </main>
  );
}
