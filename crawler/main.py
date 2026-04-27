"""개미지표 크롤러 엔트리포인트"""
import time
import random
from datetime import datetime
from crawler.db import get_active_stocks, insert_post, get_unanalyzed_posts, update_sentiment
from crawler.sources.naver import crawl_board, crawl_post_detail
from crawler.sentiment.analyzer import ask_ollama_batch


def crawl_all():
    """1단계: 전 종목 크롤링 → posts 테이블에 저장"""
    stocks = get_active_stocks()
    print(f"\n=== 크롤링 시작 ({len(stocks)}개 종목) ===\n")

    total_new = 0
    for stock in stocks:
        stock_id = stock.id
        stock_code = stock.code
        stock_name = stock.name

        print(f"[{stock_name}] 종토방 크롤링 중...")
        board_posts = crawl_board(stock_code)

        new_count = 0
        for post in board_posts:
            # 본문 크롤링
            detail = crawl_post_detail(stock_code, post["nid"])
            if not detail:
                continue

            # DB 저장 (중복이면 건너뜀)
            # posted_at 파싱: "2026.04.27 14:30" 형식
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

            time.sleep(random.uniform(1, 2))  # 요청 간 딜레이

        total_new += new_count
        print(f"  → {new_count}개 새 글 저장 (전체 {len(board_posts)}개 중)")
        time.sleep(random.uniform(2, 4))  # 종목 간 딜레이

    print(f"\n크롤링 완료! 총 {total_new}개 새 글 저장\n")


def analyze_all():
    """2단계: 미분석 글 감성분석 → posts 테이블 업데이트"""
    total_success = 0
    batch_num = 0

    while True:
        unanalyzed = get_unanalyzed_posts(limit=20)
        if not unanalyzed:
            break

        batch_num += 1
        print(f"\n=== 감성분석 배치 #{batch_num} ({len(unanalyzed)}개 글) ===\n")

        # 배치 분석용 데이터 준비
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


def main():
    crawl_all()
    analyze_all()


if __name__ == "__main__":
    import sys

    if len(sys.argv) > 1:
        command = sys.argv[1]
        if command == "crawl":
            crawl_all()
        elif command == "analyze":
            analyze_all()
        else:
            print(f"알 수 없는 명령: {command}")
            print("사용법: python main.py [crawl|analyze]")
    else:
        main()
