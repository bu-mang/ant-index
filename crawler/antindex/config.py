"""크롤러 설정"""
import os
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")

# 감성분석/요약 LLM 백엔드: "gemini"(기본) | "ollama"(로컬 폴백)
SENTIMENT_PROVIDER = os.getenv("SENTIMENT_PROVIDER", "gemini")

# Gemini API (무료 티어) — 키 발급: https://aistudio.google.com/apikey
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-2.5-flash-lite")

# 무료 티어 분당 요청 제한 — 이 값으로 호출 간 간격을 throttle (0이면 비활성)
GEMINI_RPM = int(os.getenv("GEMINI_RPM", "15"))

# Ollama (로컬 폴백) — SENTIMENT_PROVIDER=ollama 일 때 사용
OLLAMA_URL = os.getenv("OLLAMA_URL", "http://localhost:11434")
OLLAMA_MODEL = os.getenv("OLLAMA_MODEL", "exaone3.5:2.4b")
