import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import Link from 'next/link';
import './globals.css';
import { Providers } from './providers';
import { ThemeToggle } from '@/components/theme-toggle';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: '개미지표 — 주식 커뮤니티 감성 지표',
  description:
    '한국 주식 커뮤니티의 감성을 분석하여 시장 심리를 보여주는 대시보드',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ko"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <Providers>
          {/* 헤더 */}
          <header className="border-b border-border">
            <nav className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
              <Link href="/" className="text-lg font-bold tracking-tight">
                개미지표
              </Link>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <Link href="/" className="hover:text-foreground transition">
                  대시보드
                </Link>
                <ThemeToggle />
              </div>
            </nav>
          </header>

          {/* 메인 콘텐츠 */}
          <main className="flex-1 max-w-7xl mx-auto w-full px-4 py-6">
            {children}
          </main>
        </Providers>
      </body>
    </html>
  );
}
