// 종목 서비스 — DB에서 종목 정보를 조회하고, 최신 지표/시세를 함께 반환한다.
import { Inject, Injectable } from '@nestjs/common';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { eq, desc, and } from 'drizzle-orm';
import * as schema from '../database/schema';

@Injectable()
export class StocksService {
  constructor(@Inject('drizzle') private db: NodePgDatabase<typeof schema>) {}

  /**
   * 활성 종목 전체를 조회하면서, 각 종목의 최신 SB/GAZUA 지표 + 시세를 병렬로 가져온다.
   * 프론트엔드 종목 리스트 테이블에 사용됨.
   *
   * @returns {Array<{
   *   id: number,
   *   code: string,           // "005930"
   *   name: string,           // "삼성전자"
   *   market: string,         // "KOSPI"
   *   sector: string | null,  // "반도체"
   *   isActive: boolean,
   *   sbIndex: number | null,      // 최신 ㅅㅂ지수 (0~100), 스냅샷 없으면 null
   *   gazuaIndex: number | null,   // 최신 가즈아지수 (0~100), 스냅샷 없으면 null
   *   currentPrice: number | null, // 현재가 (원), 시세 데이터 없으면 null
   *   changeRate: number | null,   // 등락률 (%), 시세 데이터 없으면 null
   * }>}
   */
  async getActiveStocks() {
    const stockList = await this.db
      .select({
        id: schema.stocks.id,
        code: schema.stocks.code,
        name: schema.stocks.name,
        market: schema.stocks.market,
        sector: schema.stocks.sector,
        isActive: schema.stocks.isActive,
      })
      .from(schema.stocks)
      .where(eq(schema.stocks.isActive, true))
      .orderBy(schema.stocks.id);

    // 종목 수만큼 Promise.all로 병렬 조회 — 순차보다 훨씬 빠름
    const results = await Promise.all(
      stockList.map(async (stock) => {
        const [latestSb, latestGazua, latestPrice] = await Promise.all([
          this.getLatestIndex(stock.id, 'SB'),
          this.getLatestIndex(stock.id, 'GAZUA'),
          this.getLatestPrice(stock.id),
        ]);

        return {
          ...stock,
          sbIndex: latestSb?.indexValue ? Number(latestSb.indexValue) : null,
          gazuaIndex: latestGazua?.indexValue
            ? Number(latestGazua.indexValue)
            : null,
          currentPrice: latestPrice?.currentPrice ?? null,
          changeRate: latestPrice?.changeRate
            ? Number(latestPrice.changeRate)
            : null,
        };
      }),
    );

    return results;
  }

  /**
   * 종목코드로 단일 종목 조회 — IndexService에서 지표 계산 전 종목 존재 확인용
   *
   * 반환 예시: { id: 1, code: "005930", name: "삼성전자", market: "KOSPI", ... } | null
   */
  async findByCode(code: string) {
    const [stock] = await this.db
      .select()
      .from(schema.stocks)
      .where(eq(schema.stocks.code, code))
      .limit(1);

    return stock ?? null;
  }

  /**
   * index_snapshots에서 해당 종목의 최신 지표 스냅샷 1개를 가져온다.
   * 아직 스냅샷이 쌓이지 않았으면 null 반환.
   *
   * 반환 예시: { indexValue: "37.40", rawScore: "0.3740", totalPosts: 49, periodEnd: Date } | null
   */
  private async getLatestIndex(stockId: number, indexType: 'SB' | 'GAZUA') {
    const [row] = await this.db
      .select({
        indexValue: schema.indexSnapshots.indexValue,
        rawScore: schema.indexSnapshots.rawScore,
        totalPosts: schema.indexSnapshots.totalPosts,
        periodEnd: schema.indexSnapshots.periodEnd,
      })
      .from(schema.indexSnapshots)
      .where(
        and(
          eq(schema.indexSnapshots.stockId, stockId),
          eq(schema.indexSnapshots.indexType, indexType),
        ),
      )
      .orderBy(desc(schema.indexSnapshots.periodEnd))
      .limit(1);

    return row ?? null;
  }

  /**
   * stock_prices에서 해당 종목의 최신 시세를 가져온다.
   * 아직 시세 데이터가 없으면 null 반환.
   *
   * 반환 예시: { currentPrice: 67300, changeRate: "-2.10" } | null
   */
  private async getLatestPrice(stockId: number) {
    const [row] = await this.db
      .select({
        currentPrice: schema.stockPrices.currentPrice,
        changeRate: schema.stockPrices.changeRate,
      })
      .from(schema.stockPrices)
      .where(eq(schema.stockPrices.stockId, stockId))
      .orderBy(desc(schema.stockPrices.updatedAt))
      .limit(1);

    return row ?? null;
  }
}
