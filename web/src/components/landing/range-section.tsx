import { antIndexColor } from "@/lib/utils";

const RANGES = [
  {
    min: 0,
    max: 20,
    midpoint: 10,
    label: "돔황챠",
    description:
      "극단적 공포. 종토방에 패닉·매도·손절 글이 압도. 한쪽 사이드가 거의 쓸려나간 상황",
  },
  {
    min: 20,
    max: 40,
    midpoint: 30,
    label: "불안",
    description:
      "비관 우세. 매도 의견과 우려 글이 다수. 매수 의견은 소수의 역발상 정도",
  },
  {
    min: 40,
    max: 60,
    midpoint: 50,
    label: "중립",
    description:
      "양 사이드 균형. 매수·매도 의견이 비슷하게 섞임. 뚜렷한 방향이 보이지 않음",
  },
  {
    min: 60,
    max: 80,
    midpoint: 70,
    label: "기대",
    description:
      "낙관 우세. 매수·홀딩·상승 기대 글이 다수. 하락 우려는 소수의 신중론",
  },
  {
    min: 80,
    max: 100,
    midpoint: 90,
    label: "가즈아",
    description:
      "극단적 환희. 매수·추격·FOMO 글이 압도. 단기 과열·고점 신호로도 해석 가능",
  },
];

/** 구간 별 설명 — 0~100 을 5 등분한 각 구간이 무엇을 의미하는지 */
export function RangeSection() {
  return (
    <section className="py-16">
      <h2
        className="text-3xl mb-6"
        style={{ fontFamily: '"Mbc1961", sans-serif' }}
      >
        구간 별 설명
      </h2>

      <p className="max-w-300 text-base leading-relaxed text-foreground/90 break-keep mb-6">
        0 에 가까울수록 극단적 공포, 100 에 가까울수록 극단적 환희. 50 부근은
        균형. 양 극단은 종종 변곡점의 신호로 해석되기도 합니다.
      </p>

      <ul className="divide-y divide-border border border-border rounded-md">
        {RANGES.map((r) => {
          const color = antIndexColor(r.midpoint);
          return (
            <li key={r.label} className="flex items-center gap-4 p-4">
              <div
                className="shrink-0 flex items-center justify-center size-12 rounded-full border-2 text-sm font-bold"
                style={{ borderColor: color, color }}
              >
                {r.midpoint}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline gap-2">
                  <span className="text-base font-semibold">{r.label}</span>
                  <span className="text-xs text-muted-foreground font-mono">
                    {r.min}~{r.max}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground break-keep mt-0.5">
                  {r.description}
                </p>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
