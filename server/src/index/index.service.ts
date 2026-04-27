// 지표 계산 서비스 — posts 테이블의 감성분석 결과를 집계하여 ㅅㅂ지수 / 가즈아지수를 산출한다.
//
// 계산 공식 (PLAN.md 참조):
//   좋아요 가중치 = 1 + log10(like_count + 1)
//   ㅅㅂ지수   = sum(BEAR 가중치) / sum(전체 가중치) × 100  (0~100, 높을수록 분노/공포)
//   가즈아지수 = sum(BULL 가중치) / sum(전체 가중치) × 100  (0~100, 높을수록 환희/탐욕)
//
// MVP에서는 30일 정규화 없이 raw 비율을 그대로 사용한다.
// 데이터가 축적되면 index_snapshots의 스냅샷을 활용하고, 30일 min/max 정규화를 적용할 예정.
import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { eq, and, gte, sql, desc } from 'drizzle-orm';
import * as schema from '../database/schema';
import { StocksService } from '../stocks/stocks.service';

// 히스토리 조회 시 period 파라미터 → 일수 변환
const PERIOD_DAYS: Record<string, number> = {
  '7d': 7,
  '30d': 30,
  '90d': 90,
};

// ㅅㅂ지수 레이블 (0~100 구간별)
const SB_LABELS = [
  { max: 20, label: '극도의 평온' },
  { max: 40, label: '평온' },
  { max: 60, label: '보통' },
  { max: 80, label: '불안' },
  { max: 100, label: '극도의 공포' },
];

// 가즈아지수 레이블 (0~100 구간별)
const GAZUA_LABELS = [
  { max: 20, label: '침체' },
  { max: 40, label: '조용' },
  { max: 60, label: '보통' },
  { max: 80, label: '흥분' },
  { max: 100, label: '극도의 환희' },
];

// 지표값 → 한글 레이블 변환
function getLabel(value: number, labels: typeof SB_LABELS): string {
  for (const { max, label } of labels) {
    if (value <= max) return label;
  }
  return labels[labels.length - 1].label;
}

@Injectable()
export class IndexService {
  constructor(
    @Inject('drizzle') private db: NodePgDatabase<typeof schema>,
    private readonly stocksService: StocksService,
  ) {}

  /**
   * posts 테이블에서 실시간으로 ㅅㅂ지수 / 가즈아지수를 계산한다.
   * - 최근 N시간(기본 24시간) 내 감성분석 완료된 글만 대상
   * - 좋아요 가중치: 1 + log10(like_count + 1)
   * - PostgreSQL의 log() = log10 (자연로그는 ln())
   *
   * 반환 예시: { sb: 37.4, gazua: 17.57, totalPosts: 49 }
   */
  async calculateLiveIndex(stockId: number, hours = 24) {
    const since = new Date(Date.now() - hours * 60 * 60 * 1000);

    /**
    /* SELECT
    /* sum(1 + log(greatest(like_count, 0) + 1))  AS "totalWeight",
    /* sum(CASE WHEN sentiment_label = 'BULL' ... END)  AS "bullWeight",
    /* sum(CASE WHEN sentiment_label = 'BEAR' ... END)  AS "bearWeight",
    /* count(*)::text  AS "totalPosts"
    /* FROM posts
    /* WHERE ...
    */
    const result = await this.db
      .select({
        // 전체 글의 가중치 합
        totalWeight: sql<string>`sum(1 + log(greatest(${schema.posts.likeCount}, 0) + 1))`,
        // BULL(상승론자) 글의 가중치 합
        bullWeight: sql<string>`sum(case when ${schema.posts.sentimentLabel} = 'BULL' then 1 + log(greatest(${schema.posts.likeCount}, 0) + 1) else 0 end)`,
        // BEAR(하락론자) 글의 가중치 합
        bearWeight: sql<string>`sum(case when ${schema.posts.sentimentLabel} = 'BEAR' then 1 + log(greatest(${schema.posts.likeCount}, 0) + 1) else 0 end)`,
        totalPosts: sql<string>`count(*)::text`,
      })
      .from(schema.posts)
      .where(
        and(
          eq(schema.posts.stockId, stockId),
          gte(schema.posts.crawledAt, since),
          sql`${schema.posts.sentimentLabel} is not null`, // 감성분석 완료된 글만
        ),
      );

    const row = result[0];
    const totalWeight = Number(row?.totalWeight) || 0;
    const bullWeight = Number(row?.bullWeight) || 0;
    const bearWeight = Number(row?.bearWeight) || 0;
    const totalPosts = Number(row?.totalPosts) || 0;

    // 글이 없으면 0 반환
    if (totalWeight === 0) {
      return { sb: 0, gazua: 0, totalPosts: 0 };
    }

    // 소수점 2자리까지 반올림
    const sb = Math.round((bearWeight / totalWeight) * 100 * 100) / 100;
    const gazua = Math.round((bullWeight / totalWeight) * 100 * 100) / 100;

    return { sb, gazua, totalPosts };
  }

