// GET /api/stocks/:code/hot-comments 응답 DTO — 핫댓글
import { ApiProperty } from '@nestjs/swagger';

export class HotCommentItemDto {
  @ApiProperty({ example: '██ 떡상 ██████', description: '마스킹된 본문' })
  maskedContent: string;

  @ApiProperty({
    example: 'BULL',
    enum: ['BULL', 'BEAR', 'NEUTRAL'],
    description: '감성 라벨',
  })
  sentimentLabel: string;

  @ApiProperty({ example: '100+', description: '좋아요 버킷 (1~5, 10+, 100+, 200+)' })
  likeBucket: string;

  @ApiProperty({ example: '2026-05-03T14:30:00.000Z' })
  postedAt: string;
}

export class HotCommentsDto {
  @ApiProperty({ example: '005930' })
  code: string;

  @ApiProperty({ example: '삼성전자' })
  name: string;

  @ApiProperty({ type: [HotCommentItemDto] })
  comments: HotCommentItemDto[];
}
