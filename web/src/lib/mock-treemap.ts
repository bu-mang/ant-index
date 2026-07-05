// 트리맵 더미 데이터 — 백엔드 없이 UI를 완성하기 위한 mock.
// 2단계(서버)에서 실제 /api/market/treemap 으로 치환한다.
// marketCap: KR=억원, US=USD(백만 달러) — 같은 시장 뷰 안에서만 상대 비교하므로 단위 혼용 무방.
import { getLabel, ANT_INDEX_LABELS } from "./constants";
import type { MarketParam, TreemapResponse, TreemapStock } from "./api";

type Seed = Omit<TreemapStock, "label"> & { label?: string };

function withLabels(seeds: Seed[]): TreemapStock[] {
  return seeds
    .map((s) => ({ ...s, label: getLabel(s.antIndex, ANT_INDEX_LABELS) }))
    .sort((a, b) => (b.marketCap ?? 0) - (a.marketCap ?? 0));
}

// ─── 국장 (KR) ─── marketCap 단위: 억원
const KR_SEEDS: Seed[] = [
  { code: "005930", name: "삼성전자", market: "KOSPI", sector: "반도체", marketCap: 4_200_000, currentPrice: 71800, changeRate: 1.27, antIndex: 68, totalPosts: 412 },
  { code: "000660", name: "SK하이닉스", market: "KOSPI", sector: "반도체", marketCap: 1_650_000, currentPrice: 218000, changeRate: 3.41, antIndex: 79, totalPosts: 388 },
  { code: "042700", name: "한미반도체", market: "KOSPI", sector: "반도체", marketCap: 98_000, currentPrice: 101200, changeRate: -2.14, antIndex: 44, totalPosts: 96 },
  { code: "373220", name: "LG에너지솔루션", market: "KOSPI", sector: "2차전지", marketCap: 890_000, currentPrice: 381000, changeRate: -1.83, antIndex: 31, totalPosts: 274 },
  { code: "006400", name: "삼성SDI", market: "KOSPI", sector: "2차전지", marketCap: 210_000, currentPrice: 305000, changeRate: -3.62, antIndex: 18, totalPosts: 201 },
  { code: "247540", name: "에코프로비엠", market: "KOSDAQ", sector: "2차전지", marketCap: 138_000, currentPrice: 141500, changeRate: -0.7, antIndex: 37, totalPosts: 233 },
  { code: "005380", name: "현대차", market: "KOSPI", sector: "자동차", marketCap: 520_000, currentPrice: 248000, changeRate: 0.81, antIndex: 58, totalPosts: 147 },
  { code: "000270", name: "기아", market: "KOSPI", sector: "자동차", marketCap: 415_000, currentPrice: 104300, changeRate: 1.06, antIndex: 61, totalPosts: 122 },
  { code: "051910", name: "LG화학", market: "KOSPI", sector: "화학", marketCap: 235_000, currentPrice: 332500, changeRate: -2.41, antIndex: 26, totalPosts: 118 },
  { code: "207940", name: "삼성바이오로직스", market: "KOSPI", sector: "바이오", marketCap: 720_000, currentPrice: 1012000, changeRate: 2.13, antIndex: 72, totalPosts: 89 },
  { code: "068270", name: "셀트리온", market: "KOSPI", sector: "바이오", marketCap: 380_000, currentPrice: 178900, changeRate: 0.34, antIndex: 53, totalPosts: 141 },
  { code: "035420", name: "NAVER", market: "KOSPI", sector: "인터넷", marketCap: 290_000, currentPrice: 182000, changeRate: 4.02, antIndex: 83, totalPosts: 264 },
  { code: "035720", name: "카카오", market: "KOSPI", sector: "인터넷", marketCap: 175_000, currentPrice: 39250, changeRate: -4.88, antIndex: 12, totalPosts: 356 },
  { code: "105560", name: "KB금융", market: "KOSPI", sector: "금융", marketCap: 330_000, currentPrice: 82100, changeRate: 0.98, antIndex: 60, totalPosts: 74 },
  { code: "055550", name: "신한지주", market: "KOSPI", sector: "금융", marketCap: 260_000, currentPrice: 51600, changeRate: 0.19, antIndex: 51, totalPosts: 63 },
  { code: "012450", name: "한화에어로스페이스", market: "KOSPI", sector: "방산", marketCap: 145_000, currentPrice: 312000, changeRate: 5.61, antIndex: 88, totalPosts: 198 },
  { code: "042660", name: "한화오션", market: "KOSPI", sector: "방산", marketCap: 92_000, currentPrice: 78400, changeRate: 2.77, antIndex: 74, totalPosts: 112 },
  { code: "015760", name: "한국전력", market: "KOSPI", sector: "전력", marketCap: 155_000, currentPrice: 24100, changeRate: -0.41, antIndex: 47, totalPosts: 58 },
  { code: "329180", name: "HD현대중공업", market: "KOSPI", sector: "조선", marketCap: 168_000, currentPrice: 189500, changeRate: 3.19, antIndex: 76, totalPosts: 134 },
  { code: "196170", name: "알테오젠", market: "KOSDAQ", sector: "바이오", marketCap: 87_000, currentPrice: 164200, changeRate: -1.12, antIndex: 41, totalPosts: 107 },
  { code: "086520", name: "에코프로", market: "KOSDAQ", sector: "2차전지", marketCap: 76_000, currentPrice: 57300, changeRate: -5.4, antIndex: 9, totalPosts: 289 },
  { code: "091990", name: "셀트리온헬스케어", market: "KOSDAQ", sector: "바이오", marketCap: 54_000, currentPrice: 71800, changeRate: 0.56, antIndex: 55, totalPosts: 44 },
  { code: "263750", name: "펄어비스", market: "KOSDAQ", sector: "게임", marketCap: 28_000, currentPrice: 44200, changeRate: 6.73, antIndex: 91, totalPosts: 176 },
  { code: "251270", name: "넷마블", market: "KOSPI", sector: "게임", marketCap: 48_000, currentPrice: 56100, changeRate: -0.89, antIndex: 43, totalPosts: 61 },
];

