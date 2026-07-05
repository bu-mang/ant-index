// 공통 레이아웃 셸 — Header·Footer를 한 번만 마운트하여 페이지 전환 시 깜빡임 방지.
// (사이드바 종목 리스트는 트리맵이 대체하여 보류 — Sidebar/StockTable 파일은 유지)
"use client";

import { Header } from "./header";
import { Footer } from "./footer";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Header />
      {children}
      <Footer />
    </>
  );
}
