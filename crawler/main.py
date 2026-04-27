"""개미지표 크롤러 엔트리포인트

사용법:
  python main.py              # 크롤링 1회 + 분석 1회
  python main.py crawl        # 크롤링만 1회
  python main.py analyze      # 분석만 1회
  python main.py clean        # 1년 지난 글 삭제 1회
  python main.py loop         # 크롤링 + 분석 30분 주기 반복
  python main.py loop-crawl   # 크롤링만 30분 주기 반복 (24시간마다 자동 clean)
  python main.py loop-analyze # 분석만 30분 주기 반복 (분석 후 한줄평 자동 생성)
"""
import time
import random
from datetime import datetime
from crawler.db import get_active_stocks, insert_post, insert_price, get_unanalyzed_posts, update_sentiment, delete_old_posts, update_summary, insert_market_summary
from crawler.sources.naver import crawl_board, crawl_post_detail, crawl_price
from crawler.sentiment.analyzer import ask_ollama_batch
from crawler.sentiment.summarizer import generate_summary, generate_market_summary, save_snapshots

LOOP_INTERVAL = 30 * 60  # 30분 (초)


_last_clean = 0  # 마지막 clean 실행 시각


def crawl_all():
    """전 종목 크롤링 → posts 테이블에 저장 (종목당 5페이지 ≈ 100개)"""
    global _last_clean
    if time.time() - _last_clean > 24 * 60 * 60:
        clean()
        _last_clean = time.time()

    stocks = get_active_stocks()
    print(f"\n=== 크롤링 시작 ({len(stocks)}개 종목) [{datetime.now().strftime('%H:%M:%S')}] ===\n")

    total_new = 0
    for stock in stocks:
        stock_id = stock.id
        stock_code = stock.code
        stock_name = stock.name

        # 시세 크롤링
        try:
            price = crawl_price(stock_code)
            if price:
                insert_price(stock_id, price["current_price"], price["change_rate"])
                print(f"[{stock_name}] 시세: {price['current_price']:,}원 ({price['change_rate']:+.2f}%)")
        except Exception as e:
            print(f"[{stock_name}] 시세 크롤링 실패: {e}")

        # 종토방 크롤링
        print(f"[{stock_name}] 종토방 크롤링 중...")
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
        print(f"  → {new_count}개 새 글 저장 (전체 {len(board_posts)}개 중)")
        time.sleep(random.uniform(1, 3))  # 종목 간 딜레이

    print(f"\n크롤링 완료! 총 {total_new}개 새 글 저장\n")


def analyze_all():
    """미분석 글 감성분석 → posts 테이블 업데이트 → 한줄평 생성"""
    total_success = 0
    batch_num = 0

    while True:
        unanalyzed = get_unanalyzed_posts(limit=20)
        if not unanalyzed:
            break

        batch_num += 1
        print(f"\n=== 감성분석 배치 #{batch_num} ({len(unanalyzed)}개 글) [{datetime.now().strftime('%H:%M:%S')}] ===\n")

        batch_items = [{"title": p.title or "", "text": p.content[:200]} for p in unanalyzed]

        # TODO: 종목별 현재가를 넣어야 하지만, 지금은 0으로 대체
        results = ask_ollama_batch(batch_items, price=0)

        for i, post in enumerate(unanalyzed):
            data = results.get(str(i + 1), {})
            label = data.get("result", "")
            reason = data.get("reason", "")

            if label:
                update_sentiment(post.id, label, reason)
                total_success += 1
                print(f"  [{label}] {post.title[:30]} — {reason}")

    if total_success:
        print(f"\n감성분석 완료! 총 {total_success}개 처리\n")
    else:
        print("감성분석할 글이 없습니다.")

    # 감성분석 끝나면 종목별 한줄평 생성
    generate_summaries()


def generate_summaries():
    """전 종목 한줄평 + 전체 시장 한줄평 생성"""
    stocks = get_active_stocks()
    print(f"\n=== 한줄평 생성 ({len(stocks)}개 종목) [{datetime.now().strftime('%H:%M:%S')}] ===\n")

    for stock in stocks:
        try:
            save_snapshots(stock.id)
            summary = generate_summary(stock.id, stock.name, stock.code)
            if summary:
                update_summary(stock.id, summary)
                print(f"  [{stock.name}] {summary}")
        except Exception as e:
            print(f"  [{stock.name}] 한줄평 실패: {e}")

    # 전체 시장 한줄평
    try:
        market = generate_market_summary()
        if market:
            insert_market_summary(market)
            print(f"\n  [전체 시장] {market}")
    except Exception as e:
        print(f"\n  [전체 시장] 한줄평 실패: {e}")


def clean():
    """1년 지난 posts 삭제"""
    print(f"\n=== 오래된 글 정리 [{datetime.now().strftime('%H:%M:%S')}] ===\n")
    deleted = delete_old_posts(days=365)
    print(f"  → {deleted}개 삭제 완료\n")


def run_loop(task, interval=LOOP_INTERVAL):
    """지정된 작업을 interval 간격으로 반복 실행"""
    while True:
        start = time.time()
        try:
            task()
        except Exception as e:
            print(f"\n[에러] {e}\n")

        elapsed = time.time() - start
        wait = max(0, interval - elapsed)
        if wait > 0:
            print(f"다음 실행까지 {int(wait // 60)}분 {int(wait % 60)}초 대기...")
            time.sleep(wait)


if __name__ == "__main__":
    import sys

    command = sys.argv[1] if len(sys.argv) > 1 else "once"

    if command == "once":
        crawl_all()
        analyze_all()
    elif command == "crawl":
        crawl_all()
    elif command == "analyze":
        analyze_all()
    elif command == "clean":
        clean()
    elif command == "loop":
        run_loop(lambda: (crawl_all(), analyze_all()))
    elif command == "loop-crawl":
        run_loop(crawl_all)
    elif command == "loop-analyze":
        run_loop(analyze_all)
    else:
        print(f"알 수 없는 명령: {command}")
        print("사용법: python main.py [once|crawl|analyze|clean|loop|loop-crawl|loop-analyze]")