// ─── 미장 (US) ─── marketCap 단위: USD 백만 달러
const US_SEEDS: Seed[] = [
  { code: "NVDA", name: "엔비디아", market: "NASDAQ", sector: "반도체", marketCap: 3_120_000, currentPrice: 138.4, changeRate: 3.88, antIndex: 84, totalPosts: 521 },
  { code: "AAPL", name: "애플", market: "NASDAQ", sector: "IT하드웨어", marketCap: 3_050_000, currentPrice: 308.63, changeRate: 4.84, antIndex: 81, totalPosts: 498 },
  { code: "MSFT", name: "마이크로소프트", market: "NASDAQ", sector: "소프트웨어", marketCap: 3_100_000, currentPrice: 442.1, changeRate: 1.12, antIndex: 66, totalPosts: 342 },
  { code: "GOOGL", name: "알파벳", market: "NASDAQ", sector: "인터넷", marketCap: 2_100_000, currentPrice: 174.5, changeRate: 0.44, antIndex: 57, totalPosts: 288 },
  { code: "AMZN", name: "아마존", market: "NASDAQ", sector: "인터넷", marketCap: 1_800_000, currentPrice: 186.2, changeRate: -1.34, antIndex: 39, totalPosts: 301 },
  { code: "META", name: "메타", market: "NASDAQ", sector: "인터넷", marketCap: 1_300_000, currentPrice: 512.8, changeRate: 2.61, antIndex: 71, totalPosts: 267 },
  { code: "TSLA", name: "테슬라", market: "NASDAQ", sector: "자동차", marketCap: 681_000, currentPrice: 214.6, changeRate: -6.12, antIndex: 14, totalPosts: 612 },
  { code: "AVGO", name: "브로드컴", market: "NASDAQ", sector: "반도체", marketCap: 743_000, currentPrice: 168.9, changeRate: 2.97, antIndex: 73, totalPosts: 154 },
  { code: "AMD", name: "AMD", market: "NASDAQ", sector: "반도체", marketCap: 243_000, currentPrice: 148.3, changeRate: -3.41, antIndex: 33, totalPosts: 276 },
  { code: "TSM", name: "TSMC", market: "NYSE", sector: "반도체", marketCap: 877_000, currentPrice: 172.4, changeRate: 1.88, antIndex: 69, totalPosts: 143 },
  { code: "JPM", name: "JP모건", market: "NYSE", sector: "금융", marketCap: 624_000, currentPrice: 218.7, changeRate: 0.62, antIndex: 56, totalPosts: 78 },
  { code: "V", name: "비자", market: "NYSE", sector: "금융", marketCap: 522_000, currentPrice: 279.1, changeRate: 0.27, antIndex: 52, totalPosts: 51 },
  { code: "MA", name: "마스터카드", market: "NYSE", sector: "금융", marketCap: 433_000, currentPrice: 468.3, changeRate: -0.71, antIndex: 46, totalPosts: 43 },
  { code: "LLY", name: "일라이릴리", market: "NYSE", sector: "바이오", marketCap: 856_000, currentPrice: 912.5, changeRate: 1.44, antIndex: 64, totalPosts: 97 },
  { code: "NVO", name: "노보노디스크", market: "NYSE", sector: "바이오", marketCap: 598_000, currentPrice: 138.2, changeRate: -2.03, antIndex: 38, totalPosts: 88 },
  { code: "MRK", name: "머크", market: "NYSE", sector: "바이오", marketCap: 295_000, currentPrice: 116.4, changeRate: 0.11, antIndex: 50, totalPosts: 34 },
  { code: "COST", name: "코스트코", market: "NASDAQ", sector: "소비재", marketCap: 396_000, currentPrice: 892.6, changeRate: 1.03, antIndex: 62, totalPosts: 56 },
  { code: "WMT", name: "월마트", market: "NYSE", sector: "소비재", marketCap: 612_000, currentPrice: 78.9, changeRate: 0.58, antIndex: 59, totalPosts: 47 },
  { code: "KO", name: "코카콜라", market: "NYSE", sector: "소비재", marketCap: 305_000, currentPrice: 71.2, changeRate: -0.22, antIndex: 49, totalPosts: 29 },
  { code: "NFLX", name: "넷플릭스", market: "NASDAQ", sector: "소프트웨어", marketCap: 295_000, currentPrice: 712.4, changeRate: 4.31, antIndex: 82, totalPosts: 211 },
  { code: "ORCL", name: "오라클", market: "NYSE", sector: "소프트웨어", marketCap: 383_000, currentPrice: 141.8, changeRate: 2.14, antIndex: 67, totalPosts: 73 },
  { code: "CRM", name: "세일즈포스", market: "NYSE", sector: "소프트웨어", marketCap: 257_000, currentPrice: 267.3, changeRate: -1.77, antIndex: 40, totalPosts: 62 },
  { code: "XOM", name: "엑슨모빌", market: "NYSE", sector: "에너지", marketCap: 528_000, currentPrice: 118.6, changeRate: 1.91, antIndex: 65, totalPosts: 54 },
  { code: "CVX", name: "쉐브론", market: "NYSE", sector: "에너지", marketCap: 269_000, currentPrice: 152.3, changeRate: 0.83, antIndex: 54, totalPosts: 41 },
];

const MOCK: Record<MarketParam, TreemapStock[]> = {
  KR: withLabels(KR_SEEDS),
  US: withLabels(US_SEEDS),
};

export function getMockTreemap(market: MarketParam): TreemapResponse {
  return {
    market,
    updatedAt: new Date().toISOString(),
    stocks: MOCK[market],
  };
}
