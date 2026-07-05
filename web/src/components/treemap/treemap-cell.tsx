"use client";

import type { TreemapStock } from "@/lib/api";
import { antIndexColor } from "@/lib/utils";
import type { Tier } from "@/lib/treemap";

interface TreemapCellProps {
  stock: TreemapStock;
  tier: Tier;
  onSelect: (stock: TreemapStock) => void;
}

// 큰 셀일수록 더 많은 정보를 노출
const SHOW_META: Record<Tier, boolean> = {
  mega: true,
  large: true,
  mid: true,
  small: false,
};

const NAME_SIZE: Record<Tier, string> = {
  mega: "text-lg sm:text-xl",
  large: "text-base",
  mid: "text-sm",
  small: "text-xs",
};

function fmtRate(rate: number | null): string {
  if (rate == null) return "";
  return `${rate > 0 ? "+" : ""}${rate.toFixed(2)}%`;
}

export function TreemapCell({ stock, tier, onSelect }: TreemapCellProps) {
  const showMeta = SHOW_META[tier];

  return (
    <button
      type="button"
      onClick={() => onSelect(stock)}
      title={`${stock.name} · ${stock.label} ${stock.antIndex.toFixed(0)}`}
      style={{
        backgroundColor: antIndexColor(stock.antIndex),
        textShadow: "0 1px 2px rgba(0,0,0,0.35)",
      }}
      className="group relative flex h-full w-full flex-col justify-between overflow-hidden rounded-md p-2 text-left text-white transition-[filter] hover:brightness-110 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
    >
      <div className="min-w-0">
        <div className={`truncate font-bold leading-tight ${NAME_SIZE[tier]}`}>
          {stock.name}
        </div>
        {showMeta && (
          <div className="truncate text-[10px] font-medium text-white/70">
            {stock.code}
          </div>
        )}
      </div>

      {showMeta && (
        <div className="flex items-end justify-between gap-1">
          <span className="text-xs font-semibold tabular-nums">
            {fmtRate(stock.changeRate)}
          </span>
          {(tier === "mega" || tier === "large") && (
            <span className="truncate text-[11px] font-medium text-white/85">
              {stock.label} {stock.antIndex.toFixed(0)}
            </span>
          )}
        </div>
      )}
    </button>
  );
}
