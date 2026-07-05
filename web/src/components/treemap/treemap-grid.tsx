"use client";

import type { TreemapStock } from "@/lib/api";
import { TIER_SPAN, groupBySector, tierOf } from "@/lib/treemap";
import { TreemapCell } from "./treemap-cell";

interface TreemapGridProps {
  stocks: TreemapStock[];
  onSelect: (stock: TreemapStock) => void;
}

/**
 * 섹터별 블록으로 묶은 반응형 트리맵.
 * - 셀 크기 = 시가총액 티어(grid col/row span)
 * - 셀 색상 = 개미지표(민심) — TreemapCell 이 담당
 * - CSS Grid + grid-flow-row-dense 로 빈틈 최소화, 모바일에서 컬럼 축소
 */
export function TreemapGrid({ stocks, onSelect }: TreemapGridProps) {
  if (stocks.length === 0) {
    return (
      <div className="py-24 text-center text-muted-foreground">
        표시할 종목이 없습니다.
      </div>
    );
  }

  const maxCap = Math.max(...stocks.map((s) => s.marketCap ?? 0));
  const sectors = groupBySector(stocks);

  return (
    <div className="space-y-6">
      {sectors.map(({ sector, stocks: group }) => (
        <section key={sector}>
          <h3 className="mb-2 flex items-baseline gap-2">
            <span
              className="text-lg"
              style={{ fontFamily: '"Mbc1961", sans-serif' }}
            >
              {sector}
            </span>
            <span className="text-xs text-muted-foreground">
              {group.length}종목
            </span>
          </h3>
          <div className="grid auto-rows-[68px] grid-flow-row-dense grid-cols-2 gap-1.5 sm:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8">
            {group.map((stock) => {
              const tier = tierOf(stock.marketCap, maxCap);
              return (
                <div key={stock.code} className={TIER_SPAN[tier]}>
                  <TreemapCell stock={stock} tier={tier} onSelect={onSelect} />
                </div>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}
