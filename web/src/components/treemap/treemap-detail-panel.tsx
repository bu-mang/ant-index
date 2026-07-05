"use client";

import { useEffect } from "react";
import { X } from "lucide-react";
import type { TreemapStock } from "@/lib/api";
import { GaugeChart } from "@/components/charts/gauge-chart";
import { useSummary, useHotComments } from "@/lib/queries";
import { MaskedText } from "@/components/masked-text";

interface TreemapDetailPanelProps {
  stock: TreemapStock | null;
  onClose: () => void;
}

const KR_MARKETS = new Set(["KOSPI", "KOSDAQ"]);

function formatMarketCap(cap: number | null, isKR: boolean): string {
  if (cap == null) return "-";
  if (isKR) {
    return cap >= 10000
      ? `${(cap / 10000).toFixed(1)}조원`
      : `${cap.toLocaleString()}억원`;
  }
  // US: 단위 = 백만 USD
  if (cap >= 1_000_000) return `$${(cap / 1_000_000).toFixed(2)}T`;
  if (cap >= 1000) return `$${(cap / 1000).toFixed(1)}B`;
  return `$${cap.toLocaleString()}M`;
}

function formatPrice(price: number | null, isKR: boolean): string {
  if (price == null) return "-";
  return isKR ? `${price.toLocaleString()}원` : `$${price.toFixed(2)}`;
}

export function TreemapDetailPanel({ stock, onClose }: TreemapDetailPanelProps) {
  const code = stock?.code ?? "";
  const { data: summary } = useSummary(code);
  const { data: hot } = useHotComments(code);

  // ESC 로 닫기
  useEffect(() => {
    if (!stock) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [stock, onClose]);

  const open = !!stock;
  const isKR = stock ? KR_MARKETS.has(stock.market) : true;
  // KR 관례(동학·서학개미 모두 국내 유저) — 상승 빨강, 하락 파랑
  const rate = stock?.changeRate ?? null;
  const rateColor =
    rate == null
      ? "text-muted-foreground"
      : rate > 0
        ? "text-[#fa342c]"
        : rate < 0
          ? "text-[#217cf9]"
          : "text-muted-foreground";

  return (
    <>
      {/* 배경 오버레이 */}
      <div
        onClick={onClose}
        className={`fixed inset-0 z-40 bg-black/40 transition-opacity ${
          open ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      />
      {/* 패널 — 데스크톱 우측 드로우 / 모바일 하단 시트 */}
      <aside
        className={`fixed z-50 flex flex-col overflow-y-auto bg-background shadow-2xl transition-transform
          inset-x-0 bottom-0 max-h-[85vh] rounded-t-2xl border-t border-border
          sm:inset-y-0 sm:right-0 sm:left-auto sm:w-[420px] sm:max-h-none sm:rounded-none sm:border-l sm:border-t-0
          ${open ? "translate-y-0 sm:translate-x-0" : "translate-y-full sm:translate-y-0 sm:translate-x-full"}`}
      >
        {stock && (
          <div className="p-5 space-y-6">
            {/* 헤더 */}
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <h2
                  className="text-2xl truncate"
                  style={{ fontFamily: '"Mbc1961", sans-serif' }}
                >
                  {stock.name}
                </h2>
                <p className="text-xs text-muted-foreground">
                  {stock.code} · {stock.market}
                  {stock.sector && ` · ${stock.sector}`}
                </p>
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="닫기"
                className="rounded-md p-1 text-muted-foreground hover:bg-hover-muted"
              >
                <X className="size-5" />
              </button>
            </div>

            {/* 시세 요약 */}
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-lg border border-border p-3">
                <p className="text-xs text-muted-foreground">현재가</p>
                <p className="text-lg font-semibold">
                  {formatPrice(stock.currentPrice, isKR)}
                </p>
                {rate != null && (
                  <p className={`text-sm font-medium ${rateColor}`}>
                    {rate > 0 ? "+" : ""}
                    {rate.toFixed(2)}%
                  </p>
                )}
              </div>
              <div className="rounded-lg border border-border p-3">
                <p className="text-xs text-muted-foreground">시가총액</p>
                <p className="text-lg font-semibold">
                  {formatMarketCap(stock.marketCap, isKR)}
                </p>
                <p className="text-xs text-muted-foreground">
                  글 {stock.totalPosts.toLocaleString()}개
                </p>
              </div>
            </div>

            {/* 개미지표 게이지 */}
            <div>
              <GaugeChart
                value={stock.antIndex}
                label={stock.label}
                color="gradient"
                totalPosts={stock.totalPosts}
              />
            </div>

            {/* 한줄평 */}
            {summary?.summary && (
              <div className="rounded-lg bg-hover-muted p-4">
                <p className="mb-1 text-xs text-muted-foreground">AI 한줄평</p>
                <p className="text-sm leading-relaxed">{summary.summary}</p>
              </div>
            )}

            {/* 핫댓글 */}
            {hot?.comments && hot.comments.length > 0 && (
              <div>
                <p className="mb-2 text-xs text-muted-foreground">핫댓글</p>
                <ul className="space-y-2">
                  {hot.comments.slice(0, 5).map((c, i) => (
                    <li
                      key={i}
                      className="rounded-md border border-border p-2 text-sm"
                    >
                      <MaskedText text={c.maskedContent} />
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </aside>
    </>
  );
}
