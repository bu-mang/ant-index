"use client";

import { StockTable } from "@/components/stock-table";
import type { Stock } from "@/lib/api";

interface SidebarProps {
  stocks: Stock[];
}

export function Sidebar({ stocks }: SidebarProps) {
  return (
    <aside className="hidden lg:flex flex-col w-120 fixed right-0 top-0 bottom-0 border-l border-border bg-sidebar">
      <div className="shrink-0 border-b border-border">
        <div className="h-14  flex items-end pb-3.5 px-6">
          <h2
            className="text-base font-bold"
            style={{
              fontFamily: '"Mbc1961", sans-serif',
                          }}
          >
            종목별 지수
          </h2>
        </div>
        <table className="w-full table-fixed text-sm h-10">
          <colgroup>
            <col className="w-[45%]" />
            <col className="w-[25%]" />
            <col className="w-[30%]" />
          </colgroup>
          <thead>
            <tr>
              <th className="h-7 pl-5 text-left text-xs font-medium text-muted-foreground">
                <span className="translate-x-1 inline-block">종목</span>
              </th>
              <th className="h-7 px-2 text-right text-xs font-medium text-muted-foreground">
                <span>시세</span>
              </th>
              <th className="h-7 pr-10 text-right text-xs font-medium text-muted-foreground">
                <span>개미지표</span>
              </th>
            </tr>
          </thead>
        </table>
      </div>
      <div className="overflow-y-auto flex-1 overscroll-contain">
        <StockTable stocks={stocks} />
      </div>
    </aside>
  );
}
