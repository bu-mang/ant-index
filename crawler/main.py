"""개미지표 크롤러 엔트리포인트"""
from db import engine, stocks
from sqlalchemy import select

# DB 연결 테스트
with engine.connect() as conn:
    result = conn.execute(select(stocks))
    rows = result.fetchall()
    print(f"DB 연결 성공! stocks 테이블 행 수: {len(rows)}")
