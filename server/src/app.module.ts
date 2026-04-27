import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DatabaseModule } from './database/database.module';
import { StocksModule } from './stocks/stocks.module';
import { IndexModule } from './index/index.module';

@Module({
  imports: [DatabaseModule, StocksModule, IndexModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
