"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { PixelAnt } from "@/components/icons/pixel-ant";
import { ThemeToggle } from "@/components/theme-toggle";

gsap.registerPlugin(ScrollTrigger);

export function Header() {
  const [frame, setFrame] = useState<0 | 1>(0);
  const hoveredRef = useRef(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const bgRef = useRef<HTMLDivElement>(null);

  const startWalking = () => {
    hoveredRef.current = true;
    if (intervalRef.current) return;
    intervalRef.current = setInterval(() => {
      setFrame((f) => (f === 0 ? 1 : 0));
    }, 250);
  };

  const stopWalking = () => {
    hoveredRef.current = false;
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setFrame(0);
  };

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  useGSAP(() => {
    gsap.to(bgRef.current, {
      opacity: 1,
      scrollTrigger: {
        start: "top top",
        end: "100px top",
        scrub: true,
      },
    });
  });

  return (
    <header className="fixed top-0 left-0 lg:right-108 right-0 h-14 z-10">
      <div
        ref={bgRef}
        className="absolute inset-0 -z-1 bg-background/30 backdrop-blur-xl backdrop-saturate-150 border-b border-border/50 opacity-0"
      />
      <nav className="max-w-432 mx-auto px-12 h-full flex items-center justify-between">
        <Link
          href="/"
          className="flex items-end gap-2 text-xl font-normal tracking-tight"
          style={{ fontFamily: '"Mbc1961", sans-serif' }}
          onMouseEnter={startWalking}
          onMouseLeave={stopWalking}
        >
          <PixelAnt frame={frame} direction={1} className="size-7" />
          개미지표
        </Link>
        <ThemeToggle />
      </nav>
    </header>
  );
}
