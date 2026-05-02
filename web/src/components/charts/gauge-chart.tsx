// 게이지 차트 — CNN Fear & Greed 스타일
"use client";

import { ANT_INDEX_LABELS } from "@/lib/constants";

interface GaugeChartProps {
  value: number; // 0~100
  label: string;
  title?: string;
  color: "blue" | "orange" | "gradient";
  totalPosts?: number;
}

// 5개 섹션 path (gauge.svg에서 추출)
const SECTION_PATHS = [
  "M83.75,1016.667c4.846,-185.265 63.33,-365.205 168.333,-517.917l257.5,177.083c-70.673,102.847 -110.046,224.005 -113.333,348.75l-312.5,-7.917Z",
  "M281.25,458.333c112.773,-146.982 265.783,-258.157 440.417,-320l104.583,294.583c-117.761,41.565 -220.976,116.407 -297.083,215.417l-247.917,-190Z",
  "M769.583,122.917c177.559,-52.575 366.608,-52.575 544.167,-0l-88.75,299.583c-119.642,-35.42 -247.024,-35.42 -366.667,0l-88.75,-299.583Z",
  "M1361.667,138.333c174.634,61.843 327.644,173.018 440.417,320l-247.917,190c-76.107,-99.01 -179.322,-173.852 -297.083,-215.417l104.583,-294.583Z",
  "M1831.25,498.75c105.003,152.711 163.488,332.652 168.333,517.917l-312.5,7.917c-3.287,-124.745 -42.66,-245.903 -113.333,-348.75l257.5,-177.083Z",
];

// 라벨 위치 & 회전 (gauge.svg에서 추출)
const LABEL_TRANSFORMS = [
  {
    x: 327.694,
    y: 2320.679,
    matrix:
      "matrix(0.241922,-0.970296,0.970296,0.241922,-2101.85664,667.439778)",
  },
  {
    x: 275.156,
    y: 837.274,
    matrix: "matrix(0.809017,-0.587785,0.587785,0.809017,-226.31546,-85.60774)",
  },
  { x: 955.647, y: 245.999, matrix: undefined }, // 중립은 회전 없음
  {
    x: 1917.055,
    y: 117.467,
    matrix:
      "matrix(0.768279,0.640115,-0.640115,0.768279,58.485705,-990.257361)",
  },
  {
    x: 3136.543,
    y: 232.293,
    matrix:
      "matrix(0.241922,0.970296,-0.970296,0.241922,1259.074107,-2430.619512)",
  },
];

// 숫자 위치 (gauge.svg에서 추출)
const NUMBER_POSITIONS = [
  { x: 425.446, y: 1008.333, text: "0" },
  { x: 534.224, y: 691.667, text: "25" },
  { x: 1009.224, y: 470.833, text: "50" },
  { x: 1467.558, y: 691.667, text: "75" },
  { x: 1559.67, y: 1008.333, text: "100" },
];

// 보조 점 (gauge.svg에서 추출)
const DOTS = [
  { cx: 445, cy: 938.75 },
  { cx: 467.083, cy: 855 },
  { cx: 503.333, cy: 767.5 },
  { cx: 645, cy: 594.583 },
  { cx: 725.833, cy: 528.333 },
  { cx: 830, cy: 483.75 },
  { cx: 947.083, cy: 453.333 },
  { cx: 1136.25, cy: 453.333 },
  { cx: 1253.333, cy: 483.75 },
  { cx: 1357.5, cy: 528.333 },
  { cx: 1438.333, cy: 594.583 },
  { cx: 1580, cy: 767.5 },
  { cx: 1616.25, cy: 855 },
  { cx: 1638.333, cy: 938.75 },
];

// 바늘 중심 & 반지름
const NEEDLE_CX = 1042;
const NEEDLE_CY = 980;
const NEEDLE_R = 680;

function Needle({ cx, cy, angle }: { cx: number; cy: number; angle: number }) {
  const rad = (angle * Math.PI) / 180;
  const perpRad = rad + Math.PI / 2;
  const tipR = NEEDLE_R;
  const tipW = 4; // 끝부분 반폭
  const baseW = 28; // 중심부 반폭

  const tx = cx + tipR * Math.cos(rad);
  const ty = cy - tipR * Math.sin(rad);
  // 끝부분 두 점 (약간 벌림)
  const tx1 = tx + tipW * Math.cos(perpRad);
  const ty1 = ty - tipW * Math.sin(perpRad);
  const tx2 = tx - tipW * Math.cos(perpRad);
  const ty2 = ty + tipW * Math.sin(perpRad);
  // 중심부 두 점
  const bx1 = cx + baseW * Math.cos(perpRad);
  const by1 = cy - baseW * Math.sin(perpRad);
  const bx2 = cx - baseW * Math.cos(perpRad);
  const by2 = cy + baseW * Math.sin(perpRad);

  return (
    <polygon
      points={`${bx1},${by1} ${tx1},${ty1} ${tx2},${ty2} ${bx2},${by2}`}
      className="fill-foreground"
      filter="url(#needle-shadow)"
    />
  );
}

