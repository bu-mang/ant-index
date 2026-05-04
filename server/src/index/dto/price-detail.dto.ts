// GET /api/stocks/:code/price 응답 DTO — 종목 기본정보 카드
import { ApiProperty } from '@nestjs/swagger';

export class PriceDetailDto {
  @ApiProperty({ example: '005930' })
  code: string;

  @ApiProperty({ example: '삼성전자' })
  name: string;

  @ApiProperty({ example: 67300, nullable: true, description: '현재가 (원)' })
  currentPrice: number | null;

  @ApiProperty({ example: -2.1, nullable: true, description: '등락률 (%)' })
  changeRate: number | null;

  @ApiProperty({ example: 12345678, nullable: true, description: '거래량' })
  volume: number | null;

  @ApiProperty({
    example: 4020000,
    nullable: true,
    description: '시가총액 (억원)',
  })
  marketCap: number | null;

  @ApiProperty({ example: 12.3, nullable: true, description: 'PER (배)' })
  per: number | null;

  @ApiProperty({ example: 1.2, nullable: true, description: 'PBR (배)' })
  pbr: number | null;

  @ApiProperty({
    example: 2.1,
    nullable: true,
    description: '배당수익률 (%)',
  })
  dividendYield: number | null;

  @ApiProperty({ example: 85000, nullable: true, description: '52주 최고가' })
  high52w: number | null;

  @ApiProperty({ example: 53000, nullable: true, description: '52주 최저가' })
  low52w: number | null;
}
