// 게이지 차트 — 0~100 반원형 게이지로 지표값을 시각화
"use client";

interface GaugeChartProps {
  value: number; // 0~100
  label: string; // "평온", "극도의 분노" 등
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
  // 게이지 각도 계산 (0~180도)
  const angle = (value / 100) * 180;
  const colorClass = color === "red" ? "text-red-500" : "text-green-500";
  const bgGradient =
    color === "red"
      ? "from-red-500/20 to-red-500/5"
      : "from-green-500/20 to-green-500/5";

  return (
    <div className="flex flex-col items-center gap-2 flex-1">
      <h3 className="text-sm font-medium text-muted-foreground">{title}</h3>

      {/* SVG 반원 게이지 */}
      <div className="relative w-full aspect-200/110">
        <svg viewBox="0 0 200 110" className="w-full h-full">
          {/* 배경 호 */}
          <path
            d="M 20 100 A 80 80 0 0 1 180 100"
            fill="none"
            stroke="currentColor"
            strokeWidth="12"
            strokeLinecap="round"
            className="text-muted-foreground/20"
          />
          {/* 값 호 */}
          <path
            d="M 20 100 A 80 80 0 0 1 180 100"
            fill="none"
            stroke="currentColor"
            strokeWidth="12"
            strokeLinecap="round"
            strokeDasharray={`${(angle / 180) * 251.2} 251.2`}
            className={colorClass}
          />
          {/* 중앙 수치 */}
          <text
            x="100"
            y="85"
            textAnchor="middle"
            className={`${colorClass} fill-current text-3xl font-bold`}
            style={{ fontSize: "36px", fontWeight: 700 }}
          >
            {value.toFixed(1)}
          </text>
        </svg>
      </div>

      {/* 레이블 */}
      <span
        className={`text-sm font-semibold px-3 py-1 rounded-full bg-linear-to-r ${bgGradient} ${colorClass}`}
      >
        {label}
      </span>

      {/* 글 수 */}
      {totalPosts !== undefined && (
        <span className="text-xs text-muted-foreground">
          {totalPosts}개 글 기반
        </span>
      )}
    </div>
  );
}
