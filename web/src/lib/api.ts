// NestJS 백엔드 API 호출 래퍼
const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

export async function fetchApi<T>(path: string): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`);
  if (!res.ok) {
    throw new Error(`API error: ${res.status} ${res.statusText}`);
  }
  return res.json();
}

// ─── 타입 정의 ───

export interface Stock {
  id: number;
  code: string;
  name: string;
  market: string;
  sector: string | null;
  isActive: boolean;
  sbIndex: number | null;
  gazuaIndex: number | null;
  antIndex: number | null;
  totalPosts: number | null;
  currentPrice: number | null;
  changeRate: number | null;
}

export interface IndexResult {
  code: string;
  name: string;
  indexType: 'SB' | 'GAZUA' | 'FEAR_GREED';
  value: number;
  label: string;
  totalPosts: number;
  calculatedAt: string;
}

export interface HistoryDataPoint {
  date: string;
  value: number;
  totalPosts: number;
}

export interface IndexHistory {
  code: string;
  name: string;
  indexType: 'SB' | 'GAZUA' | 'FEAR_GREED';
  period: string;
  data: HistoryDataPoint[];
}

export interface MarketIndexHistory {
  indexType: 'FEAR_GREED';
  period: string;
  data: HistoryDataPoint[];
}

export interface PriceDetail {
  code: string;
  name: string;
  currentPrice: number | null;
  changeRate: number | null;
  volume: number | null;
  marketCap: number | null;
  per: number | null;
  pbr: number | null;
  dividendYield: number | null;
  high52w: number | null;
  low52w: number | null;
}

export interface HotCommentItem {
  maskedContent: string;
  sentimentLabel: 'BULL' | 'BEAR' | 'NEUTRAL';
  likeBucket: string;
  postedAt: string;
}

export interface HotCommentsResponse {
  code: string;
  name: string;
  comments: HotCommentItem[];
}

export interface StockStats {
  code: string;
  name: string;
  totalPosts: number;
  bullPercent: number;
  bearPercent: number;
  neutralPercent: number;
  postChangeRate: number | null;
}

export interface SummaryResult {
  code: string;
  name: string;
  summary: string;
}

// ─── API 함수 ───

export const api = {
  getStocks: () => fetchApi<Stock[]>('/stocks'),
  getSbIndex: (code: string) => fetchApi<IndexResult>(`/stocks/${code}/sb`),
  getGazuaIndex: (code: string) => fetchApi<IndexResult>(`/stocks/${code}/gazua`),
  getSbHistory: (code: string, period = '7d') =>
    fetchApi<IndexHistory>(`/stocks/${code}/sb/history?period=${period}`),
  getGazuaHistory: (code: string, period = '7d') =>
    fetchApi<IndexHistory>(`/stocks/${code}/gazua/history?period=${period}`),
  getAntIndex: (code: string) =>
    fetchApi<IndexResult>(`/stocks/${code}/ant-index`),
  getAntIndexHistory: (code: string, period = '7d') =>
    fetchApi<IndexHistory>(`/stocks/${code}/ant-index/history?period=${period}`),
  getPriceDetail: (code: string) =>
    fetchApi<PriceDetail>(`/stocks/${code}/price`),
  getHotComments: (code: string) =>
    fetchApi<HotCommentsResponse>(`/stocks/${code}/hot-comments`),
  getStats: (code: string) =>
    fetchApi<StockStats>(`/stocks/${code}/stats`),
  getSummary: (code: string) =>
    fetchApi<SummaryResult>(`/stocks/${code}/summary`),
  getMarketSummary: () =>
    fetchApi<{ summary: string | null; createdAt: string | null }>('/market/summary'),
  getMarketAntIndexHistory: (period = '7d') =>
    fetchApi<MarketIndexHistory>(`/market/ant-index/history?period=${period}`),
};
