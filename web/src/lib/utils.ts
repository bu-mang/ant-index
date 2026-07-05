import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

const DAY_NAMES = ["일", "월", "화", "수", "목", "금", "토"];

/** "2026-05-05" → "05.05(월)" */
export function formatDateShort(dateStr: string): string {
  const [, m, d] = dateStr.split("-");
  const day = DAY_NAMES[new Date(dateStr + "T00:00:00+09:00").getDay()];
  return `${m}.${d}(${day})`;
}

/** "2026-05-05" → "2026.05.05(월)" */
export function formatDateFull(dateStr: string): string {
  const [y, m, d] = dateStr.split("-");
  const day = DAY_NAMES[new Date(dateStr + "T00:00:00+09:00").getDay()];
  return `${y}.${m}.${d}(${day})`;
}

/** 현재 시각의 KST 날짜를 YYYY-MM-DD로 반환 */
export function todayKST(): string {
  return new Date().toLocaleDateString("sv-SE", { timeZone: "Asia/Seoul" });
}

/**
 * 개미지표(0~100) → 민심 색상. 프로젝트 전역 SSOT.
 * 0 = 돔황챠(공포, --sb 파랑), 100 = 가즈아(탐욕, --gazua 주황).
 * CSS 변수를 쓰므로 라이트/다크 테마에 자동 대응한다.
 */
export function antIndexColor(value: number): string {
  const v = Math.max(0, Math.min(100, value));
  return `color-mix(in srgb, var(--sb) ${100 - v}%, var(--gazua))`;
}
