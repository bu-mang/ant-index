// GET /api/stocks/:code/summary, /api/market/summary 응답 DTO — AI 한줄평
import { ApiProperty } from '@nestjs/swagger';

// 종목별 한줄평 (analyzer가 Ollama로 생성 → stocks.summary에 저장)
export class StockSummaryDto {
  @ApiProperty({ example: '005930' })
  code: string;

  @ApiProperty({ example: '삼성전자' })
  name: string;

  @ApiProperty({ example: '비관론 소폭 우세, 관망 분위기', nullable: true })
  summary: string | null;

  @ApiProperty({ example: '2026-05-03T12:00:00.000Z', nullable: true })
  updatedAt: Date | null;
}

// 전체 시장 한줄평 (market_summary 테이블, append-only)
export class MarketSummaryDto {
  @ApiProperty({
    example: '시장 전반 관망세, 뚜렷한 방향 없음',
    nullable: true,
  })
  summary: string | null;

  @ApiProperty({ example: '2026-05-03T12:00:00.000Z', nullable: true })
  createdAt: Date | null;
}
