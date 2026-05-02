import type { SVGProps } from "react";

export function TaegukIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 100 100"
      xmlns="http://www.w3.org/2000/svg"
      style={{ transform: "rotate(90deg)" }}
      {...props}
    >
      {/* 빨강 (위) */}
      <path
        d="M50,0 A50,50 0 0,0 50,100 A30,30 0 0,0 50,50 A30,30 0 0,1 50,0Z"
        fill="var(--gazua, #E06060)"
      />
      {/* 파랑 (아래) */}
      <path
        d="M50,100 A50,50 0 0,0 50,0 A30,30 0 0,0 50,50 A30,30 0 0,1 50,100Z"
        fill="var(--sb, #6868E0)"
      />
    </svg>
  );
}
