// 지표(index) 모듈 — ㅅㅂ지수 / 가즈아지수 계산 + 조회 API를 담당한다.
// StocksModule을 import하여 종목코드 → stockId 변환에 사용.
import { Module } from '@nestjs/common';
import { IndexController, MarketController } from './index.controller';
import { IndexService } from './index.service';
import { StocksModule } from '../stocks/stocks.module';

@Module({
  imports: [StocksModule],
  controllers: [IndexController, MarketController],
  providers: [IndexService],
})
export class IndexModule {}
