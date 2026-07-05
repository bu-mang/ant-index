// 트리맵 셀 크기 티어 — 시가총액 비율로 셀이 차지하는 grid span 을 결정한다.
// Tailwind v4 는 소스에서 리터럴 클래스만 스캔하므로 span 클래스는 반드시 정적 문자열이어야 한다.
import type { TreemapStock } from "./api";

export type Tier = "mega" | "large" | "mid" | "small";

/** 시총 비율(0~1) → 티어. 같은 시장 안에서의 상대 크기 기준. */
export function tierOf(marketCap: number | null, maxCap: number): Tier {
  if (!marketCap || maxCap <= 0) return "small";
  const r = marketCap / maxCap;
  if (r >= 0.5) return "mega";
  if (r >= 0.22) return "large";
  if (r >= 0.08) return "mid";
  return "small";
}

// 모바일(2열)에서도 넘치지 않도록 캡을 두고, lg 이상에서 확장.
export const TIER_SPAN: Record<Tier, string> = {
  mega: "col-span-2 row-span-2 lg:col-span-3 lg:row-span-3",
  large: "col-span-2 row-span-2",
  mid: "col-span-2 row-span-1",
  small: "col-span-1 row-span-1",
};

/** 섹터별로 묶고, 각 섹터를 총 시총 내림차순으로 정렬해 반환 */
export function groupBySector(
  stocks: TreemapStock[],
): { sector: string; stocks: TreemapStock[]; totalCap: number }[] {
  const map = new Map<string, TreemapStock[]>();
  for (const s of stocks) {
    const key = s.sector ?? "기타";
    (map.get(key) ?? map.set(key, []).get(key)!).push(s);
  }
  return [...map.entries()]
    .map(([sector, list]) => ({
      sector,
      stocks: [...list].sort((a, b) => (b.marketCap ?? 0) - (a.marketCap ?? 0)),
      totalCap: list.reduce((sum, s) => sum + (s.marketCap ?? 0), 0),
    }))
    .sort((a, b) => b.totalCap - a.totalCap);
}
