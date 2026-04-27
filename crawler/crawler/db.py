"""SQLAlchemy DB 연결 (Drizzle이 만든 테이블을 reflection으로 읽음)"""
from datetime import datetime, timedelta, timezone
from sqlalchemy import create_engine, MetaData, select, insert, update, delete
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
                analyzed_at=datetime.now(timezone.utc),
            )
        )
        conn.commit()


def delete_old_posts(days=365):
    """crawled_at 기준으로 days일 이전 글 삭제. 삭제된 행 수 반환."""
    cutoff = datetime.now(timezone.utc) - timedelta(days=days)
    with engine.connect() as conn:
        result = conn.execute(
            delete(posts).where(posts.c.crawled_at < cutoff)
        )
        conn.commit()
        return result.rowcount


def insert_price(stock_id, current_price, change_rate):
    """시세 INSERT"""
    with engine.connect() as conn:
        conn.execute(insert(stock_prices).values(
            stock_id=stock_id,
            current_price=current_price,
            change_rate=change_rate,
        ))
        conn.commit()


def get_latest_price(stock_id):
    """종목 최신 시세 조회"""
    with engine.connect() as conn:
        result = conn.execute(
            select(stock_prices)
            .where(stock_prices.c.stock_id == stock_id)
            .order_by(stock_prices.c.updated_at.desc())
            .limit(1)
        ).fetchone()
        return result


def update_summary(stock_id, summary):
    """종목 한줄평 업데이트"""
    with engine.connect() as conn:
        conn.execute(
            update(stocks)
            .where(stocks.c.id == stock_id)
            .values(
                summary=summary,
                summary_updated_at=datetime.now(timezone.utc),
            )
        )
        conn.commit()


def insert_market_summary(summary):
    """전체 시장 한줄평 INSERT (append-only)"""
    market_summary = metadata.tables["market_summary"]
    with engine.connect() as conn:
        conn.execute(insert(market_summary).values(summary=summary))
        conn.commit()


def insert_snapshot(stock_id, index_type, index_value, raw_score, total_posts, period_start, period_end, period_type="DAILY"):
    """지표 스냅샷 INSERT"""
    with engine.connect() as conn:
        conn.execute(insert(index_snapshots).values(
            stock_id=stock_id,
            index_type=index_type,
            index_value=index_value,
            raw_score=raw_score,
            total_posts=total_posts,
            period_start=period_start,
            period_end=period_end,
            period_type=period_type,
        ))
        conn.commit()
