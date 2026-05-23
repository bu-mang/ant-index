"""종목별/시장 한줄평 생성 — ㅅㅂ지수/가즈아지수를 5×5 티어로 매핑한 프리셋 사용 (AI 미사용)

DB 쿼리는 전부 crawler.db 의 헬퍼를 통해서만 한다 (이 모듈은 비즈니스 로직 전담).
"""
from datetime import datetime, timedelta, timezone
from crawler.db import (
    insert_snapshot,
    get_active_stocks,
    get_sentiment_weights,
)

# 한줄평 프리셋 — SB(공포) 5단계 × GAZUA(탐욕) 5단계 = 25개
# PRESETS[sb_tier][gazua_tier] — 종목 한줄평·시장 한줄평 공용
# (종목별로 다른 문구를 쓰고 싶으면 STOCK_PRESETS 를 따로 만들어 generate_summary 에서 참조)
PRESETS = [
    #              침체                    조용                    보통                   흥분                     매우환희
    # 매우평온
    ["그리고 아무도 없었다",   "종토방엔 풀만 자란다...",   "평화로운 하루",       "슬금슬금 올라오는데",     "쉿 조용히 올라가는 중"],
    # 평온
    ["다 손절하고 떠났나",     "눈치만 살살 보는 중",    "별 일 없는 하루",     "슬슬 가즈아 각?",      "약간은 불안하지만 장은 간다. 고고!"],
    # 보통
    ["찬바람이 쌩쌩 분다",     "뭔가 불안한 기류",     "갈팡질팡하는 중",       "가는 놈은 가는거 같은데...", "일단 랠리는 즐겨!"],
    # 불안
    ["개미지옥 오픈 중...", "존버가 맞긴 한 건가", "멘탈이 흔들리는 중",  "아슬아슬 줄타기 중",     "지르면서 손 떨고 있다"],
    # 매우공포
    ["돔황챠!!!!",           "제발 살려줘",            "개미 떼죽음 현장",      "변동성이 미친 수준인데..", "극심한 변동성으로 롱숏 모두 선혈이 낭자"],
]

# 하위 호환 — 기존에 MARKET_PRESETS 를 import 하던 코드용 별칭
MARKET_PRESETS = PRESETS


def _to_tier(value):
    """0~100 값을 0~4 티어로 변환"""
    return min(int(value // 20), 4)


def _preset_for(sb, gazua):
    return PRESETS[_to_tier(sb)][_to_tier(gazua)]


def calculate_index(stock_id):
    """최근 24시간 분석 결과로 ㅅㅂ/가즈아 지수 계산 → (sb, gazua, total_posts).

    가중치 합계 0(분석된 글 없음) 이면 (0, 0, 0) 반환.
    """
    row = get_sentiment_weights(stock_id, hours=24)

    total_weight = float(row.total_weight or 0)
    bull_weight = float(row.bull_weight or 0)
    bear_weight = float(row.bear_weight or 0)
    total_posts = int(row.total_posts or 0)

    if total_weight == 0:
        return 0, 0, 0

    sb = round(bear_weight / total_weight * 100, 2)
    gazua = round(bull_weight / total_weight * 100, 2)
    return sb, gazua, total_posts


def generate_summary(stock_id):
    """종목 한줄평 생성 — ㅅㅂ/가즈아 지수 티어에 해당하는 프리셋 반환 (글 없으면 None)"""
    sb, gazua, total_posts = calculate_index(stock_id)
    if total_posts == 0:
        return None
    return _preset_for(sb, gazua)


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


def generate_market_summary():
    """전체 시장 한줄평 생성 — 종목별 지수 평균을 티어로 매핑한 프리셋 반환"""
    active = get_active_stocks()
    if not active:
        return None

    # 종목별 지수 계산 → 평균
    sb_total, gazua_total, count = 0, 0, 0
    for stock in active:
        sb, gazua, total_posts = calculate_index(stock.id)
        if total_posts > 0:
            sb_total += sb
            gazua_total += gazua
            count += 1

    if count == 0:
        return None

    avg_sb = round(sb_total / count, 2)
    avg_gazua = round(gazua_total / count, 2)
    return _preset_for(avg_sb, avg_gazua)
