"use client";

import { Badge } from "@/components/ui/badge";
import { GaugeChart } from "@/components/charts/gauge-chart";
import { TimeSeriesChart } from "@/components/charts/time-series-chart";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useAntIndexHistory } from "@/lib/queries";

// 시계열 차트용 대표 종목 (삼성전자)
const REPRESENTATIVE_CODE = "005930";

interface MainContentProps {
  avgAntIndex: { value: number; label: string; totalPosts: number };
  marketSummary?: string;
}

export function MainContent({ avgAntIndex, marketSummary }: MainContentProps) {
  const { data: antHistory7d } = useAntIndexHistory(REPRESENTATIVE_CODE, "7d");
  const { data: antHistory30d } = useAntIndexHistory(
    REPRESENTATIVE_CODE,
    "30d",
  );
  const { data: antHistory90d } = useAntIndexHistory(
    REPRESENTATIVE_CODE,
    "90d",
  );

  return (
    <main className="pt-14 lg:mr-108 min-h-screen">
      <div className="max-w-432 mx-auto px-12 py-6 space-y-6">
        {/* 한줄평 — 탭과 무관하게 항상 표시 */}
        {marketSummary && (
          <section className="py-16 pb-8">
            <div className="flex flex-col items-center gap-3">
              <Badge variant="default">증시요약</Badge>
              <p
                className="text-4xl text-center font-normal max-w-150 leading-snug break-keep"
                style={{
                  fontFamily: '"Mbc1961", sans-serif',
                }}
              >
                {marketSummary}
              </p>
            </div>
          </section>
        )}

        {/* 탭 — 차트만 전환 */}
        <Tabs defaultValue="overview">
          <div className="flex items-center justify-center">
            <TabsList>
              <TabsTrigger value="overview">현재상황</TabsTrigger>
              <TabsTrigger value="timeline">타임라인</TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="overview">
            <section className="py-8">
              <div className="flex justify-center max-w-208 mx-auto">
                <GaugeChart
                  value={avgAntIndex.value}
                  label={avgAntIndex.label}
                  title="국내주식 개미지표"
                  color="gradient"
                  totalPosts={avgAntIndex.totalPosts}
                />
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
