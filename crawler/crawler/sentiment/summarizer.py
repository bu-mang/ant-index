"""종목별/시장 한줄평 생성 — Ollama LLM으로 ㅅㅂ지수/가즈아지수 + 시세를 종합 요약"""
import json
import requests
from datetime import datetime, timedelta, timezone
from sqlalchemy import select, func, case
from crawler.config import OLLAMA_URL, OLLAMA_MODEL
from crawler.db import engine, posts, stocks, stock_prices, insert_snapshot
from crawler.sources.naver import crawl_kospi

STOCK_SUMMARY_PROMPT = """너는 주식 시장 분위기 요약가야. 아래 지표를 보고 한줄평을 작성해.

종목: {stock_name} ({stock_code})
ㅅㅂ지수: {sb_index} ({sb_label}) — 높을수록 비관/공포
가즈아지수: {gazua_index} ({gazua_label}) — 높을수록 낙관/탐욕
현재가: {price_info}

규칙:
- 한국어, 반드시 10자 이내 (공백 포함)
- 반말, 감성적, 뉴스체 금지
- 수치·지표 이름 절대 언급 금지
- 반드시 아래 단계에 맞는 톤으로 써라:

ㅅㅂ지수 단계별 톤:
- 극도의 평온 (0~20): 잠잠함, 무풍지대 → 예: "고요하다", "바람 한 점 없다"
- 평온 (20~40): 약간 불만 있지만 잔잔 → 예: "잔잔하네", "좀 심심하다"
- 보통 (40~60): 반반, 갈팡질팡 → 예: "갈피를 못 잡네", "반반이다"
- 불안 (60~80): 걱정 많고 예민 → 예: "불안하다", "흔들리는 중"
- 극도의 공포 (80~100): 패닉, 절망 → 예: "멘탈 나갔다", "아비규환"

가즈아지수 단계별 톤:
- 침체 (0~20): 관심 없음, 의욕 없음 → 예: "관심 없다", "다 떠났다"
- 조용 (20~40): 소극적 관망 → 예: "지켜보는 중", "눈치 보는 중"
- 보통 (40~60): 보통 → 예: "그냥저냥", "평범한 하루"
- 흥분 (60~80): 매수세 활발 → 예: "신나는 중", "달린다"
- 극도의 환희 (80~100): 폭발적 낙관 → 예: "축제 분위기", "불장이다"

두 지표를 종합해서 한줄평을 작성해라.

반드시 아래 JSON 형식으로만 답해:
{{"summary": "한줄평 내용"}}"""

# 시장 한줄평 프리셋 — SB(공포) 5단계 × GAZUA(탐욕) 5단계 = 25개
# MARKET_PRESETS[sb_tier][gazua_tier]
MARKET_PRESETS = [
    #              침체                    조용                    보통                   흥분                     매우환희
    # 매우평온
    ["그리고 아무도 없었다",   "종토방에 풀만 자란다",   "평화로운 하루다",       "슬금슬금 올라오는데",     "쉿 조용히 올라가는 중"],
    # 평온
    ["다 손절하고 떠났나",     "눈치만 살살 보는 중",    "별 일 없는 하루다",     "슬슬 냄새 나는데?",      "은근히 분위기 좋은데"],
    # 보통
    ["찬바람이 쌩쌩 분다",     "뭔가 불안한 기류다",     "갈팡질팡하는 중",       "오락가락 종잡을 수 없다", "반은 지르고 반은 떨고"],
    # 불안
    ["조용히 시장참여자가 증발 중...", "존버가 맞긴 한 건가", "멘탈이 흔들리는 중",  "아슬아슬 줄타기 중",     "지르면서 손 떨고 있다"],
    # 매우공포
    ["시즌 종료다!",           "제발 살려줘",            "개미 떼죽음 현장",      "변동성이 미친 수준인데..", "극심한 변동성으로 롱숏 모두 선혈이 낭자하네"],
]

MARKET_REPHRASE_PROMPT = """아래 문장의 의미와 길이를 유지하면서, 어미나 말투만 살짝 바꿔서 다시 써줘.

원문: "{preset}"

규칙:
- 의미를 절대 바꾸지 마
- 단어를 추가하거나 빼지 마
- 어미, 종결 표현, 말투만 변주해 (예: "~다" → "~네", "~중" → "~중이다")
- 반말 유지, 뉴스체 금지
- 반드시 아래 JSON 형식으로만 답해:
{{"summary": "변주된 문장"}}"""

SB_LABELS = [
    (20, "극도의 평온"),
    (40, "평온"),
    (60, "보통"),
    (80, "불안"),
    (100, "극도의 공포"),
]

GAZUA_LABELS = [
    (20, "침체"),
    (40, "조용"),
    (60, "보통"),
    (80, "흥분"),
    (100, "극도의 환희"),
]


def get_label(value, labels):
    for max_val, label in labels:
        if value <= max_val:
            return label
    return labels[-1][1]


