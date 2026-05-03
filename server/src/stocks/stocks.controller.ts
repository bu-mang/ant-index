// 종목 API 컨트롤러
// GET /api/stocks — 활성 종목 목록 (최신 지표값 + 시세 포함)
import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { StocksService } from './stocks.service';
import { StockResponseDto } from './dto/stock-response.dto';

@ApiTags('종목')
@Controller('stocks')
export class StocksController {
  constructor(private readonly stocksService: StocksService) {}

  @Get()
  @ApiOperation({
    summary: '활성 종목 목록 조회',
    description: '최신 지표값 + 시세 포함',
  })
  @ApiResponse({ status: 200, type: [StockResponseDto] })
  getStocks(): Promise<StockResponseDto[]> {
    return this.stocksService.getActiveStocks();
  }
}
