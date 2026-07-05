// 메인 — 민심 히트맵 트리맵 (시총 크기 × 개미지표 색상)
"use client";

import { TreemapView } from "@/components/treemap/treemap-view";
import { DisclaimerSection } from "@/components/landing/disclaimer-section";

export default function HomePage() {
  return (
    <main className="pt-14 min-h-screen">
      <div className="max-w-432 mx-auto px-4 sm:px-8 py-6 space-y-10">
        <TreemapView />
        <DisclaimerSection />
      </div>
    </main>
  );
}
