"use client";

import Image from "next/image";
import { Globe } from "lucide-react";
import { PixelAnt } from "@/components/icons/pixel-ant";

export function Footer() {
  return (
    <footer className="lg:mr-108">
      <div className="max-w-432 mx-auto px-12">
        <div
          className="h-px w-full opacity-20"
          style={{
            background:
              "linear-gradient(to right, var(--foreground) 0%, transparent 100%)",
          }}
        />

        <div className="flex items-start justify-between pt-5 pb-10">
          {/* 좌변: 로고 + 면책 */}
          <div className="space-y-3 flex gap-6">
            <div className="flex items-center gap-2 opacity-50">
              <PixelAnt frame={0} direction={1} className="size-5" />
              <span
                className="text-base text-foreground"
                style={{ fontFamily: '"Mbc1961", sans-serif' }}
              >
                개미지표
              </span>
            </div>
            <p className="text-xs whitespace-pre-wrap text-muted-foreground/60 max-w-100 leading-relaxed break-keep">
              {
                "본 지표는 커뮤니티 감성 분석 결과를 시각화한 것으로, 투자 판단의 근거로\n사용할 수 없습니다. 투자에 대한 책임은 본인에게 있습니다."
              }
            </p>
          </div>

          {/* 우변: 링크 + 저작권 */}
          <div className="flex flex-col items-end gap-2 pt-1">
            <div className="flex items-center gap-3">
              <a
                href="https://github.com/bu-mang/ant-index"
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground/50 hover:text-foreground transition-colors"
              >
                <Image src="/icons/github.svg" alt="GitHub" width={16} height={16} className="size-4 dark:invert" />
              </a>
              <a
                href="https://bumang.xyz"
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground/50 hover:text-foreground transition-colors"
              >
                <Globe className="size-4" />
              </a>
            </div>
            <span className="text-[10px] text-muted-foreground/40">
              © 2026 Copyright by bumang
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
