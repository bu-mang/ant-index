// GET /api/stocks/:code/*/history, /api/market/ant-index/history 응답 DTO — 지표 히스토리
import { ApiProperty } from '@nestjs/swagger';

// 히스토리 데이터 포인트 (시계열 차트에서 x축에 찍히는 일 별 유닛)
export class HistoryDataPointDto {
  @ApiProperty({ example: '2026-05-03' })
  date: string;

  @ApiProperty({ example: 62.5 })
  value: number;

  @ApiProperty({ example: 49 })
  totalPosts: number;
}

// 종목별 히스토리 응답 (code, name 포함)
export class IndexHistoryDto {
  @ApiProperty({ example: '005930' })
  code: string;

  @ApiProperty({ example: '삼성전자' })
  name: string;

  @ApiProperty({ example: 'FEAR_GREED', enum: ['SB', 'GAZUA', 'FEAR_GREED'] })
  indexType: string;

  @ApiProperty({ example: '7d', enum: ['7d', '30d', '90d'] })
  period: string;

  @ApiProperty({ type: [HistoryDataPointDto] })
  data: HistoryDataPointDto[];
}

// 전체 시장 히스토리 응답 (종목 정보 없이 시장 전체 집계)
export class MarketHistoryDto {
  @ApiProperty({ example: 'FEAR_GREED', enum: ['SB', 'GAZUA', 'FEAR_GREED'] })
  indexType: string;

  @ApiProperty({ example: '7d', enum: ['7d', '30d', '90d'] })
  period: string;

  @ApiProperty({ type: [HistoryDataPointDto] })
  data: HistoryDataPointDto[];
}
