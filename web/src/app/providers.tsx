// TanStack Query + Theme Provider — 클라이언트 컴포넌트에서 useQuery, 테마 전환을 위해 필요
'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from 'next-themes';
import { useState } from 'react';

export function Providers({ children }: { children: React.ReactNode }) {
  // useState로 QueryClient를 만들어야 서버/클라이언트 간 인스턴스가 공유되지 않음.
  // refetchInterval = 1분 → 사용자가 페이지 떠 있는 동안 모든 쿼리가 자동 폴링.
  // (탭 비활성 시 자동 일시정지, 포커스 복귀 시 즉시 재패치 — TanStack 기본 동작)
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            refetchInterval: 60_000,
          },
        },
      }),
  );

  return (
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </ThemeProvider>
  );
}
