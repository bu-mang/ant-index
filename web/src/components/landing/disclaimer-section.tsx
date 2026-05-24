import { AlertTriangle } from "lucide-react";

/** 주의사항 — 투자 권유 아님 + 데이터 한계 고지 */
export function DisclaimerSection() {
  return (
    <section className="py-16">
      <h2
        className="text-3xl mb-6"
        style={{ fontFamily: '"Mbc1961", sans-serif' }}
      >
        주의사항
      </h2>

      <div className="rounded-md border border-amber-500/40 bg-amber-500/5 p-5">
        <div className="flex items-start gap-3">
          <AlertTriangle className="size-5 shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" />
          <div className="space-y-3 text-sm leading-relaxed text-foreground/90 break-keep">
            <p className="font-semibold text-base">
              이 지표는 참고용 데이터일 뿐, 투자 결정의 근거가 아닙니다.
              100 % 과신하지 말아주세요.
            </p>
            <ul className="space-y-1.5 list-disc pl-5">
              <li>
                종목토론방에는 시세 조작성 글, 봇 자동 게시물, 단순 감정
                표출이 섞여 있어 실제 시장 심리를 완전히 반영하지 못합니다.
              </li>
              <li>
                AI 감성분석은 문맥을 잘못 해석할 수 있으며, 분류 결과에는
                오류가 포함될 수 있습니다.
              </li>
              <li>
                종목 30 개는 운영자 임의로 선정한 표본이며, 전체 시장을 대표하지
                않습니다.
              </li>
              <li>
                과거 지표 추이가 미래 가격을 예측하지 않습니다. 특히 극단값
                (0 / 100 근처) 은 종종 반대 방향으로 튀는 변곡점이 될 수도 있어
                해석에 주의가 필요합니다.
              </li>
              <li>
                본 사이트의 어떤 정보도 투자 권유가 아니며, 투자에 따른 손익은
                전적으로 본인의 책임입니다.
              </li>
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
