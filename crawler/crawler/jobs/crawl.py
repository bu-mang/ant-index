"""글 수집 작업 — 종토방 글 본문 수집 + 오래된 글 청소.

crawl_all() 진입 시 마지막 clean() 후 24시간 지났으면 자동으로 정리를 한다.
"""
import logging
import random
import time
from datetime import datetime

from crawler.db import delete_old_posts, get_active_stocks, insert_post
from crawler.scrapers.naver import crawl_board, crawl_post_detail

log = logging.getLogger(__name__)

_last_clean: float = 0.0  # 마지막 clean 실행 시각 (epoch)


def clean() -> None:
    """1년 지난 posts 삭제"""
    log.info("─── 오래된 글 정리 ───")
    deleted = delete_old_posts(days=365)
    log.info("→ %d개 삭제 완료", deleted)


def crawl_all() -> None:
    """전 종목 크롤링 → posts 테이블에 저장 (종목당 5페이지 ≈ 100개)"""
    global _last_clean
    if time.time() - _last_clean > 24 * 60 * 60:
        clean()
        _last_clean = time.time()

    stocks = get_active_stocks()
    log.info("─── 크롤링 시작 (%d개 종목) ───", len(stocks))

    total_new = 0
    for stock in stocks:
        stock_id = stock.id
        stock_code = stock.code
        stock_name = stock.name

        log.info("[%s] 종토방 크롤링 중...", stock_name)
        board_posts = crawl_board(stock_code)

        new_count = 0
        for post in board_posts:
            detail = crawl_post_detail(stock_code, post["nid"])
            if not detail:
                continue

            posted_at = None
            try:
                posted_at = datetime.strptime(post["date"], "%Y.%m.%d %H:%M")
            except (ValueError, TypeError):
                pass

            inserted = insert_post(
                stock_id=stock_id,
                external_id=post["nid"],
                title=post["title"],
                content=detail["body"],
                views=detail["views"],
                likes=detail["likes"],
                dislikes=detail["dislikes"],
                posted_at=posted_at,
            )
            if inserted:
                new_count += 1

            time.sleep(random.uniform(0.5, 1.5))  # 요청 간 딜레이

        total_new += new_count
        log.info(
            "[%s] → %d개 새 글 저장 (전체 %d개 중)",
            stock_name,
            new_count,
            len(board_posts),
        )
        time.sleep(random.uniform(1, 3))  # 종목 간 딜레이

    log.info("크롤링 완료 — 총 %d개 새 글 저장", total_new)