def calculate_index(stock_id):
    """최근 24시간 posts에서 ㅅㅂ/가즈아 지수 계산"""
    since = datetime.now(timezone.utc) - timedelta(hours=24)

    with engine.connect() as conn:
        result = conn.execute(
            select(
                func.sum(1 + func.log(func.greatest(posts.c.like_count, 0) + 1)).label("total_weight"),
                func.sum(
                    case(
                        (posts.c.sentiment_label == "BULL", 1 + func.log(func.greatest(posts.c.like_count, 0) + 1)),
                        else_=0,
                    )
                ).label("bull_weight"),
                func.sum(
                    case(
                        (posts.c.sentiment_label == "BEAR", 1 + func.log(func.greatest(posts.c.like_count, 0) + 1)),
                        else_=0,
                    )
                ).label("bear_weight"),
                func.count().label("total_posts"),
            )
            .where(posts.c.stock_id == stock_id)
            .where(posts.c.crawled_at >= since)
            .where(posts.c.sentiment_label.isnot(None))
        ).fetchone()

    total_weight = float(result.total_weight or 0)
    bull_weight = float(result.bull_weight or 0)
    bear_weight = float(result.bear_weight or 0)
    total_posts = int(result.total_posts or 0)

    if total_weight == 0:
        return 0, 0, 0

    sb = round(bear_weight / total_weight * 100, 2)
    gazua = round(bull_weight / total_weight * 100, 2)
    return sb, gazua, total_posts


def get_latest_price_for_stock(stock_id):
    """종목 최신 시세 조회"""
    with engine.connect() as conn:
        result = conn.execute(
            select(stock_prices.c.current_price, stock_prices.c.change_rate)
            .where(stock_prices.c.stock_id == stock_id)
            .order_by(stock_prices.c.updated_at.desc())
            .limit(1)
        ).fetchone()
        return result


def call_ollama(prompt):
    """Ollama에 프롬프트를 보내고 summary 텍스트를 반환"""
    res = requests.post(f"{OLLAMA_URL}/api/generate", json={
        "model": OLLAMA_MODEL,
        "prompt": prompt,
        "stream": False,
        "format": "json",
        "options": {"temperature": 0.5},
    })
    parsed = json.loads(res.json()["response"])
    return parsed.get("summary")


def generate_summary(stock_id, stock_name, stock_code):
    """종목 한줄평 생성 — 감성지수 + 시세를 포함한 프롬프트로 Ollama 호출"""
    sb, gazua, total_posts = calculate_index(stock_id)
    if total_posts == 0:
        return None

    # 시세 정보
    price_row = get_latest_price_for_stock(stock_id)
    if price_row and price_row.current_price:
        price_info = f"{price_row.current_price:,}원 ({float(price_row.change_rate):+.2f}%)"
    else:
        price_info = "시세 데이터 없음"

    prompt = STOCK_SUMMARY_PROMPT.format(
        stock_name=stock_name,
        stock_code=stock_code,
        sb_index=sb,
        sb_label=get_label(sb, SB_LABELS),
        gazua_index=gazua,
        gazua_label=get_label(gazua, GAZUA_LABELS),
        price_info=price_info,
        total_posts=total_posts,
    )

    return call_ollama(prompt)


def save_snapshots(stock_id):
    """종목의 SB/GAZUA 스냅샷을 index_snapshots에 저장"""
    sb, gazua, total_posts = calculate_index(stock_id)
    if total_posts == 0:
        return

    now = datetime.now(timezone.utc)
    period_end = now
    period_start = now - timedelta(hours=24)

    insert_snapshot(stock_id, "SB", sb, sb, total_posts, period_start, period_end)
    insert_snapshot(stock_id, "GAZUA", gazua, gazua, total_posts, period_start, period_end)


def get_market_price_stats():
    """30종목 평균 등락률, 상승/하락/보합 수 계산"""
    with engine.connect() as conn:
        active = conn.execute(
            select(stocks.c.id).where(stocks.c.is_active == True)
        ).fetchall()

    up, down, flat = 0, 0, 0
    rates = []

    for row in active:
        price = get_latest_price_for_stock(row.id)
        if price and price.change_rate is not None:
            rate = float(price.change_rate)
            rates.append(rate)
            if rate > 0.01:
                up += 1
            elif rate < -0.01:
                down += 1
            else:
                flat += 1

    avg_rate = round(sum(rates) / len(rates), 2) if rates else 0
    return avg_rate, up, down, flat


def _to_tier(value):
    """0~100 값을 0~4 티어로 변환"""
    return min(int(value // 20), 4)


def generate_market_summary():
    """전체 시장 한줄평 생성 — 프리셋 기반 + LLM 어미 변주"""
    with engine.connect() as conn:
        active_ids = [
            row.id for row in
            conn.execute(select(stocks.c.id).where(stocks.c.is_active == True)).fetchall()
        ]

    if not active_ids:
        return None

    # 종목별 지수 계산 → 평균
    sb_total, gazua_total, count = 0, 0, 0
    for stock_id in active_ids:
        sb, gazua, total_posts = calculate_index(stock_id)
        if total_posts > 0:
            sb_total += sb
            gazua_total += gazua
            count += 1

    if count == 0:
        return None

    avg_sb = round(sb_total / count, 2)
    avg_gazua = round(gazua_total / count, 2)

    # 프리셋 선택
    preset = MARKET_PRESETS[_to_tier(avg_sb)][_to_tier(avg_gazua)]

    # LLM으로 어미/말투만 살짝 변주
    prompt = MARKET_REPHRASE_PROMPT.format(preset=preset)
    rephrased = call_ollama(prompt)

    return rephrased if rephrased else preset
