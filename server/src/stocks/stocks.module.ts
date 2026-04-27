// 종목(stocks) 모듈 — 종목 목록 조회 API를 담당한다.
// StocksService를 export하여 IndexModule 등 다른 모듈에서도 종목 조회 가능.
import { Module } from '@nestjs/common';
import { StocksController } from './stocks.controller';
import { StocksService } from './stocks.service';

@Module({
  controllers: [StocksController],
  providers: [StocksService],
  exports: [StocksService],
})
export class StocksModule {}
