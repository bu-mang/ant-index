"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { PixelAnt } from "@/components/icons/pixel-ant";
import { ThemeToggle } from "@/components/theme-toggle";

export function Header() {
  const [frame, setFrame] = useState<0 | 1>(0);
  const hoveredRef = useRef(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

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

  return (
    <header className="fixed top-0 left-0 lg:right-108 right-0 h-14 z-10">
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
