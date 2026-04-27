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
  currentPrice: number | null;
  changeRate: number | null;
}

export interface IndexResult {
  code: string;
  name: string;
  indexType: 'SB' | 'GAZUA';
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
  indexType: 'SB' | 'GAZUA';
  period: string;
  data: HistoryDataPoint[];
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
};
