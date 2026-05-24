"use client";

import { Accordion } from "@base-ui/react/accordion";
import { ChevronDown } from "lucide-react";

const QA = [
  {
    q: "사이드바의 종목 시세는 얼마나 자주 갱신되나요?",
    a: "백엔드가 2 분 주기로 네이버 증권에서 시세를 수집하고, 프론트엔드는 페이지가 열려 있는 동안 1 분마다 자동 재요청합니다. 탭을 다른 데 두면 폴링이 멈췄다가 돌아왔을 때 즉시 최신값을 받습니다 (실시간 push 는 아님).",
  },
  {
    q: "개미지표 자체는 얼마나 자주 업데이트되나요?",
    a: "글 크롤링은 30 분 주기, 크롤된 글은 Gemini API 로 감성분석 후 즉시 합산됩니다. 상단 지표는 항상 최근 24 시간의 라벨링된 글만 반영합니다.",
  },
  {
    q: "종목 30 개는 어떻게 선정되었나요? 다른 종목도 추가될 수 있나요?",
    a: "현재 30 개 종목은 시가총액·거래대금·종목토론방 활성도 등을 보고 운영자가 100 % 임의로 (주관적으로) 골라 선정한 표본입니다. 통계적 표본 추출이 아니며, 운영 중 자유롭게 추가·교체될 수 있습니다.",
  },
  {
    q: "긍정 / 부정 / 중립 분류는 어떻게 이루어지나요?",
    a: "Gemini 2.5 Flash-Lite API 가 각 글의 본문과 제목을 보고 긍정(상승) / 부정(하락) / 중립으로 분류합니다. 단어 매칭이 아니라 문맥 기반이라 반어법·은어도 어느 정도 잡아내지만, 100 % 정확하지는 않습니다.",
  },
  {
    q: "데이터는 어디서 수집되나요?",
    a: "현재는 네이버 증권 종목토론실 한 곳에서만 수집합니다. 토스 증권 등 추가 커뮤니티 통합은 추후 계획.",
  },
  {
    q: "미장(나스닥/뉴욕) 도 보여주나요?",
    a: "현재는 국내 종목 (KOSPI / KOSDAQ) 만 제공합니다. 미장은 데이터 소스가 다르고 한국어 종토방 같은 커뮤니티가 1:1 로 대응되지 않아 별도 설계가 필요해 추후 검토 중입니다.",
  },
];

/** 자주 묻는 질문 — 아코디언 */
export function FaqSection() {
  return (
    <section className="py-16">
      <h2
        className="text-3xl mb-6"
        style={{ fontFamily: '"Mbc1961", sans-serif' }}
      >
        자주 묻는 질문
      </h2>

      <Accordion.Root className="bg-background divide-y divide-border border border-border rounded-md">
        {QA.map((item, i) => (
          <Accordion.Item key={i} value={i} className="data-open:bg-muted/30">
            <Accordion.Header>
              <Accordion.Trigger className="group flex items-center justify-between w-full p-4 text-left text-sm font-medium hover:bg-muted/40 transition-colors cursor-pointer">
                <span className="break-keep pr-3">{item.q}</span>
                <ChevronDown className="size-4 shrink-0 text-muted-foreground transition-transform duration-200 group-data-panel-open:rotate-180" />
              </Accordion.Trigger>
            </Accordion.Header>
            <Accordion.Panel className="overflow-hidden transition-[height] duration-200 ease-out h-(--accordion-panel-height) data-starting-style:h-0 data-ending-style:h-0">
              <div className="px-4 pb-4 pt-0 text-sm text-muted-foreground leading-relaxed break-keep">
                {item.a}
              </div>
            </Accordion.Panel>
          </Accordion.Item>
        ))}
      </Accordion.Root>
    </section>
  );
}
