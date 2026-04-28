// 종목 리스트 테이블 — 메인 대시보드에서 30개 종목을 ㅅㅂ/가즈아 지수와 함께 보여줌
"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table";
import type { Stock } from "@/lib/api";
import { getLabel, SB_LABELS, GAZUA_LABELS } from "@/lib/constants";

interface StockTableProps {
  stocks: Stock[];
}

function StockLogo({ code, name }: { code: string; name: string }) {
  const [error, setError] = useState(false);

  if (error) {
    return (
      <div className="w-8 h-8 rounded-full bg-muted shrink-0" />
    );
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

function getIndexColor(value: number | null) {
  if (value === null) return "text-muted-foreground";
  if (value >= 60) return "text-red-500 font-bold";
  if (value >= 40) return "text-yellow-500";
  return "text-green-500";
}

export function StockTable({ stocks }: StockTableProps) {
  return (
    <>
      <Table className="table-fixed">
        <colgroup>
          <col className="w-[40%]" />
          <col className="w-[20%]" />
          <col className="w-[20%]" />
          <col className="w-[20%]" />
        </colgroup>
        <TableBody>
          {stocks.map((stock) => (
            <TableRow
              key={stock.id}
              className="cursor-pointer hover:bg-muted/50"
            >
              <TableCell className="pl-3">
                <Link href={`/stocks/${stock.code}`} className="flex items-center gap-2">
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
              <TableCell
                className={`text-right ${
                  (stock.changeRate ?? 0) > 0
                    ? "text-red-500"
                    : (stock.changeRate ?? 0) < 0
                      ? "text-blue-500"
                      : "text-muted-foreground"
                }`}
              >
                <div className="flex flex-col">
                  <span className="font-semibold">
                    {stock.currentPrice != null
                      ? stock.currentPrice.toLocaleString() + "원"
                      : "-"}
                  </span>
                  {stock.changeRate != null && (
                    <span className="text-xs opacity-50">
                      {stock.changeRate > 0 ? "+" : ""}
                      {stock.changeRate.toFixed(2)}%
                    </span>
                  )}
                </div>
              </TableCell>
              <TableCell
                className={`text-right ${getIndexColor(stock.sbIndex)}`}
              >
                <div className="flex flex-col">
                  <span className="font-semibold">
                    {stock.sbIndex !== null
                      ? getLabel(stock.sbIndex, SB_LABELS)
                      : "-"}
                  </span>
                  {stock.sbIndex !== null && (
                    <span className="text-xs opacity-50">
                      {stock.sbIndex.toFixed(1)}
                    </span>
                  )}
                </div>
              </TableCell>
              <TableCell
                className={`text-right pr-6 ${getIndexColor(stock.gazuaIndex)}`}
              >
                <div className="flex flex-col">
                  <span className="font-semibold">
                    {stock.gazuaIndex !== null
                      ? getLabel(stock.gazuaIndex, GAZUA_LABELS)
                      : "-"}
                  </span>
                  {stock.gazuaIndex !== null && (
                    <span className="text-xs opacity-50">
                      {stock.gazuaIndex.toFixed(1)}
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
