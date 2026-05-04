import { SENTIMENT_KEYWORDS } from '../constants/sentiment-keywords';

const MASK_CHAR = '█';

/**
 * 콘텐츠에서 감성 키워드 전후만 남기고 나머지를 ██로 마스킹한다.
 *
 * 예: "이 종목 떡상 가능성 높다고 봅니다" → "██ 떡상 ██████"
 *
 * 키워드가 하나도 없으면 전체를 마스킹하여 반환한다.
 */
export function maskContent(content: string): string {
  if (!content) return '';

  // 키워드 매칭 위치 수집 (대소문자 무시)
  const matches: { start: number; end: number }[] = [];
  const lower = content.toLowerCase();

  for (const kw of SENTIMENT_KEYWORDS) {
    const kwLower = kw.toLowerCase();
    let idx = 0;
    while ((idx = lower.indexOf(kwLower, idx)) !== -1) {
      matches.push({ start: idx, end: idx + kw.length });
      idx += kw.length;
    }
  }

  // 키워드가 하나도 없으면 전체 마스킹
  if (matches.length === 0) {
    return MASK_CHAR.repeat(Math.min(content.length, 20));
  }

  // 키워드 위치 기준으로 정렬
  matches.sort((a, b) => a.start - b.start);

  // 노출 구간 계산: 키워드 앞뒤 1글자까지
  const CONTEXT = 1;
  const visible: { start: number; end: number }[] = [];
  for (const m of matches) {
    const start = Math.max(0, m.start - CONTEXT);
    const end = Math.min(content.length, m.end + CONTEXT);
    // 겹치는 구간 머지
    if (visible.length > 0 && start <= visible[visible.length - 1].end) {
      visible[visible.length - 1].end = Math.max(
        visible[visible.length - 1].end,
        end,
      );
    } else {
      visible.push({ start, end });
    }
  }

  // 결과 조립
  const parts: string[] = [];
  let cursor = 0;

  for (const v of visible) {
    if (cursor < v.start) {
      // 마스킹 구간 — 글자 수 비례 블록 (최소 2, 최대 6)
      const gap = v.start - cursor;
      const blocks = Math.max(2, Math.min(6, Math.ceil(gap / 2)));
      parts.push(MASK_CHAR.repeat(blocks));
    }
    parts.push(content.slice(v.start, v.end));
    cursor = v.end;
  }

  // 마지막 남은 구간
  if (cursor < content.length) {
    const gap = content.length - cursor;
    const blocks = Math.max(2, Math.min(6, Math.ceil(gap / 2)));
    parts.push(MASK_CHAR.repeat(blocks));
  }

  return parts.join(' ');
}

/**
 * 좋아요 수 → 단순화 버킷 문자열
 */
export function likeBucket(count: number): string {
  if (count >= 200) return '200+';
  if (count >= 100) return '100+';
  if (count >= 10) return '10+';
  if (count >= 1) return `${count}`;
  return '0';
}
