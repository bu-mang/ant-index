"""감성분석 + 한줄평/스냅샷 생성 작업.

analyze_all() 이 미분석 글을 큐처럼 비우면서 sentiment 라벨링을 끝낸 뒤,
generate_summaries() 를 자동 호출해 종목·시장 한줄평과 시계열 스냅샷을 기록한다.
"""
import logging

from crawler.db import (
    get_active_stocks,
    get_unanalyzed_posts,
    insert_market_summary,
    update_sentiment,
    update_summary,
)
from crawler.sentiment.analyzer import analyze_posts_batch
from crawler.sentiment.summarizer import (
    generate_market_summary,
    generate_summary,
    save_snapshots,
)

log = logging.getLogger(__name__)


def analyze_all() -> None:
    """미분석 글 감성분석 → posts 테이블 업데이트 → 한줄평 생성"""
    total_success = 0
    batch_num = 0

    while True:
        unanalyzed = get_unanalyzed_posts(limit=20)
        if not unanalyzed:
            break

        batch_num += 1
        log.info(
            "─── 감성분석 배치 #%d (%d개 글) ───", batch_num, len(unanalyzed)
        )

        batch_items = [
            {"title": p.title or "", "text": p.content[:200]} for p in unanalyzed
        ]

        # TODO: 종목별 현재가를 넣어야 하지만, 지금은 0으로 대체
        results = analyze_posts_batch(batch_items, price=0)

        for i, post in enumerate(unanalyzed):
            data = results.get(str(i + 1), {})
            label = data.get("result", "")
            reason = data.get("reason", "")

            if label:
                update_sentiment(post.id, label, reason)
                total_success += 1
                log.info("[%s] %s — %s", label, post.title[:30], reason)

    if total_success:
        log.info("감성분석 완료 — 총 %d개 처리", total_success)
    else:
        log.info("감성분석할 글이 없습니다")

    # 감성분석 끝나면 종목별 한줄평 생성
    generate_summaries()


def generate_summaries() -> None:
    """전 종목 한줄평 + 전체 시장 한줄평 생성"""
    stocks = get_active_stocks()
    log.info("─── 한줄평 생성 (%d개 종목) ───", len(stocks))

    for stock in stocks:
        try:
            save_snapshots(stock.id)
            summary = generate_summary(stock.id)
            if summary:
                update_summary(stock.id, summary)
                log.info("[%s] %s", stock.name, summary)
        except Exception as e:
            log.error("[%s] 한줄평 실패: %s", stock.name, e)

    # 전체 시장 한줄평
    try:
        market = generate_market_summary()
        if market:
            insert_market_summary(market)
            log.info("[전체 시장] %s", market)
    except Exception as e:
        log.error("[전체 시장] 한줄평 실패: %s", e)
