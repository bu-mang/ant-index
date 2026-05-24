"use client";

import Link from "next/link";
import { Flame } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { MaskedText } from "@/components/masked-text";
import { useMarketHotComments } from "@/lib/queries";

function sentimentBadgeClass(label: "BULL" | "BEAR" | "NEUTRAL"): string {
  if (label === "BULL") return "text-gazua border-gazua";
  if (label === "BEAR") return "text-sb border-sb";
  return "text-muted-foreground";
}

function sentimentLabel(label: "BULL" | "BEAR" | "NEUTRAL"): string {
  if (label === "BULL") return "상승";
  if (label === "BEAR") return "하락";
  return "중립";
}

/** 지금 가장 핫한 글 10개 (전 종목 횡단) */
export function HotPostsSection() {
  const { data, isLoading } = useMarketHotComments(10);

  return (
    <section className="py-16">
      <h2
        className="text-3xl mb-6 flex items-center gap-2"
        style={{ fontFamily: '"Mbc1961", sans-serif' }}
      >
        <Flame className="size-7 text-orange-500" />
        지금 가장 핫한 글
      </h2>

      <p className="max-w-300 text-base leading-relaxed text-foreground/90 break-keep mb-6">
        최근 24 시간 종목토론방에서 공감을 가장 많이 받은 글 10 개입니다.
        본문은 키워드 주변만 노출되고, 나머지는 블러 처리됩니다.
      </p>

      {isLoading && (
        <div className="text-sm text-muted-foreground">로딩 중...</div>
      )}

      {data && data.comments.length === 0 && (
        <div className="text-sm text-muted-foreground">표시할 글이 없습니다.</div>
      )}

      {data && data.comments.length > 0 && (
        <ul className="divide-y divide-border border border-border rounded-md bg-background">
          {data.comments.map((c, i) => (
            <li
              key={`${c.stockCode}-${i}`}
              className="flex items-start justify-between gap-3 p-4"
            >
              <div className="flex items-start gap-3 min-w-0 flex-1">
                <Badge
                  variant="outline"
                  className={`shrink-0 ${sentimentBadgeClass(c.sentimentLabel)}`}
                >
                  {sentimentLabel(c.sentimentLabel)}
                </Badge>
                <div className="min-w-0 flex-1">
                  <Link
                    href={`/stocks/${c.stockCode}`}
                    className="text-xs font-medium text-muted-foreground hover:text-foreground hover:underline"
                  >
                    {c.stockName}
                    <span className="ml-1 font-mono opacity-70">
                      {c.stockCode}
                    </span>
                  </Link>
                  <p className="text-sm font-mono mt-1 truncate">
                    <MaskedText text={c.maskedContent} />
                  </p>
                </div>
              </div>
              <span className="text-xs text-muted-foreground whitespace-nowrap shrink-0 mt-1">
                ❤️ {c.likeBucket}
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
