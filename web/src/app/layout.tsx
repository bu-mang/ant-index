import type { Metadata } from "next";
import "./globals.css";
import "katex/dist/katex.min.css";
import { Providers } from "./providers";
import { AppShell } from "@/components/layout/app-shell";

export const metadata: Metadata = {
  title: "개미지표 — 주식 커뮤니티 감성 지표",
  description:
    "한국 주식 커뮤니티의 감성을 분석하여 시장 심리를 보여주는 대시보드",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className={`h-full antialiased`} suppressHydrationWarning>
      <body className="min-h-full bg-background text-foreground">
        <Providers>
          <AppShell>{children}</AppShell>
        </Providers>
      </body>
    </html>
  );
}
