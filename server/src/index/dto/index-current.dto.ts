// GET /api/stocks/:code/sb, /gazua, /ant-index 응답 DTO — 지표 현재값
import { ApiProperty } from '@nestjs/swagger';

export class IndexCurrentDto {
  @ApiProperty({ example: '005930' })
  code: string;

  @ApiProperty({ example: '삼성전자' })
  name: string;

  @ApiProperty({
    example: 'FEAR_GREED',
    enum: ['SB', 'GAZUA', 'FEAR_GREED'],
    description: '지표 종류',
  })
  indexType: string;

  @ApiProperty({ example: 62.5, description: '지표값 (0~100)' })
  value: number;

  @ApiProperty({ example: '기대', description: '구간 레이블' })
  label: string;

  @ApiProperty({ example: 49, description: '집계 글 수' })
  totalPosts: number;

  @ApiProperty({ example: '2026-05-03T12:00:00.000Z' })
  calculatedAt: string;
}
