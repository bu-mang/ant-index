"use client";

import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import { MARKET_GROUP_ANT_LABEL, type MarketGroup } from "@/lib/constants";
import { AntIndexHero } from "@/components/ant-index-hero";
import { HotPostsSection } from "@/components/landing/hot-posts-section";
import { AboutSection } from "@/components/landing/about-section";
import { RangeSection } from "@/components/landing/range-section";
import { FaqSection } from "@/components/landing/faq-section";
import { DisclaimerSection } from "@/components/landing/disclaimer-section";
import { useState } from "react";

interface MainContentProps {
  avgAntIndex: { value: number; label: string; totalPosts: number };
  marketSummary?: string;
}

export function MainContent({ avgAntIndex, marketSummary }: MainContentProps) {
  const [market, setMarket] = useState<MarketGroup>("KR");
  const subject = MARKET_GROUP_ANT_LABEL[market];

  const { data: antHistory7d } = useMarketAntIndexHistory("7d");
  const { data: antHistory30d } = useMarketAntIndexHistory("30d");
  const { data: antHistory90d } = useMarketAntIndexHistory("90d");

  return (
    <main className="pt-14 lg:mr-108 min-h-screen">
      <div className="max-w-432 mx-auto px-12 py-6 space-y-6">
        <AntIndexHero
          subject={subject}
          summary={marketSummary}
          avgAntIndex={avgAntIndex}
          data7d={antHistory7d?.data}
          data30d={antHistory30d?.data}
          data90d={antHistory90d?.data}
          marketTabs={
            <Tabs
              value={market}
              onValueChange={(v) => setMarket(v as MarketGroup)}
            >
              <TabsList>
                <TabsTrigger value="KR">
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
          }
        />

        {/* ─── 랜딩 섹션들 ─── */}
        <AboutSection />
        <HotPostsSection />
        <RangeSection />
        <FaqSection />
        <DisclaimerSection />
      </div>
    </main>
  );
}
