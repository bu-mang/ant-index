import type { NextConfig } from "next";
import path from "node:path";

const isDev = process.env.NODE_ENV !== "production";

const nextConfig: NextConfig = {
  // Docker 배포용 minimal standalone 서버 출력 (.next/standalone/server.js).
  output: "standalone",

  // 개발 모드에서만 워크스페이스 루트(ant-index/)를 명시 — next dev 의
  // lock 파일 탐색이 monorepo 상위로 새는 것 방지. 컨테이너에선 의미 없음.
  ...(isDev && {
    turbopack: {
      root: path.join(__dirname, ".."),
    },
  }),
};

export default nextConfig;
