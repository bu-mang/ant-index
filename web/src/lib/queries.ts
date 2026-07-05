// TanStack Query hooks — 5분 간격 자동 새로고침
"use client";

import { useQuery } from "@tanstack/react-query";
import { api, type MarketParam } from "./api";
import { getMockTreemap } from "./mock-treemap";

const STALE_TIME = 1 * 60 * 1000; // 5분

// 트리맵: 백엔드 엔드포인트가 준비되면 false 로 바꿔 실 API 로 전환.
const USE_MOCK_TREEMAP = true;

export function useStocks() {
  return useQuery({
    queryKey: ["stocks"],
    queryFn: api.getStocks,
    staleTime: STALE_TIME,
  });
}

export function useSbIndex(code: string) {
  return useQuery({
    queryKey: ["sb", code],
    queryFn: () => api.getSbIndex(code),
    staleTime: STALE_TIME,
    enabled: !!code,
  });
}

export function useGazuaIndex(code: string) {
  return useQuery({
    queryKey: ["gazua", code],
    queryFn: () => api.getGazuaIndex(code),
    staleTime: STALE_TIME,
    enabled: !!code,
  });
}

export function useSbHistory(code: string, period = "7d") {
  return useQuery({
    queryKey: ["sb-history", code, period],
    queryFn: () => api.getSbHistory(code, period),
    staleTime: STALE_TIME,
    enabled: !!code,
  });
}

export function useGazuaHistory(code: string, period = "7d") {
  return useQuery({
    queryKey: ["gazua-history", code, period],
    queryFn: () => api.getGazuaHistory(code, period),
    staleTime: STALE_TIME,
    enabled: !!code,
  });
}

export function useAntIndex(code: string) {
  return useQuery({
    queryKey: ["ant-index", code],
    queryFn: () => api.getAntIndex(code),
    staleTime: STALE_TIME,
    enabled: !!code,
  });
}

export function useAntIndexHistory(code: string, period = "7d") {
  return useQuery({
    queryKey: ["ant-index-history", code, period],
    queryFn: () => api.getAntIndexHistory(code, period),
    staleTime: STALE_TIME,
    enabled: !!code,
  });
}

export function usePriceDetail(code: string) {
  return useQuery({
    queryKey: ["price-detail", code],
    queryFn: () => api.getPriceDetail(code),
    staleTime: STALE_TIME,
    enabled: !!code,
  });
}

export function useHotComments(code: string) {
  return useQuery({
    queryKey: ["hot-comments", code],
    queryFn: () => api.getHotComments(code),
    staleTime: STALE_TIME,
    enabled: !!code,
  });
}

export function useStats(code: string) {
  return useQuery({
    queryKey: ["stats", code],
    queryFn: () => api.getStats(code),
    staleTime: STALE_TIME,
    enabled: !!code,
  });
}

export function useSummary(code: string) {
  return useQuery({
    queryKey: ["summary", code],
    queryFn: () => api.getSummary(code),
    staleTime: STALE_TIME,
    enabled: !!code,
  });
}

export function useMarketAntIndexHistory(period = "7d") {
  return useQuery({
    queryKey: ["market-ant-index-history", period],
    queryFn: () => api.getMarketAntIndexHistory(period),
    staleTime: STALE_TIME,
  });
}

export function useMarketSummary() {
  return useQuery({
    queryKey: ["market-summary"],
    queryFn: api.getMarketSummary,
    staleTime: STALE_TIME,
  });
}

export function useMarketHotComments(limit = 10) {
  return useQuery({
    queryKey: ["market-hot-comments", limit],
    queryFn: () => api.getMarketHotComments(limit),
    staleTime: STALE_TIME,
  });
}

export function useTreemap(market: MarketParam) {
  return useQuery({
    queryKey: ["treemap", market, USE_MOCK_TREEMAP],
    queryFn: () =>
      USE_MOCK_TREEMAP
        ? Promise.resolve(getMockTreemap(market))
        : api.getTreemap(market),
    staleTime: STALE_TIME,
  });
}
