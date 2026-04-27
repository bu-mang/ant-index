// TanStack Query hooks — 5분 간격 자동 새로고침
'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from './api';

const STALE_TIME = 5 * 60 * 1000; // 5분

export function useStocks() {
  return useQuery({
    queryKey: ['stocks'],
    queryFn: api.getStocks,
    staleTime: STALE_TIME,
  });
}

export function useSbIndex(code: string) {
  return useQuery({
    queryKey: ['sb', code],
    queryFn: () => api.getSbIndex(code),
    staleTime: STALE_TIME,
    enabled: !!code,
  });
}

export function useGazuaIndex(code: string) {
  return useQuery({
    queryKey: ['gazua', code],
    queryFn: () => api.getGazuaIndex(code),
    staleTime: STALE_TIME,
    enabled: !!code,
  });
}

export function useSbHistory(code: string, period = '7d') {
  return useQuery({
    queryKey: ['sb-history', code, period],
    queryFn: () => api.getSbHistory(code, period),
    staleTime: STALE_TIME,
    enabled: !!code,
  });
}

export function useGazuaHistory(code: string, period = '7d') {
  return useQuery({
    queryKey: ['gazua-history', code, period],
    queryFn: () => api.getGazuaHistory(code, period),
    staleTime: STALE_TIME,
    enabled: !!code,
  });
}
