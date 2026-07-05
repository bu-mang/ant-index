"use client";

import { useState } from "react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TaegukIcon } from "@/components/icons/taeguk";
import { USFlagIcon } from "@/components/icons/us-flag";
import { TreemapGrid } from "./treemap-grid";
import { TreemapDetailPanel } from "./treemap-detail-panel";
import { useTreemap } from "@/lib/queries";
import { antIndexColor } from "@/lib/utils";
import {
  ANT_INDEX_LABELS,
  MARKET_GROUP_ANT_LABEL,
  type MarketGroup,
} from "@/lib/constants";
import type { MarketParam, TreemapStock } from "@/lib/api";

// 컴팩트 색상 범례 — 돔황챠(파랑) → 가즈아(주황)
function ColorLegend() {
  return (
    <div className="flex items-center gap-2 text-xs text-muted-foreground">
      <span>돔황챠</span>
      <div className="flex overflow-hidden rounded-full">
        {ANT_INDEX_LABELS.map((_, i) => (
          <span
            key={i}
            className="h-2.5 w-6"
            style={{ backgroundColor: antIndexColor(i * 25 + 10) }}
          />
        ))}
      </div>
      <span>가즈아</span>
    </div>
  );
}

export function TreemapView() {
  const [market, setMarket] = useState<MarketGroup>("KR");
  const [selected, setSelected] = useState<TreemapStock | null>(null);

  const { data, isLoading } = useTreemap(market as MarketParam);

  return (
    <div className="space-y-4">
      {/* 헤더: 제목 + 국장/미장 토글 */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1
            className="text-2xl sm:text-3xl"
            style={{ fontFamily: '"Mbc1961", sans-serif' }}
          >
            {MARKET_GROUP_ANT_LABEL[market]} 민심 히트맵
          </h1>
          <p className="text-sm text-muted-foreground">
            크기는 시가총액, 색은 개미지표(민심)
          </p>
        </div>

        <Tabs value={market} onValueChange={(v) => setMarket(v as MarketGroup)}>
          <TabsList>
            <TabsTrigger value="KR">
              <TaegukIcon className="size-3" /> 국장
            </TabsTrigger>
            <TabsTrigger value="US">
              <USFlagIcon className="size-3" /> 미장
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <ColorLegend />

      {/* 트리맵 */}
      {isLoading ? (
        <div className="flex h-96 items-center justify-center text-muted-foreground">
          로딩 중...
        </div>
      ) : (
        <TreemapGrid stocks={data?.stocks ?? []} onSelect={setSelected} />
      )}

      {/* 상세 패널 */}
      <TreemapDetailPanel stock={selected} onClose={() => setSelected(null)} />
    </div>
  );
}
