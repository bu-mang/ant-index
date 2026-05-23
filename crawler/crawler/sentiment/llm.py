"""LLM 추상화 — 프롬프트를 JSON 모드로 보내고 파싱된 dict를 반환.

SENTIMENT_PROVIDER 환경변수로 백엔드 선택:
  - "gemini" (기본): Google Gemini API (무료 티어). GEMINI_API_KEY 필요.
  - "ollama": 로컬 Ollama (오프라인/레이트리밋 폴백용).

호출 실패(네트워크/파싱/레이트리밋)는 예외를 던지지 않고 빈 dict({})를 반환한다.
호출부는 빈 dict를 "이 건 건너뜀"으로 처리하면 된다.
"""
import json
import logging
import time
from typing import Any

import requests

from crawler.config import (
    SENTIMENT_PROVIDER,
    GEMINI_API_KEY,
    GEMINI_MODEL,
    GEMINI_RPM,
    OLLAMA_URL,
    OLLAMA_MODEL,
)

_GEMINI_ENDPOINT = "https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent"

log = logging.getLogger(__name__)

# 무료 티어 RPM 제한 대응 — 마지막 호출 시각 (LLM 호출은 단일 스레드에서만 일어남)
_last_call = 0.0


def _throttle(rpm: int) -> None:
    """분당 요청 수를 넘지 않도록 호출 간 최소 간격을 확보한다."""
    global _last_call
    if rpm <= 0:
        return
    min_gap = 60.0 / rpm
    elapsed = time.time() - _last_call
    if elapsed < min_gap:
        time.sleep(min_gap - elapsed)
    _last_call = time.time()


def _ask_gemini(prompt: str, temperature: float, retries: int = 2) -> dict[str, Any]:
    if not GEMINI_API_KEY:
        raise RuntimeError("GEMINI_API_KEY가 설정되지 않았습니다 (crawler/.env 확인)")

    _throttle(GEMINI_RPM)
    res = requests.post(
        _GEMINI_ENDPOINT.format(model=GEMINI_MODEL),
        params={"key": GEMINI_API_KEY},
        json={
            "contents": [{"parts": [{"text": prompt}]}],
            "generationConfig": {
                "temperature": temperature,
                "responseMimeType": "application/json",
            },
        },
        timeout=60,
    )

    # 레이트리밋(429) / 일시적 5xx → 잠깐 쉬었다 재시도
    if res.status_code in (429, 500, 503) and retries > 0:
        wait = 30
        log.warning("Gemini %d — %ds 대기 후 재시도 (남은 %d회)", res.status_code, wait, retries)
        time.sleep(wait)
        return _ask_gemini(prompt, temperature, retries - 1)

    res.raise_for_status()
    data = res.json()
    candidates = data.get("candidates") or []
    if not candidates:
        raise ValueError(f"Gemini 응답에 candidates 없음: {data.get('promptFeedback')}")

    parts = candidates[0].get("content", {}).get("parts") or []
    if not parts:
        raise ValueError(f"Gemini 응답에 parts 없음 (finishReason={candidates[0].get('finishReason')})")

    return json.loads(parts[0]["text"])


def _ask_ollama(prompt: str, temperature: float) -> dict[str, Any]:
    res = requests.post(
        f"{OLLAMA_URL}/api/generate",
        json={
            "model": OLLAMA_MODEL,
            "prompt": prompt,
            "stream": False,
            "format": "json",
            "options": {"temperature": temperature},
        },
        timeout=120,
    )
    res.raise_for_status()
    return json.loads(res.json()["response"])


def complete_json(prompt: str, temperature: float = 0.5) -> dict[str, Any]:
    """프롬프트를 LLM에 보내고 JSON 응답을 dict로 파싱해 반환. 실패 시 {}."""
    try:
        if SENTIMENT_PROVIDER == "ollama":
            return _ask_ollama(prompt, temperature)
        return _ask_gemini(prompt, temperature)
    except (requests.RequestException, ValueError, KeyError, IndexError) as e:
        # ValueError는 json.JSONDecodeError 포함
        log.warning("LLM 호출 실패 (%s): %s", type(e).__name__, e)
        return {}
