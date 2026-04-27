"""종목별/시장 한줄평 생성 — Ollama LLM으로 ㅅㅂ지수/가즈아지수 + 시세를 종합 요약"""
import json
import requests
from datetime import datetime, timedelta
from sqlalchemy import select, func, case
from crawler.config import OLLAMA_URL, OLLAMA_MODEL
from crawler.db import engine, posts, stocks, stock_prices

STOCK_SUMMARY_PROMPT = """너는 주식 시장 분위기 요약가야. 아래 지표를 보고 한줄평을 작성해.

종목: {stock_name} ({stock_code})
ㅅㅂ지수: {sb_index} ({sb_label}) — 높을수록 비관/공포
가즈아지수: {gazua_index} ({gazua_label}) — 높을수록 낙관/탐욕
현재가: {price_info}
분석 글 수: {total_posts}개

규칙:
- 한국어로 1문장, 최대 50자
- 투자자 입장에서 커뮤니티 분위기를 요약
- 수치를 반복하지 말고 분위기와 느낌을 전달
- 예: "주가 하락 속 비관론 확산, 투매 분위기", "강한 반등에 낙관론 우세"

반드시 아래 JSON 형식으로만 답해:
{{"summary": "한줄평 내용"}}"""

MARKET_SUMMARY_PROMPT = """너는 주식 시장 분위기 요약가야. 국내주식 전체의 지표를 보고 한줄평을 작성해.

국내주식 전체 (30종목 평균):
ㅅㅂ지수: {sb_index} ({sb_label}) — 높을수록 비관/공포
가즈아지수: {gazua_index} ({gazua_label}) — 높을수록 낙관/탐욕
분석 글 수: {total_posts}개

규칙:
- 한국어로 1문장, 최대 50자
- 투자자 입장에서 커뮤니티 전체 분위기를 요약
- 수치를 반복하지 말고 분위기와 느낌을 전달
- 예: "시장 전반 관망세, 뚜렷한 방향 없음", "공포 확산 중, 투매 심리 강함"

반드시 아래 JSON 형식으로만 답해:
{{"summary": "한줄평 내용"}}"""

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
    since = datetime.now() - timedelta(hours=24)

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
        "options": {"temperature": 0.7},
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


def generate_market_summary():
    """전체 시장 한줄평 생성 — 전 종목 평균 지수로 Ollama 호출"""
    since = datetime.now() - timedelta(hours=24)

    with engine.connect() as conn:
        # 활성 종목 ID 목록
        active_ids = [
            row.id for row in
            conn.execute(select(stocks.c.id).where(stocks.c.is_active == True)).fetchall()
        ]

    if not active_ids:
        return None

    # 종목별 지수 계산 → 평균
    sb_total, gazua_total, posts_total, count = 0, 0, 0, 0
    for stock_id in active_ids:
        sb, gazua, total_posts = calculate_index(stock_id)
        if total_posts > 0:
            sb_total += sb
            gazua_total += gazua
            posts_total += total_posts
            count += 1

    if count == 0:
        return None

    avg_sb = round(sb_total / count, 2)
    avg_gazua = round(gazua_total / count, 2)

    prompt = MARKET_SUMMARY_PROMPT.format(
        sb_index=avg_sb,
        sb_label=get_label(avg_sb, SB_LABELS),
        gazua_index=avg_gazua,
        gazua_label=get_label(avg_gazua, GAZUA_LABELS),
        total_posts=posts_total,
    )

    return call_ollama(prompt)
