// 종목 서비스 — DB에서 종목 정보를 조회하고, 최신 지표/시세를 함께 반환한다.
import { Inject, Injectable } from '@nestjs/common';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { eq, and, gte, sql, desc } from 'drizzle-orm';
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
        const [liveIndex, latestPrice] = await Promise.all([
          this.calculateLiveIndex(stock.id),
          this.getLatestPrice(stock.id),
        ]);

        return {
          ...stock,
          sbIndex: liveIndex.sb,
          gazuaIndex: liveIndex.gazua,
          totalPosts: liveIndex.totalPosts,
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
   * posts에서 최근 24시간 감성분석 결과를 실시간 집계하여 ㅅㅂ/가즈아 지수를 계산한다.
   * IndexService.calculateLiveIndex와 동일한 로직.
   *
   * 반환 예시: { sb: 37.4, gazua: 17.57, totalPosts: 49 }
   */
  private async calculateLiveIndex(stockId: number) {
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const result = await this.db
      .select({
        totalWeight: sql<string>`sum(1 + log(greatest(${schema.posts.likeCount}, 0) + 1))`,
        bullWeight: sql<string>`sum(case when ${schema.posts.sentimentLabel} = 'BULL' then 1 + log(greatest(${schema.posts.likeCount}, 0) + 1) else 0 end)`,
        bearWeight: sql<string>`sum(case when ${schema.posts.sentimentLabel} = 'BEAR' then 1 + log(greatest(${schema.posts.likeCount}, 0) + 1) else 0 end)`,
        totalPosts: sql<string>`count(*)::text`,
      })
      .from(schema.posts)
      .where(
        and(
          eq(schema.posts.stockId, stockId),
          gte(schema.posts.crawledAt, since),
          sql`${schema.posts.sentimentLabel} is not null`,
        ),
      );

    const row = result[0];
    const totalWeight = Number(row?.totalWeight) || 0;
    const bullWeight = Number(row?.bullWeight) || 0;
    const bearWeight = Number(row?.bearWeight) || 0;
    const totalPosts = Number(row?.totalPosts) || 0;

    if (totalWeight === 0) {
      return { sb: 0, gazua: 0, totalPosts: 0 };
    }

    return {
      sb: Math.round((bearWeight / totalWeight) * 100 * 100) / 100,
      gazua: Math.round((bullWeight / totalWeight) * 100 * 100) / 100,
      totalPosts,
    };
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
