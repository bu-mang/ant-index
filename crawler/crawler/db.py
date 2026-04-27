"""SQLAlchemy DB 연결 (Drizzle이 만든 테이블을 reflection으로 읽음)"""
from datetime import datetime
from sqlalchemy import create_engine, MetaData, select, insert, update
from crawler.config import DATABASE_URL

engine = create_engine(DATABASE_URL)
metadata = MetaData()

# Drizzle가 만든 테이블을 그대로 반영 (autoload)
metadata.reflect(bind=engine)

stocks = metadata.tables["stocks"]
stock_prices = metadata.tables["stock_prices"]
posts = metadata.tables["posts"]
news = metadata.tables["news"]
index_snapshots = metadata.tables["index_snapshots"]


def get_active_stocks():
    """활성 종목 목록 조회"""
    with engine.connect() as conn:
        result = conn.execute(
            select(stocks).where(stocks.c.is_active == True)
        )
        return result.fetchall()


def insert_post(stock_id, external_id, title, content, views, likes, dislikes, posted_at):
    """글 INSERT (중복이면 건너뜀). 삽입 성공 시 True 반환."""
    with engine.connect() as conn:
        # external_id로 중복 체크
        existing = conn.execute(
            select(posts.c.id).where(posts.c.external_id == external_id)
        ).fetchone()

        if existing:
            return False

        conn.execute(insert(posts).values(
            stock_id=stock_id,
            source="NAVER",
            type="POST",
            external_id=external_id,
            title=title,
            content=content,
            view_count=views,
            like_count=likes,
            dislike_count=dislikes,
            posted_at=posted_at,
        ))
        conn.commit()
        return True


def get_unanalyzed_posts(limit=50):
    """감성분석 안 된 글 조회"""
    with engine.connect() as conn:
        result = conn.execute(
            select(posts)
            .where(posts.c.sentiment_label == None)
            .limit(limit)
        )
        return result.fetchall()


def update_sentiment(post_id, label, reason):
    """감성분석 결과 UPDATE"""
    # LLM 결과(상승론자/하락론자/중립) → DB enum(BULL/BEAR/NEUTRAL) 변환
    label_map = {"상승론자": "BULL", "하락론자": "BEAR", "중립": "NEUTRAL"}
    db_label = label_map.get(label, "NEUTRAL")

    with engine.connect() as conn:
        conn.execute(
            update(posts)
            .where(posts.c.id == post_id)
            .values(
                sentiment_label=db_label,
                sentiment_reason=reason,
                analyzed_at=datetime.now(),
            )
        )
        conn.commit()
