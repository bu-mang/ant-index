"use client";

import { useEffect, useState, useRef } from "react";
import { PixelAnt } from "@/components/icons/pixel-ant";

interface WalkingAntProps {
  value: number; // 개미지표 0~100
  count?: number; // 개미 수 (기본 6)
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

function getSpeechLines(value: number) {
  const bucket =
    SPEECH_MAP.find((b) => value <= b.max) ?? SPEECH_MAP[SPEECH_MAP.length - 1];
  return bucket.lines;
}

interface AntState {
  posX: number; // 0~100 (%)
  direction: 1 | -1;
  frame: 0 | 1;
  speed: number;
  speech: string | null;
  nextSpeechAt: number;
}

function initAnts(count: number): AntState[] {
  return Array.from({ length: count }, (_, i) => ({
    posX: (100 / (count + 1)) * (i + 1) + (Math.random() * 10 - 5),
    direction: (Math.random() > 0.5 ? 1 : -1) as 1 | -1,
    frame: (Math.random() > 0.5 ? 1 : 0) as 0 | 1,
    speed: 0.3 + Math.random() * 0.4,
    speech: null,
    nextSpeechAt: Date.now() + 2000 + Math.random() * 5000,
  }));
}

export function WalkingAnt({ value, count = 6 }: WalkingAntProps) {
  const [ants, setAnts] = useState<AntState[]>(() => initAnts(count));
  const speechLines = useRef(getSpeechLines(value));

  useEffect(() => {
    speechLines.current = getSpeechLines(value);
  }, [value]);

  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      setAnts((prev) =>
        prev.map((ant) => {
          let { posX, direction, frame, speech, nextSpeechAt } = ant;
          const { speed } = ant;

          // 프레임 전환
          frame = frame === 0 ? 1 : 0;

          // 이동
          posX += direction * speed;

          // 범위 체크 (2% ~ 98%)
          if (posX >= 96) direction = -1;
          else if (posX <= 4) direction = 1;
          else if (Math.random() < 0.05) direction = (direction * -1) as 1 | -1;

          // 말풍선
          if (now >= nextSpeechAt) {
            if (speech === null) {
              const lines = speechLines.current;
              speech = lines[Math.floor(Math.random() * lines.length)];
              nextSpeechAt = now + 2000; // 2초 후 사라짐
            } else {
              speech = null;
              nextSpeechAt = now + 4000 + Math.random() * 6000; // 4~10초 후 다시
            }
          }

          return { posX, direction, frame, speed, speech, nextSpeechAt };
        }),
      );
    }, 300);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative w-full h-6">
      {ants.map((ant, i) => (
        <div
          key={i}
          className="absolute bottom-0 transition-all duration-300 ease-linear"
          style={{ left: `${ant.posX}%` }}
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
