// TanStack Query + Theme Provider — 클라이언트 컴포넌트에서 useQuery, 테마 전환을 위해 필요
'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from 'next-themes';
import { useState } from 'react';

export function Providers({ children }: { children: React.ReactNode }) {
  // useState로 QueryClient를 만들어야 서버/클라이언트 간 인스턴스가 공유되지 않음
  const [queryClient] = useState(() => new QueryClient());

  return (
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </ThemeProvider>
  );
}
