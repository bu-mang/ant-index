// 지표 API 컨트롤러 — 종목별 ㅅㅂ지수 / 가즈아지수 현재값 + 히스토리 제공
// 모든 엔드포인트는 /api/stocks/:code 하위에 위치한다.
import { Controller, Get, Param, Query } from '@nestjs/common';
import { IndexService } from './index.service';

@Controller('stocks/:code')
export class IndexController {
  constructor(private readonly indexService: IndexService) {}

  // GET /api/stocks/:code/sb — ㅅㅂ지수 현재값 (최근 24시간 기준 실시간 계산)
  @Get('sb')
  getSbIndex(@Param('code') code: string) {
    return this.indexService.getSbIndex(code);
  }

  // GET /api/stocks/:code/sb/history?period=7d|30d|90d — ㅅㅂ지수 히스토리
  @Get('sb/history')
  getSbHistory(@Param('code') code: string, @Query('period') period?: string) {
    return this.indexService.getSbHistory(code, period);
  }

  // GET /api/stocks/:code/gazua — 가즈아지수 현재값 (최근 24시간 기준 실시간 계산)
  @Get('gazua')
  getGazuaIndex(@Param('code') code: string) {
    return this.indexService.getGazuaIndex(code);
  }

  // GET /api/stocks/:code/gazua/history?period=7d|30d|90d — 가즈아지수 히스토리
  @Get('gazua/history')
  getGazuaHistory(
    @Param('code') code: string,
    @Query('period') period?: string,
  ) {
    return this.indexService.getGazuaHistory(code, period);
  }

  // GET /api/stocks/:code/summary — 종목 한줄평 (analyzer가 DB에 저장한 것 조회)
  @Get('summary')
  getSummary(@Param('code') code: string) {
    return this.indexService.getSummary(code);
  }
}

@Controller('market')
export class MarketController {
  constructor(private readonly indexService: IndexService) {}

  // GET /api/market/summary — 전체 시장 한줄평
  @Get('summary')
  getMarketSummary() {
    return this.indexService.getMarketSummary();
  }
}
