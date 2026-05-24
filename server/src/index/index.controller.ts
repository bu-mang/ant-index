// 지표 API 컨트롤러 — 종목별 ㅅㅂ지수 / 가즈아지수 현재값 + 히스토리 제공
// 모든 엔드포인트는 /api/stocks/:code 하위에 위치한다.
import { Controller, Get, Param, Query } from '@nestjs/common';
import {
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { IndexService } from './index.service';
import { IndexCurrentDto } from './dto/index-current.dto';
import { IndexHistoryDto, MarketHistoryDto } from './dto/index-history.dto';
import { StockSummaryDto, MarketSummaryDto } from './dto/summary.dto';
import { StockStatsDto } from './dto/stock-stats.dto';
import { PriceDetailDto } from './dto/price-detail.dto';
import { HotCommentsDto } from './dto/hot-comments.dto';
import { MarketHotCommentsDto } from './dto/market-hot-comments.dto';

@ApiTags('지표')
@Controller('stocks/:code')
export class IndexController {
  constructor(private readonly indexService: IndexService) {}

  @Get('sb')
  @ApiOperation({
    summary: 'ㅅㅂ지수 현재값',
    description: '최근 24시간 기준 실시간 계산',
  })
  @ApiParam({ name: 'code', example: '005930' })
  @ApiResponse({ status: 200, type: IndexCurrentDto })
  getSbIndex(@Param('code') code: string): Promise<IndexCurrentDto> {
    return this.indexService.getSbIndex(code);
  }

  @Get('sb/history')
  @ApiOperation({ summary: 'ㅅㅂ지수 히스토리' })
  @ApiParam({ name: 'code', example: '005930' })
  @ApiQuery({ name: 'period', required: false, enum: ['7d', '30d', '90d'] })
  @ApiResponse({ status: 200, type: IndexHistoryDto })
  getSbHistory(
    @Param('code') code: string,
    @Query('period') period?: string,
  ): Promise<IndexHistoryDto> {
    return this.indexService.getSbHistory(code, period);
  }

  @Get('gazua')
  @ApiOperation({
    summary: '가즈아지수 현재값',
    description: '최근 24시간 기준 실시간 계산',
  })
  @ApiParam({ name: 'code', example: '005930' })
  @ApiResponse({ status: 200, type: IndexCurrentDto })
  getGazuaIndex(@Param('code') code: string): Promise<IndexCurrentDto> {
    return this.indexService.getGazuaIndex(code);
  }

  @Get('gazua/history')
  @ApiOperation({ summary: '가즈아지수 히스토리' })
  @ApiParam({ name: 'code', example: '005930' })
  @ApiQuery({ name: 'period', required: false, enum: ['7d', '30d', '90d'] })
  @ApiResponse({ status: 200, type: IndexHistoryDto })
  getGazuaHistory(
    @Param('code') code: string,
    @Query('period') period?: string,
  ): Promise<IndexHistoryDto> {
    return this.indexService.getGazuaHistory(code, period);
  }

  @Get('ant-index')
  @ApiOperation({
    summary: '통합 개미지표 현재값',
    description: '0=돔황챠(공포), 100=가즈아(탐욕)',
  })
  @ApiParam({ name: 'code', example: '005930' })
  @ApiResponse({ status: 200, type: IndexCurrentDto })
  getAntIndex(@Param('code') code: string): Promise<IndexCurrentDto> {
    return this.indexService.getAntIndex(code);
  }

  @Get('ant-index/history')
  @ApiOperation({ summary: '통합 개미지표 히스토리' })
  @ApiParam({ name: 'code', example: '005930' })
  @ApiQuery({ name: 'period', required: false, enum: ['7d', '30d', '90d'] })
  @ApiResponse({ status: 200, type: IndexHistoryDto })
  getAntIndexHistory(
    @Param('code') code: string,
    @Query('period') period?: string,
  ): Promise<IndexHistoryDto> {
    return this.indexService.getAntIndexHistory(code, period);
  }

  @Get('price')
  @ApiOperation({
    summary: '종목 기본정보',
    description:
      '최신 시세 + 투자지표 (시총, PER, PBR, 배당수익률, 52주 고/저)',
  })
  @ApiParam({ name: 'code', example: '005930' })
  @ApiResponse({ status: 200, type: PriceDetailDto })
  getPriceDetail(@Param('code') code: string): Promise<PriceDetailDto> {
    return this.indexService.getPriceDetail(code);
  }

  @Get('hot-comments')
  @ApiOperation({
    summary: '핫댓글',
    description: '최근 24시간 좋아요 상위 글/댓글 (마스킹 처리)',
  })
  @ApiParam({ name: 'code', example: '005930' })
  @ApiQuery({ name: 'limit', required: false, example: 10 })
  @ApiResponse({ status: 200, type: HotCommentsDto })
  getHotComments(
    @Param('code') code: string,
    @Query('limit') limit?: number,
  ): Promise<HotCommentsDto> {
    return this.indexService.getHotComments(code, limit ? +limit : undefined);
  }

  @Get('stats')
  @ApiOperation({
    summary: '종목 통계',
    description: '최근 24시간 감성 분포 + 전일 대비 글 증감률',
  })
  @ApiParam({ name: 'code', example: '005930' })
  @ApiResponse({ status: 200, type: StockStatsDto })
  getStats(@Param('code') code: string): Promise<StockStatsDto> {
    return this.indexService.getStats(code);
  }

  @Get('summary')
  @ApiOperation({
    summary: '종목 한줄평',
    description: 'analyzer가 생성한 AI 한줄평',
  })
  @ApiParam({ name: 'code', example: '005930' })
  @ApiResponse({ status: 200, type: StockSummaryDto })
  getSummary(@Param('code') code: string): Promise<StockSummaryDto> {
    return this.indexService.getSummary(code);
  }
}

@ApiTags('시장')
@Controller('market')
export class MarketController {
  constructor(private readonly indexService: IndexService) {}

  @Get('summary')
  @ApiOperation({ summary: '전체 시장 한줄평' })
  @ApiResponse({ status: 200, type: MarketSummaryDto })
  getMarketSummary(): Promise<MarketSummaryDto> {
    return this.indexService.getMarketSummary();
  }

  @Get('ant-index/history')
  @ApiOperation({
    summary: '전체 시장 개미지표 히스토리',
    description: '24시간 슬라이딩 윈도우 기반 일별 추이',
  })
  @ApiQuery({ name: 'period', required: false, enum: ['7d', '30d', '90d'] })
  @ApiResponse({ status: 200, type: MarketHistoryDto })
  getMarketAntIndexHistory(
    @Query('period') period?: string,
  ): Promise<MarketHistoryDto> {
    return this.indexService.getMarketAntIndexHistory(period);
  }

  @Get('hot-comments')
  @ApiOperation({
    summary: '전 종목 횡단 핫 글',
    description:
      '최근 24시간 공감수 상위 글. 마스킹 결과에 보이는 글자가 있는 것만 반환.',
  })
  @ApiQuery({ name: 'limit', required: false, example: 10 })
  @ApiResponse({ status: 200, type: MarketHotCommentsDto })
  getMarketHotComments(
    @Query('limit') limit?: number,
  ): Promise<MarketHotCommentsDto> {
    return this.indexService.getMarketHotComments(limit ? +limit : undefined);
  }
}
