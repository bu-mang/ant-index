// 지표 레이블 — 프론트/서버 공통 SSOT

export const SB_LABELS = [
  { max: 20, label: "매우 평온" },
  { max: 40, label: "평온" },
  { max: 60, label: "보통" },
  { max: 80, label: "불안" },
  { max: 100, label: "매우 공포" },
] as const;

export const GAZUA_LABELS = [
  { max: 20, label: "침체" },
  { max: 40, label: "조용" },
  { max: 60, label: "보통" },
  { max: 80, label: "흥분" },
  { max: 100, label: "매우 환희" },
] as const;

export type IndexLabel =
  | (typeof SB_LABELS)[number]["label"]
  | (typeof GAZUA_LABELS)[number]["label"];

export function getLabel(
  value: number,
  labels: typeof SB_LABELS | typeof GAZUA_LABELS,
): string {
  for (const { max, label } of labels) {
    if (value <= max) return label;
  }
  return labels[labels.length - 1].label;
}

// SB/GAZUA 조합 → 개미 감정
export const ANT_MOODS = [
  "sleepy",
  "neutral",
  "excited",
  "anxious",
  "chaos",
] as const;
export type AntMood = (typeof ANT_MOODS)[number];

// 0→0-20, 1→20-40, 2→40-60, 3→60-80, 4→80-100
function toTier(value: number): number {
  return Math.min(Math.floor(value / 20), 4);
}

//               GAZUA →  침체      조용      보통      흥분      매우환희
const MOOD_MAP: AntMood[][] = [
  /* 매우평온 */ ["sleepy", "sleepy", "neutral", "excited", "excited"],
  /* 평온      */ ["sleepy", "neutral", "neutral", "excited", "excited"],
  /* 보통      */ ["neutral", "neutral", "neutral", "neutral", "chaos"],
  /* 불안      */ ["anxious", "anxious", "anxious", "chaos", "chaos"],
  /* 매우공포 */ ["anxious", "anxious", "anxious", "chaos", "chaos"],
];

export function getAntMood(sb: number, gazua: number): AntMood {
  return MOOD_MAP[toTier(sb)][toTier(gazua)];
}

// 감정별 이미지 파일명
export const ANT_MOOD_IMAGES: Record<AntMood, string> = {
  sleepy: "/images/ant-sleepy.png",
  neutral: "/images/ant-neutral.png",
  excited: "/images/ant-excited.png",
  anxious: "/images/ant-anxious.png",
  chaos: "/images/ant-chaos.png",
};

// 감정별 한글 라벨 (alt 텍스트 등에 활용)
export const ANT_MOOD_LABELS: Record<AntMood, string> = {
  sleepy: "졸린 개미",
  neutral: "무표정 개미",
  excited: "신난 개미",
  anxious: "떠는 개미",
  chaos: "멘붕 개미",
};
