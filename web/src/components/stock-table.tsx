// 종목 리스트 테이블 — 메인 대시보드에서 30개 종목을 ㅅㅂ/가즈아 지수와 함께 보여줌
'use client';

import Link from 'next/link';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import type { Stock } from '@/lib/api';

interface StockTableProps {
  stocks: Stock[];
}

function getIndexColor(value: number | null) {
  if (value === null) return 'text-muted-foreground';
  if (value >= 60) return 'text-red-500 font-bold';
  if (value >= 40) return 'text-yellow-500';
  return 'text-green-500';
}

export function StockTable({ stocks }: StockTableProps) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>종목</TableHead>
          <TableHead>섹터</TableHead>
          <TableHead className="text-right">ㅅㅂ지수</TableHead>
          <TableHead className="text-right">가즈아지수</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {stocks.map((stock) => (
          <TableRow key={stock.id} className="cursor-pointer hover:bg-muted/50">
            <TableCell>
              <Link
                href={`/stocks/${stock.code}`}
                className="flex items-center gap-2"
              >
                <span className="font-medium">{stock.name}</span>
                <span className="text-xs text-muted-foreground">
                  {stock.code}
                </span>
              </Link>
            </TableCell>
            <TableCell>
              {stock.sector && (
                <Badge variant="secondary" className="text-xs">
                  {stock.sector}
                </Badge>
              )}
            </TableCell>
            <TableCell
              className={`text-right ${getIndexColor(stock.sbIndex)}`}
            >
              {stock.sbIndex !== null ? stock.sbIndex.toFixed(1) : '-'}
            </TableCell>
            <TableCell
              className={`text-right ${getIndexColor(stock.gazuaIndex)}`}
            >
              {stock.gazuaIndex !== null ? stock.gazuaIndex.toFixed(1) : '-'}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
