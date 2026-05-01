// 종목 리스트 테이블 — 메인 대시보드에서 30개 종목을 통합 개미지표와 함께 보여줌
"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table";
import type { Stock } from "@/lib/api";
import { getLabel, ANT_INDEX_LABELS } from "@/lib/constants";

interface StockTableProps {
  stocks: Stock[];
}

function StockLogo({ code, name }: { code: string; name: string }) {
  const [error, setError] = useState(false);

  if (error) {
    return <div className="w-8 h-8 rounded-full bg-muted shrink-0" />;
  }

  return (
    <Image
      src={`/logos/${code}.png`}
      alt={name}
      width={32}
      height={32}
      className="rounded-full shrink-0"
      onError={() => setError(true)}
    />
  );
}

function getAntIndexColor(value: number | null) {
  if (value === null) return "text-muted-foreground";
  if (value <= 20) return "text-[#0a4fbd] dark:text-[#3d7fe0] font-bold";
  if (value <= 40) return "text-sb";
  if (value <= 60) return "text-foreground/80";
  if (value <= 80) return "text-gazua";
  return "text-[#b34400] dark:text-[#ff7a33] font-bold";
}

export function StockTable({ stocks }: StockTableProps) {
  return (
    <>
      <Table className="table-fixed">
        <colgroup>
          <col className="w-[45%]" />
          <col className="w-[25%]" />
          <col className="w-[30%]" />
        </colgroup>
        <TableBody>
          {stocks.map((stock) => (
            <TableRow
              key={stock.id}
              className="cursor-pointer hover:bg-hover-muted"
            >
              <TableCell className="pl-5">
                <Link
                  href={`/stocks/${stock.code}`}
                  className="flex items-center gap-2"
                >
                  <StockLogo code={stock.code} name={stock.name} />
                  <div className="flex flex-col min-w-0">
                    <span className="font-bold truncate">{stock.name}</span>
                    <span className="text-xs text-muted-foreground">
                      {stock.code}
                      {stock.sector && ` | ${stock.sector}`}
                    </span>
                  </div>
                </Link>
              </TableCell>
              <TableCell className="text-right">
                <div className="flex flex-col">
                  <span className="font-semibold">
                    {stock.currentPrice != null
                      ? stock.currentPrice.toLocaleString() + "원"
                      : "-"}
                  </span>
                  {stock.changeRate != null && (
                    <span
                      className={`text-xs ${
                        stock.changeRate > 0
                          ? "text-[#fa342c]"
                          : stock.changeRate < 0
                            ? "text-[#217cf9]"
                            : "text-muted-foreground"
                      }`}
                    >
                      {stock.changeRate > 0 ? "+" : ""}
                      {stock.changeRate.toFixed(2)}%
                    </span>
                  )}
                </div>
              </TableCell>
              <TableCell
                className={`text-right pr-10 ${getAntIndexColor(stock.antIndex)}`}
              >
                <div className="flex flex-col">
                  <span className="font-semibold">
                    {stock.antIndex !== null
                      ? getLabel(stock.antIndex, ANT_INDEX_LABELS)
                      : "-"}
                  </span>
                  {stock.antIndex !== null && (
                    <span className="text-xs opacity-50">
                      {stock.antIndex.toFixed(1)}
                    </span>
                  )}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <p className="text-xs text-muted-foreground/50 text-center py-4 border-t border-border">
        새로운 종목이 주기적으로 업데이트됩니다
      </p>
    </>
  );
}
