import { BlockMath } from "react-katex";

/** 개미지표란? — 줄글 설명 + 계산식 */
export function AboutSection() {
  return (
    <section className="py-16">
      <h2
        className="text-3xl mb-6"
        style={{ fontFamily: '"Mbc1961", sans-serif' }}
      >
        개미지표란?
      </h2>

      <div className="space-y-4 max-w-300 text-base leading-relaxed text-foreground/90 break-keep">
        <p>
          개미지표는 한국 주식 커뮤니티(네이버 종목토론실 등)에 올라오는
          개미투자자들의 글·댓글을 AI 로 감성분석해, 매 시점의 시장 심리를 0
          부터 100 까지 한 숫자로 압축한 지표입니다.
        </p>
        <p>
          가격이 아니라 사람들이 실제로 쓰는 말과 감정을 본다는 점에서 기존
          공포탐욕지수와 다른 차원을 측정합니다. 가격이 올랐는데도 종토방엔
          &ldquo;끝물이다&rdquo;라는 공포가 가득할 수 있고, 가격이 빠졌어도
          &ldquo;물타기 가즈아&rdquo;가 넘칠 수도 있어요. 그 갭이 이 지표가
          잡으려는 신호입니다.
        </p>
        <p>
          매 시점 수집된 글을 LLM 이 긍정(상승) / 부정(하락) / 중립 으로
          분류하고, 각 글의 공감 수에 따라 가중치를 곱해 합산합니다.
        </p>
      </div>

      <h3 className="text-xl font-semibold mt-10 mb-3">계산식</h3>
      <div className="bg-muted rounded-md p-6 max-w-300 space-y-8 text-foreground">
        <BlockMath
          math={String.raw`\text{개미지표} = \frac{\sum (w \cdot \text{긍정 반응 수})}{\sum (w \cdot \text{긍정 반응 수}) + \sum (w \cdot \text{부정 반응 수})} \times 100`}
        />
        <BlockMath
          math={String.raw`w_{\text{(가중치)}} = 1 + \log_{10}(\text{공감수} + 1)`}
        />
      </div>

      <ul className="mt-6 space-y-1.5 text-sm text-muted-foreground list-disc pl-5 max-w-300 break-keep">
        <li>
          공감 수가 많은 글일수록 영향이 커지지만, log 스케일로 한 글의 독주를
          억제합니다.
        </li>
        <li>
          중립 글은 분모·분자에서 모두 제외되어 방향성에 기여하지 않습니다.
        </li>
        <li>현재 화면 상단 지표는 최근 24 시간 글만 반영합니다.</li>
      </ul>
    </section>
  );
}
