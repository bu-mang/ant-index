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
import { Camera, Construction, HelpCircle } from "lucide-react";
import { TaegukIcon } from "@/components/icons/taeguk";
// import { USFlagIcon } from "@/components/icons/us-flag";
import { useMarketAntIndexHistory } from "@/lib/queries";
import { ANT_INDEX_LABELS, getLabel } from "@/lib/constants";
import { WalkingAnt } from "@/components/walking-ant";
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
      { label: "최근 일주일 간", days: 7 },
      { label: "최근 한 달 간", days: 30 },
      { label: "최근 세 달 간", days: 90 },
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

  const now = new Date();
  const datePart = now
    .toLocaleDateString("ko-KR", {
      timeZone: "Asia/Seoul",
      year: "2-digit",
      month: "2-digit",
      day: "2-digit",
    })
    .replace(/\. /g, ".")
    .replace(/\.$/, "");
  const dayOfWeek = now.toLocaleDateString("ko-KR", {
    timeZone: "Asia/Seoul",
    weekday: "short",
  });
  const date = `${datePart} (${dayOfWeek})`;

  return (
    <main className="pt-14 lg:mr-108 min-h-screen">
      <div className="max-w-432 mx-auto px-12 py-6 space-y-6">
        {/* 한줄평 — 탭과 무관하게 항상 표시 */}
        {marketSummary && (
          <section className="py-16 pb-8">
            <div className="flex flex-col items-start gap-1.5">
              <Badge variant="default">{date} 개미 민심 현황</Badge>
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

        {/* 개미 + 디바이더 */}
        <div>
          <WalkingAnt value={avgAntIndex.value} />
          <div
            className="h-px w-full opacity-30"
            style={{
              background:
                "linear-gradient(to right, transparent 0%, var(--foreground) 5%, var(--foreground) 95%, transparent 100%)",
            }}
          />
        </div>

        {/* 탭 — 차트만 전환 */}
        <Tabs defaultValue="overview">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
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
                      <TooltipContent side="bottom">준비중</TooltipContent>
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

            <div className="flex items-center gap-2">
              <div className="inline-flex items-center rounded-xs bg-muted p-0.75 h-8">
                <TooltipProvider delay={200}>
                  <Tooltip>
                    <TooltipTrigger className="flex font-medium items-center gap-1 px-2 text-sm text-muted-foreground hover:text-foreground transition-colors cursor-help">
                      개미지표는 어떻게 계산되나요?
                      <HelpCircle className="size-3.5" />
                    </TooltipTrigger>
                    <TooltipContent
                      side="bottom"
                      align="end"
                      className="max-w-64 text-xs flex flex-col"
                    >
                      <span className="break-keep leading-relaxed">
                        복수의 종목토론방 글들을 AI 머신러닝으로 감성분석하여
                        긍정(가즈아) 지수·부정(ㅅㅂ) 지수를 산출하여 아래와 같이
                        계산합니다.
                      </span>
                      <span className="block mt-1.5 pt-3.5 w-full border-t border-foreground/15 font-mono text-[11px] opacity-80">
                        지표 = Σ긍정 / (Σ긍정 + Σ부정) × 100
                        <br />
                        가중치 = 1 + log₁₀(공감수 + 1)
                      </span>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>

              <div className="inline-flex items-center rounded-xs bg-muted p-0.75 h-8">
                <button className="inline-flex items-center justify-center size-6.25 rounded-xs bg-background border border-border text-muted-foreground hover:text-foreground shadow-sm dark:bg-transparent dark:border-[#555d6d] dark:shadow-[0_0_6px_rgba(255,255,255,0.08)] transition-colors">
                  <Camera className="size-4" />
                </button>
              </div>
            </div>
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
