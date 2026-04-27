// 종목 API 컨트롤러
// GET /api/stocks — 활성 종목 목록 (최신 지표값 + 시세 포함)
import { Controller, Get } from '@nestjs/common';
import { StocksService } from './stocks.service';

@Controller('stocks')
export class StocksController {
  constructor(private readonly stocksService: StocksService) {}

  // 현재 조회 허용된 종목들 불러오기 (내부용)
  @Get()
  getStocks() {
    return this.stocksService.getActiveStocks();
  }
}
