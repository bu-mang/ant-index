"""개미지표 크롤러 엔트리포인트"""
from crawler.db import engine, stocks
from sqlalchemy import select


def main():
    # DB 연결 테스트
    with engine.connect() as conn:
        result = conn.execute(select(stocks))
        rows = result.fetchall()
        print(f"DB 연결 성공! stocks 테이블 행 수: {len(rows)}")

    # TODO: 크롤링 → DB 저장 파이프라인
    # TODO: 감성분석 파이프라인


if __name__ == "__main__":
    main()
