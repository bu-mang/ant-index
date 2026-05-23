"""시세 수집 작업 — 활성 종목 전체의 현재가/투자지표를 1회 수집해 DB 에 저장.

price_all() 진입 시 마지막 clean() 후 24시간 지났으면 자동으로 정리한다.
"""
import logging
import random
import time

from antindex.db import delete_old_prices, get_active_stocks, insert_price
from antindex.scrapers.naver import crawl_price

log = logging.getLogger(__name__)

_last_clean: float = 0.0  # 마지막 clean 실행 시각 (epoch)


def clean() -> None:
    """7일 지난 시세 행 삭제"""
    log.info("─── 오래된 시세 정리 ───")
    deleted = delete_old_prices(days=7)
    log.info("→ %d개 삭제 완료", deleted)


def price_all() -> None:
    """전 종목 시세만 빠르게 크롤링 → stock_prices 테이블에 저장"""
    global _last_clean
    if time.time() - _last_clean > 24 * 60 * 60:
        clean()
        _last_clean = time.time()

    stocks = get_active_stocks()
    log.info("─── 시세 크롤링 (%d개 종목) ───", len(stocks))

    success = 0
    for stock in stocks:
        try:
            price = crawl_price(stock.code)
            if price:
                insert_price(
                    stock.id,
                    price["current_price"],
                    price["change_rate"],
                    volume=price.get("volume"),
                    market_cap=price.get("market_cap"),
                    per=price.get("per"),
                    pbr=price.get("pbr"),
                    dividend_yield=price.get("dividend_yield"),
                    high_52w=price.get("high_52w"),
                    low_52w=price.get("low_52w"),
                )
                log.info(
                    "[%s] %s원 (%+.2f%%)",
                    stock.name,
                    f"{price['current_price']:,}",
                    price["change_rate"],
                )
                success += 1
        except Exception as e:
            log.error("[%s] 시세 크롤링 실패: %s", stock.name, e)
        time.sleep(random.uniform(0.3, 0.8))

    log.info("시세 크롤링 완료 — %d/%d개 종목", success, len(stocks))
