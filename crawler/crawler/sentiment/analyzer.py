"""Ollama + Exaone LLM 기반 감성분석"""
import requests
import json
from crawler.config import OLLAMA_URL, OLLAMA_MODEL

PROMPT_TEMPLATE = """너는 주식 커뮤니티 감성 분석기야. 글의 제목과 본문을 보고 작성자의 시장 심리를 판별해.

판별 기준:
- 상승론자: 주가 상승 기대, 매수 권유, 낙관, 하락론자 조롱
- 하락론자: 주가 하락 우려/예측, 비관, 불안, 상승론자 조롱, 비꼬기
- 중립: 단순 정보 공유, 질문, 판단 불가

톤으로도 판단해:
- "ㅜㅜ", "우짜노", "갈등생기네" → 불안/걱정 = 하락론자
- "ㅋㅋ 폭등", "퀀텀점프" → 기대 = 상승론자
- "~약한데", "~유지해줘야 하는데" → 걱정 = 하락론자
- 불안, 걱정, 한숨 톤은 중립이 아니라 하락론자야.

비꼬기/풍자 판단법:
- "고잘이야 ㅋㅋ", "한국인특징" → 매수자를 비웃는 것 = 하락론자
- "역시 개미는 천재야 ㅋㅋ" → 개미를 비꼬는 것 = 하락론자
- "ㅋㅋ"와 함께 부정적 상황을 묘사하면 비꼬기 = 하락론자
- "ㅋㅋ"와 함께 하락론자/숏충이를 깔보면 = 상승론자

예시:
글: 숏충이들 오늘도 돈 잃었냐 ㅋㅋ → 상승론자
글: 존버하다 결국 반토막 ㅋㅋ → 하락론자
글: 떡상 가즈아!!! → 상승론자
글: 이 주식 끝났다 빨리 탈출해 → 하락론자
글: 마이크론하고 반도체지수만 보면 됨 → 중립
글: 반도체지수 너무 약한데... 갈등생기네 → 하락론자
글: 미장폭등하네 국장판애들어쩌냐 → 상승론자
글: 비쌀때 산다 ㅋㅋ 고잘이야 → 하락론자
글: ㅜㅜ 낼 우짜노 → 하락론자
글: 역시 한국인은 비쌀때 사고 쌀때 팔고 ㅋㅋ → 하락론자
글: 엔비디아 강보합이고... 갈등생기네... 유지해줘야 하는데 → 하락론자

판별할 글: {text}
참고: 이 종목의 현재 주가는 {price}원이다.

반드시 아래 JSON 형식으로만 답해:
{{"result": "상승론자", "reason": "한줄 이유"}}
result는 상승론자/하락론자/중립 중 하나만 사용해."""

BATCH_PROMPT_TEMPLATE = """너는 주식 커뮤니티 감성 분석기야. 아래 글 목록을 각각 판별해.

판별 기준:
- 상승론자: 주가 상승 기대, 매수 권유, 낙관, 하락론자 조롱
- 하락론자: 주가 하락 우려/예측, 비관, 불안, 상승론자 조롱, 비꼬기
- 중립: 단순 정보 공유, 질문, 판단 불가

톤으로도 판단해:
- "ㅜㅜ", "우짜노", "갈등생기네" → 불안/걱정 = 하락론자
- "ㅋㅋ 폭등", "퀀텀점프" → 기대 = 상승론자
- "~약한데", "~유지해줘야 하는데" → 걱정 = 하락론자
- 불안, 걱정, 한숨 톤은 중립이 아니라 하락론자야.

비꼬기/풍자 판단법:
- "고잘이야 ㅋㅋ", "한국인특징" → 매수자를 비웃는 것 = 하락론자
- "ㅋㅋ"와 함께 부정적 상황을 묘사하면 비꼬기 = 하락론자
- "ㅋㅋ"와 함께 하락론자/숏충이를 깔보면 = 상승론자

참고: 이 종목의 현재 주가는 {price}원이다.

글 목록:
{posts}

반드시 아래 JSON 형식으로만 답해. 각 글에 대해 번호를 키로 사용해:
{{"1": {{"result": "상승론자", "reason": "한줄 이유"}}, "2": {{"result": "하락론자", "reason": "한줄 이유"}}, ...}}
result는 상승론자/하락론자/중립 중 하나만 사용해."""


def ask_ollama(text, price):
    """단일 글 감성분석"""
    response = requests.post(f"{OLLAMA_URL}/api/generate", json={
        "model": OLLAMA_MODEL,
        "prompt": PROMPT_TEMPLATE.format(text=text, price=price),
        "stream": False,
        "format": "json",
        "options": {
            "temperature": 0.5,
        }
    })
    return json.loads(response.json()["response"])


def ask_ollama_batch(items, price):
    """여러 글 배치 감성분석"""
    posts = "\n".join([f"{i+1}. {item['title']} {item['text']}" for i, item in enumerate(items)])
    response = requests.post(f"{OLLAMA_URL}/api/generate", json={
        "model": OLLAMA_MODEL,
        "prompt": BATCH_PROMPT_TEMPLATE.format(posts=posts, price=price),
        "stream": False,
        "format": "json",
        "options": {
            "temperature": 0.5,
        }
    })
    return json.loads(response.json()["response"])
