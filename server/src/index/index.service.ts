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

// 통합 개미지표 레이블 (0=돔황챠, 100=가즈아)
const ANT_INDEX_LABELS = [
  { max: 20, label: '돔황챠' },
  { max: 40, label: '불안' },
  { max: 60, label: '중립' },
  { max: 80, label: '기대' },
  { max: 100, label: '가즈아' },
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
   * ㅅㅂ지수 현재값 조회 — 최근 24시간 posts 기준 실시간 계산
   *
   * 반환 예시: { code: "005930", name: "삼성전자", indexType: "SB",
   *            value: 37.4, label: "평온", totalPosts: 49, calculatedAt: "2026-04-27T..." }
   */
  async getSbIndex(code: string) {
    const stock = await this.stocksService.findByCode(code);
    if (!stock) throw new NotFoundException(`종목 ${code}을 찾을 수 없습니다`);

    const live = await this.stocksService.calculateLiveIndex(stock.id);

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

    const live = await this.stocksService.calculateLiveIndex(stock.id);

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
      // 스냅샷을 일별로 그룹핑 (같은 날 여러 스냅샷 → 마지막 값 사용)
      const byDate = new Map<string, (typeof snapshots)[number]>();
      for (const s of snapshots) {
        const date = new Date(s.periodEnd).toLocaleDateString('sv-SE', {
          timeZone: 'Asia/Seoul',
        }); // "2026-04-28"
        byDate.set(date, s);
      }

      return {
        code: stock.code,
        name: stock.name,
        indexType,
        period,
        data: Array.from(byDate.entries())
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([date, s]) => ({
            date,
            value: Number(s.value),
            totalPosts: s.totalPosts,
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
   * 통합 개미지표 현재값 — bullWeight / (bullWeight + bearWeight) * 100
   * 0 = 극돔황챠(극도의 공포), 100 = 극가즈아(극도의 탐욕)
   */
  async getAntIndex(code: string) {
    const stock = await this.stocksService.findByCode(code);
    if (!stock) throw new NotFoundException(`종목 ${code}을 찾을 수 없습니다`);

    const live = await this.stocksService.calculateLiveIndex(stock.id);

    return {
      code: stock.code,
      name: stock.name,
      indexType: 'FEAR_GREED',
      value: live.antIndex,
      label: getLabel(live.antIndex, ANT_INDEX_LABELS),
      totalPosts: live.totalPosts,
      calculatedAt: new Date().toISOString(),
    };
  }

  /**
   * 통합 개미지표 히스토리 — 일별 bull/(bull+bear)*100
   */
  async getAntIndexHistory(code: string, period = '7d') {
    const stock = await this.stocksService.findByCode(code);
    if (!stock) throw new NotFoundException(`종목 ${code}을 찾을 수 없습니다`);

    const days = PERIOD_DAYS[period] ?? 7;
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const daily = await this.db
      .select({
        date: sql<string>`date_trunc('day', ${schema.posts.crawledAt} AT TIME ZONE 'Asia/Seoul')::date::text`,
        bullWeight: sql<string>`sum(case when ${schema.posts.sentimentLabel} = 'BULL' then 1 + log(greatest(${schema.posts.likeCount}, 0) + 1) else 0 end)`,
        bearWeight: sql<string>`sum(case when ${schema.posts.sentimentLabel} = 'BEAR' then 1 + log(greatest(${schema.posts.likeCount}, 0) + 1) else 0 end)`,
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
      indexType: 'FEAR_GREED',
      period,
      data: daily.map((d) => {
        const bull = Number(d.bullWeight) || 0;
        const bear = Number(d.bearWeight) || 0;
        const sum = bull + bear;
        const value =
          sum === 0 ? 50 : Math.round((bull / sum) * 100 * 100) / 100;
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
