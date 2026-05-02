"use client";

import Link from "next/link";
import { ThemeToggle } from "@/components/theme-toggle";

export function Header() {
  return (
    <header className="fixed top-0 left-0 lg:right-108 right-0 h-14 z-10">
      <nav className="max-w-432 mx-auto px-12 h-full flex items-center justify-between">
        <Link
          href="/"
          className="text-xl font-normal tracking-tight"
          style={{ fontFamily: '"Mbc1961", sans-serif' }}
        >
          개미지표
        </Link>
        <ThemeToggle />
      </nav>
    </header>
  );
}
