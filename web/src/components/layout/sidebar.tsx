"use client";

import { StockTable } from "@/components/stock-table";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TaegukIcon } from "@/components/icons/taeguk";
import { Construction, HelpCircle } from "lucide-react";
import type { Stock } from "@/lib/api";

interface SidebarProps {
  stocks: Stock[];
}

export function Sidebar({ stocks }: SidebarProps) {
  return (
    <aside className="hidden lg:flex flex-col w-108 fixed right-0 top-0 bottom-0 border-l border-border bg-sidebar">
      <div className="shrink-0 border-b border-border">
        <div className="h-14 flex items-end justify-between pb-3.5 pl-6 pr-8">
          <div className="flex items-center gap-1.5">
            <h2
              className="text-base font-normal"
              style={{
                fontFamily: '"Mbc1961", sans-serif',
              }}
            >
              종목별 지수
            </h2>
            <TooltipProvider delay={200}>
              <Tooltip>
                <TooltipTrigger className="text-muted-foreground hover:text-foreground transition-colors cursor-help">
                  <HelpCircle className="size-3.5" />
                </TooltipTrigger>
                <TooltipContent
                  side="bottom"
                  align="start"
                  className="max-w-72 text-xs leading-relaxed"
                >
                  <div className="flex flex-col">
                    <p className="font-semibold mb-1.5">시세 갱신 주기</p>
                    <ul className="space-y-1 list-disc pl-4 break-keep">
                      <li>
                        최대 <strong>2분 주기</strong>로 가격이 갱신됩니다.
                      </li>
                      <li>종목 별로 갱신 타이밍이 다를 수 있습니다. </li>
                    </ul>
                  </div>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>

          <Tabs defaultValue="kr">
            <TabsList>
              <TabsTrigger value="kr">
                <TaegukIcon className="size-3" /> 국장
              </TabsTrigger>
              <TooltipProvider delay={200}>
                <Tooltip>
                  <TooltipTrigger className="inline-flex items-center gap-0.5 px-1.5 py-0.5 text-sm font-medium text-muted-foreground/40 cursor-not-allowed">
                    미장 <Construction className="size-3" />
                  </TooltipTrigger>
                  <TooltipContent side="bottom">준비중</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </TabsList>
          </Tabs>
        </div>

        <table className="w-full table-fixed text-sm h-10">
          <colgroup>
            <col className="w-[50%]" />
            <col className="w-[20%]" />
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
