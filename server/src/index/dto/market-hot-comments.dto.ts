// GET /api/market/hot-comments 응답 DTO — 전 종목 횡단 핫 글
import { ApiProperty } from '@nestjs/swagger';

export class MarketHotCommentItemDto {
  @ApiProperty({ example: '005930' })
  stockCode: string;

  @ApiProperty({ example: '삼성전자' })
  stockName: string;

  @ApiProperty({ example: '██ 떡상 ██████', description: '마스킹된 본문' })
  maskedContent: string;

  @ApiProperty({
    example: 'BULL',
    enum: ['BULL', 'BEAR', 'NEUTRAL'],
    description: '감성 라벨',
  })
  sentimentLabel: string;

  @ApiProperty({ example: '100+', description: '좋아요 버킷' })
  likeBucket: string;

  @ApiProperty({ example: '2026-05-23T14:30:00.000Z' })
  postedAt: string;
}

export class MarketHotCommentsDto {
  @ApiProperty({ type: [MarketHotCommentItemDto] })
  comments: MarketHotCommentItemDto[];
}
