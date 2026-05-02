import type { SVGProps } from "react";

export function USFlagIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" {...props}>
      <defs>
        <clipPath id="circle-clip">
          <circle cx="50" cy="50" r="50" />
        </clipPath>
      </defs>
      <g clipPath="url(#circle-clip)">
        {/* 흰 배경 */}
        <rect width="100" height="100" fill="#fff" />
        {/* 13줄: 빨-흰 반복 */}
        {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((i) => (
          <rect
            key={i}
            y={i * (100 / 13)}
            width="100"
            height={100 / 13}
            fill={i % 2 === 0 ? "#B22234" : "#fff"}
          />
        ))}
        {/* 파란 캔턴 — 좌상단 약 40% x 54% (실제 비율) */}
        <rect width="40" height={100 * (7 / 13)} fill="#3C3B6E" />
        {/* 별 9행 (홀수행 6개, 짝수행 5개) */}
        {[
          ...[0, 1, 2, 3, 4].flatMap((row) =>
            [0, 1, 2, 3, 4, 5].map((col) => ({
              x: 3.3 + col * 6.7,
              y: 3.5 + row * 11.5,
            }))
          ),
          ...[0, 1, 2, 3].flatMap((row) =>
            [0, 1, 2, 3, 4].map((col) => ({
              x: 6.65 + col * 6.7,
              y: 9.25 + row * 11.5,
            }))
          ),
        ].map((s, i) => (
          <circle key={i} cx={s.x} cy={s.y} r={1.5} fill="#fff" />
        ))}
      </g>
    </svg>
  );
}
