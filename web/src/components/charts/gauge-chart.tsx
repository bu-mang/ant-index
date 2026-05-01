// 게이지 차트 — 0~100 반원형 게이지로 지표값을 시각화
"use client";

interface GaugeChartProps {
  value: number; // 0~100
  label: string;
  title: string;
  color: "blue" | "orange" | "gradient";
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
  const arcLength = 251.2; // 반지름 80, 반원 = π * 80
  const filledLength = (angle / 180) * arcLength;

  // gradient 모드: 값에 따라 파랑↔오렌지 보간
  const isGradient = color === "gradient";
  const cssColor = isGradient
    ? "url(#gauge-gradient)"
    : color === "blue"
      ? "var(--sb)"
      : "var(--gazua)";

  // 중앙 숫자 색: gradient일 때 값 기반 보간
  const textColor = isGradient
    ? `color-mix(in srgb, var(--sb) ${100 - value}%, var(--gazua))`
    : color === "blue"
      ? "var(--sb)"
      : "var(--gazua)";

  return (
    <div className="flex flex-col items-center gap-1 flex-1">
      <h3 className="text-xs font-medium text-muted-foreground">{title}</h3>

      <div className="relative w-full aspect-200/120">
        <svg viewBox="0 0 200 120" className="w-full h-full">
          {isGradient && (
            <defs>
              <linearGradient id="gauge-gradient" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="var(--sb)" />
                <stop offset="100%" stopColor="var(--gazua)" />
              </linearGradient>
            </defs>
          )}
          {/* 배경 트랙 */}
          <path
            d="M 20 100 A 80 80 0 0 1 180 100"
            fill="none"
            stroke={isGradient ? "url(#gauge-gradient)" : "currentColor"}
            strokeWidth="8"
            strokeLinecap="round"
            className={isGradient ? undefined : "text-muted/80"}
            opacity={isGradient ? 0.2 : 1}
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
            fill={textColor}
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

      {totalPosts !== undefined && (
        <span className="text-xs text-muted-foreground/60">
          {totalPosts.toLocaleString()}개 글 기반
        </span>
      )}
    </div>
  );
}