  /**
   * ㅅㅂ지수 현재값 조회 — 최근 24시간 posts 기준 실시간 계산
   *
   * 반환 예시: { code: "005930", name: "삼성전자", indexType: "SB",
   *            value: 37.4, label: "평온", totalPosts: 49, calculatedAt: "2026-04-27T..." }
   */
  async getSbIndex(code: string) {
    const stock = await this.stocksService.findByCode(code);
    if (!stock) throw new NotFoundException(`종목 ${code}을 찾을 수 없습니다`);

    const live = await this.calculateLiveIndex(stock.id);

    return {
      code: stock.code,
      name: stock.name,
      indexType: 'SB',
      value: live.sb,
      label: getLabel(live.sb, SB_LABELS),
      totalPosts: live.totalPosts,
      calculatedAt: new Date().toISOString(),
    };
  }

  /**
   * 가즈아지수 현재값 조회 — 최근 24시간 posts 기준 실시간 계산
   *
   * 반환 예시: { code: "005930", name: "삼성전자", indexType: "GAZUA",
   *            value: 17.57, label: "침체", totalPosts: 49, calculatedAt: "2026-04-27T..." }
   */
  async getGazuaIndex(code: string) {
    const stock = await this.stocksService.findByCode(code);
    if (!stock) throw new NotFoundException(`종목 ${code}을 찾을 수 없습니다`);

    const live = await this.calculateLiveIndex(stock.id);

    return {
      code: stock.code,
      name: stock.name,
      indexType: 'GAZUA',
      value: live.gazua,
      label: getLabel(live.gazua, GAZUA_LABELS),
      totalPosts: live.totalPosts,
      calculatedAt: new Date().toISOString(),
    };
  }

  /**
   * ㅅㅂ지수 히스토리 — period(7d/30d/90d)에 따른 일별 추이
   *
   * 반환 예시: { code: "005930", name: "삼성전자", indexType: "SB", period: "7d",
   *            data: [{ date: "2026-04-27", value: 37.4, totalPosts: 49 }, ...] }
   */
  async getSbHistory(code: string, period = '7d') {
    const stock = await this.stocksService.findByCode(code);
    if (!stock) throw new NotFoundException(`종목 ${code}을 찾을 수 없습니다`);

    return this.getHistory(stock, 'SB', period);
  }

  /**
   * 가즈아지수 히스토리 — period(7d/30d/90d)에 따른 일별 추이
   *
   * 반환 예시: { code: "005930", name: "삼성전자", indexType: "GAZUA", period: "7d",
   *            data: [{ date: "2026-04-27", value: 17.57, totalPosts: 49 }, ...] }
   */
  async getGazuaHistory(code: string, period = '7d') {
    const stock = await this.stocksService.findByCode(code);
    if (!stock) throw new NotFoundException(`종목 ${code}을 찾을 수 없습니다`);

    return this.getHistory(stock, 'GAZUA', period);
  }

