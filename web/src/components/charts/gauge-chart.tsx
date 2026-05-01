// 게이지 차트 — 0~100 반원형 게이지로 지표값을 시각화
"use client";

interface GaugeChartProps {
  value: number; // 0~100
  label: string; // "평온", "매우 공포" 등
  title: string; // "ㅅㅂ지수", "가즈아지수"
  color: "red" | "green";
  totalPosts?: number;
}

export function GaugeChart({
  value,
  label,
  title,
  color,
  totalPosts,
}: GaugeChartProps) {
  const angle = (value / 100) * 180;
  const cssColor = color === "red" ? "var(--sb)" : "var(--gazua)";

  // 호 길이 계산 (반지름 80, 반원 = π * 80 ≈ 251.2)
  const arcLength = 251.2;
  const filledLength = (angle / 180) * arcLength;

  return (
    <div className="flex flex-col items-center gap-1 flex-1">
      <h3 className="text-xs font-medium text-muted-foreground">{title}</h3>

      {/* SVG 반원 게이지 */}
      <div className="relative w-full aspect-200/120">
        <svg viewBox="0 0 200 120" className="w-full h-full">
          {/* 배경 트랙 */}
          <path
            d="M 20 100 A 80 80 0 0 1 180 100"
            fill="none"
            stroke="currentColor"
            strokeWidth="8"
            strokeLinecap="round"
            className="text-muted/80"
          />
          {/* 값 호 */}
          <path
            d="M 20 100 A 80 80 0 0 1 180 100"
            fill="none"
            stroke={cssColor}
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={`${filledLength} ${arcLength}`}
          />
          {/* 중앙 수치 */}
          <text
            x="100"
            y="88"
            textAnchor="middle"
            fill={cssColor}
            style={{ fontSize: "32px", fontWeight: 700 }}
          >
            {value.toFixed(1)}
          </text>
          {/* 레이블 */}
          <text
            x="100"
            y="108"
            textAnchor="middle"
            className="fill-muted-foreground"
            style={{ fontSize: "12px", fontWeight: 500 }}
          >
            {label}
          </text>
        </svg>
      </div>

      {/* 글 수 */}
      {totalPosts !== undefined && (
        <span className="text-xs text-muted-foreground/60">
          {totalPosts.toLocaleString()}개 글 기반
        </span>
      )}
    </div>
  );
}
