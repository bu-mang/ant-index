// 서버가 보낸 █ 마스킹 문자열을 블러 처리된 한글로 렌더한다.
// █ 런(run)은 도메인 키워드(개미/지표/감성 등) 중 랜덤 한 글자로 치환된 뒤
// blur 필터·select-none·aria-hidden 으로 시각 효과만 남긴다. 원문은 서버에서
// 이미 가려져 네트워크로 전송되지 않는다.
import type { ReactNode } from "react";

const MASK_CHAR = "█";
const BLUR_CHARS = [
  "돔",
  "황",
  "챠",
  "가",
  "즈",
  "아",
  "개",
  "미",
  "감",
  "성",
] as const;

const pickBlurChar = () =>
  BLUR_CHARS[Math.floor(Math.random() * BLUR_CHARS.length)];

export function MaskedText({ text }: { text: string }) {
  const nodes: ReactNode[] = [];
  let i = 0;
  while (i < text.length) {
    const isMask = text[i] === MASK_CHAR;
    let j = i;
    while (j < text.length && (text[j] === MASK_CHAR) === isMask) j++;
    const chunk = text.slice(i, j);
    if (isMask) {
      const replaced = Array.from(chunk, pickBlurChar).join("");
      nodes.push(
        <span
          key={i}
          className="blur-[3px] select-none"
          aria-hidden="true"
        >
          {replaced}
        </span>,
      );
    } else {
      nodes.push(<span key={i}>{chunk}</span>);
    }
    i = j;
  }
  return <>{nodes}</>;
}
