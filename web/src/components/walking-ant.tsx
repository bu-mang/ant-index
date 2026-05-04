"use client";

import { useEffect, useState, useRef } from "react";
import { PixelAnt } from "@/components/icons/pixel-ant";

interface WalkingAntProps {
  value: number; // 개미지표 0~100
}

// 지수 구간별 대사
const SPEECH_MAP: { max: number; lines: string[] }[] = [
  { max: 10, lines: ["돔황챠!", "망했다...", "탈출각"] },
  { max: 25, lines: ["불안...", "ㅅㅂ", "샤갈!"] },
  { max: 40, lines: ["흠...", "존버", "지켜보자"] },
  { max: 60, lines: ["평화롭다~", "조용하네", "횡보인가.."] },
  { max: 75, lines: ["오?", "가나?", "떡상각이다"] },
  { max: 90, lines: ["오예!", "가즈아!", "대박!"] },
  { max: 100, lines: ["가즈아!!!", "로켓발사!", "치얼쓰🍸"] },
];

// 지수 구간별 개미 수
function getAntCount(value: number): number {
  if (value <= 10) return 1;
  if (value <= 25) return 4;
  if (value <= 60) return 6;
  if (value <= 75) return 8;
  return 10;
}

// 기대(75+)부터 점프 가능
function canJump(value: number): boolean {
  return value > 60;
}

function getSpeechLines(value: number) {
  const bucket =
    SPEECH_MAP.find((b) => value <= b.max) ?? SPEECH_MAP[SPEECH_MAP.length - 1];
  return bucket.lines;
}

interface AntState {
  id: number;
  posX: number; // 0~100 (%)
  direction: 1 | -1;
  frame: 0 | 1 | 2;
  speed: number;
  speech: string | null;
  nextSpeechAt: number;
  jumping: boolean;
  speechIndex: number; // 대사 순환 인덱스
}

function initAnts(count: number): AntState[] {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    posX: (100 / (count + 1)) * (i + 1) + (Math.random() * 10 - 5),
    direction: (Math.random() > 0.5 ? 1 : -1) as 1 | -1,
    frame: 0 as 0 | 1 | 2,
    speed: 0.3 + Math.random() * 0.4,
    speech: null,
    nextSpeechAt: Date.now() + 2000 + Math.random() * 5000,
    jumping: false,
    speechIndex: Math.floor(Math.random() * 3), // 랜덤 시작 인덱스
  }));
}

export function WalkingAnt({ value }: WalkingAntProps) {
  const antCount = getAntCount(value);
  const [ants, setAnts] = useState<AntState[]>(() => initAnts(antCount));
  const speechLines = useRef(getSpeechLines(value));
  const prevCount = useRef(antCount);

  useEffect(() => {
    speechLines.current = getSpeechLines(value);
  }, [value]);

  // 개미 수 변경 시 재생성
  useEffect(() => {
    if (antCount !== prevCount.current) {
      prevCount.current = antCount;
      setAnts(initAnts(antCount));
    }
  }, [antCount]);

  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      const jumpEnabled = canJump(value);

      setAnts((prev) =>
        prev.map((ant) => {
          let { posX, direction, frame, speech, nextSpeechAt, jumping } = ant;
          const { id, speed } = ant;

          // 프레임 전환: 기대 이상이면 0↔2, 아니면 0↔1
          if (jumpEnabled) {
            frame = frame === 0 ? 2 : 0;
          } else {
            frame = frame === 0 ? 1 : 0;
          }

          // 이동
          posX += direction * speed;

          // 범위 체크 (2% ~ 98%)
          if (posX >= 96) direction = -1;
          else if (posX <= 4) direction = 1;
          else if (Math.random() < 0.05) direction = (direction * -1) as 1 | -1;

          // 점프 (기대 이상일 때, ~4% 확률)
          if (jumpEnabled && !jumping && Math.random() < 0.04) {
            jumping = true;
            const antId = id;
            setTimeout(() => {
              setAnts((prev) =>
                prev.map((a) =>
                  a.id === antId ? { ...a, jumping: false } : a,
                ),
              );
            }, 400);
          }

          // 말풍선
          let { speechIndex } = ant;
          if (now >= nextSpeechAt) {
            if (speech === null) {
              const lines = speechLines.current;
              speech = lines[speechIndex % lines.length];
              speechIndex = (speechIndex + 1) % lines.length;
              nextSpeechAt = now + 2000;
            } else {
              speech = null;
              nextSpeechAt = now + 4000 + Math.random() * 6000;
            }
          }

          return {
            id,
            posX,
            direction,
            frame,
            speed,
            speech,
            nextSpeechAt,
            jumping,
            speechIndex,
          };
        }),
      );
    }, 300);

    return () => clearInterval(interval);
  }, [value]);

  return (
    <div className="relative w-full h-6">
      {ants.map((ant) => (
        <div
          key={ant.id}
          className="absolute bottom-0 transition-all duration-300 ease-linear"
          style={{
            left: `${ant.posX}%`,
            transform: ant.jumping ? "translateY(-8px)" : undefined,
            transition: ant.jumping
              ? "left 300ms linear, transform 200ms ease-out"
              : "left 300ms linear, transform 200ms ease-in",
          }}
        >
          {ant.speech && (
            <div className="absolute -top-7 left-1/2 -translate-x-1/2 whitespace-nowrap px-1.5 py-0.5 rounded bg-foreground/10 text-[10px] font-medium text-foreground animate-in fade-in-0 zoom-in-95 duration-200">
              {ant.speech}
            </div>
          )}
          <PixelAnt
            frame={ant.frame}
            direction={ant.direction}
            className="size-5"
          />
        </div>
      ))}
    </div>
  );
}
