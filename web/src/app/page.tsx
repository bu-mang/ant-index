// 메인 대시보드 — 전체 종목의 ㅅㅂ지수/가즈아지수 게이지 + 시계열 차트 + 종목 테이블
'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { GaugeChart } from '@/components/gauge-chart';
import { TimeSeriesChart } from '@/components/time-series-chart';
import { PeriodSelector } from '@/components/period-selector';
import { StockTable } from '@/components/stock-table';
import {
  useStocks,
  useSbIndex,
  useGazuaIndex,
  useSbHistory,
  useGazuaHistory,
} from '@/lib/queries';

// 대표 종목 (삼성전자) 기준으로 메인 게이지 표시
const REPRESENTATIVE_CODE = '005930';

export default function DashboardPage() {
  const [period, setPeriod] = useState('7d');
  const { data: stocks, isLoading: stocksLoading } = useStocks();
  const { data: sbIndex } = useSbIndex(REPRESENTATIVE_CODE);
  const { data: gazuaIndex } = useGazuaIndex(REPRESENTATIVE_CODE);
  const { data: sbHistory } = useSbHistory(REPRESENTATIVE_CODE, period);
  const { data: gazuaHistory } = useGazuaHistory(REPRESENTATIVE_CODE, period);

  if (stocksLoading) {
    return (
      <div className="flex items-center justify-center h-96 text-muted-foreground">
        로딩 중...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 게이지 섹션 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardContent className="pt-6 flex justify-center">
            <GaugeChart
              value={sbIndex?.value ?? 0}
              label={sbIndex?.label ?? '-'}
              title="국내주식 ㅅㅂ지수"
              color="red"
              totalPosts={sbIndex?.totalPosts}
            />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6 flex justify-center">
            <GaugeChart
              value={gazuaIndex?.value ?? 0}
              label={gazuaIndex?.label ?? '-'}
              title="국내주식 가즈아지수"
              color="green"
              totalPosts={gazuaIndex?.totalPosts}
            />
          </CardContent>
        </Card>
      </div>

      {/* 시계열 차트 */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">지표 추이</CardTitle>
          <PeriodSelector value={period} onChange={setPeriod} />
        </CardHeader>
        <CardContent>
          <TimeSeriesChart
            sbData={sbHistory?.data}
            gazuaData={gazuaHistory?.data}
          />
        </CardContent>
      </Card>

      {/* 종목 테이블 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">종목별 지표</CardTitle>
        </CardHeader>
        <CardContent>
          <StockTable stocks={stocks ?? []} />
        </CardContent>
      </Card>
    </div>
  );
}
