// GET /api/stocks/:code/stats 응답 DTO — 종목 통계 카드
import { ApiProperty } from '@nestjs/swagger';

export class StockStatsDto {
  @ApiProperty({ example: '005930' })
  code: string;

  @ApiProperty({ example: '삼성전자' })
  name: string;

  @ApiProperty({ example: 127, description: '최근 24시간 총 글 수' })
  totalPosts: number;

  @ApiProperty({ example: 35.2, description: '상승론자 비율 (%)' })
  bullPercent: number;

  @ApiProperty({ example: 48.1, description: '하락론자 비율 (%)' })
  bearPercent: number;

  @ApiProperty({ example: 16.7, description: '중립 비율 (%)' })
  neutralPercent: number;

  @ApiProperty({
    example: 42.3,
    description: '전일 대비 글 증감률 (%). null이면 비교 데이터 없음',
    nullable: true,
  })
  postChangeRate: number | null;
}
