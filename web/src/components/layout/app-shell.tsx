// 공통 레이아웃 셸 — Header·Sidebar·Footer를 한 번만 마운트하여 페이지 전환 시 깜빡임 방지
"use client";

import { Header } from "./header";
import { Sidebar } from "./sidebar";
import { Footer } from "./footer";
import { useStocks } from "@/lib/queries";

export function AppShell({ children }: { children: React.ReactNode }) {
  const { data: stocks } = useStocks();

  return (
    <>
      <Header />
      {children}
      <Footer />
      <Sidebar stocks={stocks ?? []} />
    </>
  );
}
