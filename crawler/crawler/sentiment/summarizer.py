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
분석 글 수: {total_posts}개

규칙:
- 한국어로 1문장, 반드시 50자 이하
- 개미 투자자의 감정을 생생하게 표현해라
- 뉴스 기사체 금지. 친구한테 말하듯 짧고 감성적으로
- 수치, 지표 이름 절대 언급 금지
- 존댓말 금지, 반말로
- 20~35자 권장
- 예: "다들 물타기 중인데 반등 올까", "분위기 좋다, 매수세 몰리는 중", "조용하다... 관망 분위기"

반드시 아래 JSON 형식으로만 답해:
{{"summary": "한줄평 내용"}}"""

MARKET_SUMMARY_PROMPT = """너는 주식 시장 분위기 요약가야. 국내주식 전체의 지표를 보고 한줄평을 작성해.

코스피: {kospi_info}
국내주식 30종목 기준:
ㅅㅂ지수: {sb_index} ({sb_label}) — 높을수록 비관/공포
가즈아지수: {gazua_index} ({gazua_label}) — 높을수록 낙관/탐욕
평균 등락률: {avg_change_rate}
상승/하락: {up_count}개 상승, {down_count}개 하락, {flat_count}개 보합
분석 글 수: {total_posts}개

규칙:
- 한국어로 1문장, 반드시 50자 이하
- 개미 투자자의 감정을 생생하게 표현해라
- 뉴스 기사체 금지. 친구한테 말하듯 짧고 감성적으로
- 수치, 지표 이름 절대 언급 금지
- 존댓말 금지, 반말로
- 20~35자 권장
- 예: "다들 신나서 매수 때리는 중", "바닥이 어딘지 모르겠다는 공포", "조용하다... 너무 조용해"

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


def generate_market_summary():
    """전체 시장 한줄평 생성 — 전 종목 평균 지수 + 시세 통계로 Ollama 호출"""
    with engine.connect() as conn:
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

    # 시세 통계
    avg_rate, up, down, flat = get_market_price_stats()

    # 코스피 지수
    kospi = crawl_kospi()
    if kospi:
        kospi_info = f"{kospi['value']:,.2f} ({kospi['change_rate']:+.2f}%)"
    else:
        kospi_info = "데이터 없음"

    prompt = MARKET_SUMMARY_PROMPT.format(
        kospi_info=kospi_info,
        sb_index=avg_sb,
        sb_label=get_label(avg_sb, SB_LABELS),
        gazua_index=avg_gazua,
        gazua_label=get_label(avg_gazua, GAZUA_LABELS),
        avg_change_rate=f"{avg_rate:+.2f}%",
        up_count=up,
        down_count=down,
        flat_count=flat,
        total_posts=posts_total,
    )

    return call_ollama(prompt)