export function GaugeChart({
  value,
  // label,
  title,
  color,
  totalPosts,
}: GaugeChartProps) {
  const clampedValue = Math.max(0, Math.min(100, value));
  const activeIdx = clampedValue >= 100 ? 4 : Math.floor(clampedValue / 20);

  // 바늘 각도: value 0 → 180°(왼쪽), value 100 → 0°(오른쪽)
  const needleDeg = 180 - (clampedValue / 100) * 180;

  const isGradient = color === "gradient";
  const textColor = isGradient
    ? `color-mix(in srgb, var(--sb) ${100 - clampedValue}%, var(--gazua))`
    : color === "blue"
      ? "var(--sb)"
      : "var(--gazua)";

  // 활성 섹션 하이라이트 색
  const highlightFill = isGradient ? textColor : textColor;
  const labels = ANT_INDEX_LABELS.map((l) => l.label);

  return (
    <div className="flex flex-col items-center gap-1 flex-1">
      <h3 className="text-lg font-bold text-muted-foreground">{title}</h3>

      <div className="relative w-full aspect-2084/1100">
        <svg viewBox="0 0 2084 1100" className="w-full h-full overflow-visible">
          {/* 5개 섹션 */}
          {SECTION_PATHS.map((d, i) => {
            const isActive = i === activeIdx;
            return (
              <g key={i}>
                <path
                  d={d}
                  fill={isActive ? highlightFill : undefined}
                  fillOpacity={isActive ? 0.15 : undefined}
                  className={isActive ? undefined : "fill-foreground/4"}
                />
                {isActive && (
                  <path
                    d={d}
                    fill="none"
                    stroke={highlightFill}
                    strokeWidth={6}
                    strokeOpacity={0.5}
                  />
                )}
              </g>
            );
          })}

          {/* 섹션 라벨 */}
          {labels.map((text, i) => {
            const t = LABEL_TRANSFORMS[i];
            const isActive = i === activeIdx;
            return (
              <g key={`l${i}`} transform={t.matrix || undefined}>
                <text
                  x={`${t.x}px`}
                  y={`${t.y}px`}
                  fill={isActive ? highlightFill : undefined}
                  className={isActive ? undefined : "fill-muted-foreground"}
                  style={{
                    fontFamily: '"Mbc1961", sans-serif',
                    fontWeight: 400,
                    fontSize: isActive ? "105px" : "95.833px",
                  }}
                >
                  {text}
                </text>
              </g>
            );
          })}

          {/* 숫자 */}
          {NUMBER_POSITIONS.map((n, i) => (
            <text
              key={`n${i}`}
              x={`${n.x}px`}
              y={`${n.y}px`}
              className="fill-muted-foreground/60"
              style={{
                fontFamily: '"Mbc1961", sans-serif',
                fontSize: "58.333px",
              }}
            >
              {n.text}
            </text>
          ))}

          {/* 보조 점 */}
          {DOTS.map((d, i) => (
            <circle
              key={`d${i}`}
              cx={d.cx}
              cy={d.cy}
              r={8.333}
              className="fill-muted-foreground/30"
            />
          ))}

          {/* 바늘 그림자 */}
          <defs>
            <filter id="needle-shadow" x="-50%" y="-50%" width="200%" height="200%">
              <feDropShadow dx="0" dy="14" stdDeviation="10" floodColor="var(--foreground)" floodOpacity="0.35" />
            </filter>
          </defs>
          {/* 바늘 (테이퍼: 중심 굵고 끝 약간 뾰족) */}
          <Needle cx={NEEDLE_CX} cy={NEEDLE_CY} angle={needleDeg} />
          <circle
            cx={NEEDLE_CX}
            cy={NEEDLE_CY}
            r={24}
            className="fill-foreground"
          />
          <circle
            cx={NEEDLE_CX}
            cy={NEEDLE_CY}
            r={10}
            className="fill-background"
          />

          {/* 중심 반원 (숫자 배경) */}
          <defs>
            <filter
              id="semicircle-shadow"
              x="-20%"
              y="-20%"
              width="140%"
              height="120%"
            >
              <feDropShadow
                dx="0"
                dy="-4"
                stdDeviation="32"
                floodColor="var(--foreground)"
                floodOpacity="0.1"
              />
            </filter>
            <clipPath id="semicircle-clip">
              <rect
                x={NEEDLE_CX - 300}
                y={NEEDLE_CY + 50 - 300}
                width={600}
                height={300}
              />
            </clipPath>
          </defs>
          <g clipPath="url(#semicircle-clip)">
            <path
              d={`M${NEEDLE_CX - 250},${NEEDLE_CY + 50} A250,250 0 0 1 ${NEEDLE_CX + 250},${NEEDLE_CY + 50} Z`}
              className="fill-background"
              filter="url(#semicircle-shadow)"
            />
          </g>
          {/* 하단 직선부 그림자 가림 */}
          <rect
            x={NEEDLE_CX - 260}
            y={NEEDLE_CY + 50}
            width={520}
            height={30}
            className="fill-background"
          />

          {/* 수치 */}
          <text
            x={NEEDLE_CX}
            y={NEEDLE_CY - 10}
            textAnchor="middle"
            fill={textColor}
            style={{ fontSize: "144px", fontWeight: 800 }}
          >
            {value.toFixed(1)}
          </text>

          {/* N개 글 기반 */}
          {totalPosts !== undefined && (
            <text
              x={NEEDLE_CX}
              y={NEEDLE_CY + 40}
              textAnchor="middle"
              className="fill-muted-foreground/60"
              style={{ fontSize: "40px" }}
            >
              {totalPosts.toLocaleString()}개 글 기반
            </text>
          )}
        </svg>
      </div>
    </div>
  );
}
