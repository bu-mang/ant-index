// GET /api/stocks 응답 DTO — 활성 종목 목록 (최신 지표값 + 시세 포함)
// 사이드바에 응답
import { ApiProperty } from '@nestjs/swagger';

export class StockResponseDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: '005930', description: '종목코드' })
  code: string;

  @ApiProperty({ example: '삼성전자', description: '종목명' })
  name: string;

  @ApiProperty({
    example: 'KOSPI',
    enum: ['KOSPI', 'KOSDAQ', 'NASDAQ', 'NYSE'],
  })
  market: string;

  @ApiProperty({ example: '반도체', nullable: true })
  sector: string | null;

  @ApiProperty({ example: true, description: '크롤링/분석 대상 여부' })
  isActive: boolean;

  @ApiProperty({ example: true, description: '프론트 노출 여부' })
  isVisible: boolean;

  @ApiProperty({
    example: 37.4,
    nullable: true,
    description: 'ㅅㅂ지수 (0~100)',
  })
  sbIndex: number | null;

  @ApiProperty({
    example: 17.57,
    nullable: true,
    description: '가즈아지수 (0~100)',
  })
  gazuaIndex: number | null;

  @ApiProperty({ example: 62.5, description: '통합 개미지표 (0~100)' })
  antIndex: number;

  @ApiProperty({ example: 49, description: '최근 24시간 분석 글 수' })
  totalPosts: number;

  @ApiProperty({ example: 67300, nullable: true, description: '현재가 (원)' })
  currentPrice: number | null;

  @ApiProperty({ example: -2.1, nullable: true, description: '등락률 (%)' })
  changeRate: number | null;
}