  /**
   * 히스토리 조회 — 2가지 전략:
   * 1) index_snapshots에 스냅샷이 있으면 → 그대로 반환 (빠름)
   * 2) 스냅샷이 없으면 → posts에서 일별로 GROUP BY 집계 (느리지만 데이터 축적 전에도 동작)
   */
  private async getHistory(
    stock: { id: number; code: string; name: string },
    indexType: 'SB' | 'GAZUA',
    period: string,
  ) {
    const days = PERIOD_DAYS[period] ?? 7;
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    // 전략 1: index_snapshots에서 조회
    const snapshots = await this.db
      .select({
        value: schema.indexSnapshots.indexValue,
        rawScore: schema.indexSnapshots.rawScore,
        totalPosts: schema.indexSnapshots.totalPosts,
        periodStart: schema.indexSnapshots.periodStart,
        periodEnd: schema.indexSnapshots.periodEnd,
        periodType: schema.indexSnapshots.periodType,
      })
      .from(schema.indexSnapshots)
      .where(
        and(
          eq(schema.indexSnapshots.stockId, stock.id),
          eq(schema.indexSnapshots.indexType, indexType),
          gte(schema.indexSnapshots.periodEnd, since),
        ),
      )
      .orderBy(schema.indexSnapshots.periodEnd);

    if (snapshots.length > 0) {
      return {
        code: stock.code,
        name: stock.name,
        indexType,
        period,
        data: snapshots.map((s) => ({
          value: Number(s.value),
          rawScore: Number(s.rawScore),
          totalPosts: s.totalPosts,
          periodStart: s.periodStart,
          periodEnd: s.periodEnd,
          periodType: s.periodType,
        })),
      };
    }

    // 전략 2: posts에서 일별 집계 (스냅샷 없을 때 fallback)
    // SB면 BEAR 비율, GAZUA면 BULL 비율을 계산
    const targetSentiment = indexType === 'SB' ? 'BEAR' : 'BULL';

    const daily = await this.db
      .select({
        date: sql<string>`date_trunc('day', ${schema.posts.crawledAt} AT TIME ZONE 'Asia/Seoul')::date::text`,
        totalWeight: sql<string>`sum(1 + log(greatest(${schema.posts.likeCount}, 0) + 1))`,
        targetWeight: sql<string>`sum(case when ${schema.posts.sentimentLabel} = ${targetSentiment} then 1 + log(greatest(${schema.posts.likeCount}, 0) + 1) else 0 end)`,
        totalPosts: sql<string>`count(*)::text`,
      })
      .from(schema.posts)
      .where(
        and(
          eq(schema.posts.stockId, stock.id),
          gte(schema.posts.crawledAt, since),
          sql`${schema.posts.sentimentLabel} is not null`,
        ),
      )
      .groupBy(
        sql`date_trunc('day', ${schema.posts.crawledAt} AT TIME ZONE 'Asia/Seoul')`,
      )
      .orderBy(
        sql`date_trunc('day', ${schema.posts.crawledAt} AT TIME ZONE 'Asia/Seoul')`,
      );

    return {
      code: stock.code,
      name: stock.name,
      indexType,
      period,
      data: daily.map((d) => {
        const total = Number(d.totalWeight) || 1;
        const target = Number(d.targetWeight) || 0;
        const value = Math.round((target / total) * 100 * 100) / 100;
        return {
          date: d.date,
          value,
          totalPosts: Number(d.totalPosts),
        };
      }),
    };
  }

  /**
   * stocks 테이블에서 analyzer가 생성한 최신 한줄평을 조회한다.
   *
   * 반환 예시: { code: "005930", name: "삼성전자", summary: "비관론 소폭 우세, 관망 분위기" }
   */
  async getSummary(code: string) {
    const stock = await this.stocksService.findByCode(code);
    if (!stock) throw new NotFoundException(`종목 ${code}을 찾을 수 없습니다`);

    return {
      code: stock.code,
      name: stock.name,
      summary: stock.summary ?? null,
      updatedAt: stock.summaryUpdatedAt ?? null,
    };
  }

  /**
   * market_summary 테이블에서 전체 시장 한줄평을 조회한다.
   *
   * 반환 예시: { summary: "시장 전반 관망세, 뚜렷한 방향 없음", updatedAt: "2026-04-27T..." }
   */
  async getMarketSummary() {
    const [row] = await this.db
      .select()
      .from(schema.marketSummary)
      .orderBy(desc(schema.marketSummary.createdAt))
      .limit(1);

    return {
      summary: row?.summary ?? null,
      createdAt: row?.createdAt ?? null,
    };
  }
}
