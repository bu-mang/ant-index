"""SQLAlchemy DB 연결 + 데이터 접근 헬퍼 (Drizzle이 만든 테이블을 reflection으로 읽음)

함수는 호출자에 따라 세 그룹으로 묶여 있다:
  - 공용:     Crawler · Analyzer 양쪽에서 호출
  - 크롤러용: sources/naver 로부터 수집한 글·시세를 적재
  - 분석기용: 감성분석 결과 기록 + 지수/한줄평 집계용 읽기·쓰기
"""
from datetime import datetime, timedelta, timezone
from sqlalchemy import create_engine, MetaData, select, insert, update, delete, func, case
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


# ─────────────────────────────────────────────────────────────────────────────
# 공용 (Crawler · Analyzer 양쪽에서 호출)
# ─────────────────────────────────────────────────────────────────────────────


def get_active_stocks():
    """활성 종목 목록 조회"""
    with engine.connect() as conn:
        result = conn.execute(
            select(stocks).where(stocks.c.is_active == True)
        )
        return result.fetchall()


# ─────────────────────────────────────────────────────────────────────────────
# 크롤러용 API — 수집한 글/시세 적재 + 오래된 글 정리
#   호출자: sources/naver, main.crawl_all, main.price_all, main.clean
# ─────────────────────────────────────────────────────────────────────────────


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


def insert_price(stock_id, current_price, change_rate, **extra):
    """시세 INSERT (거래량, 시총, PER, PBR, 배당수익률, 52주 고/저 등 추가 필드 지원)"""
    values = {
        "stock_id": stock_id,
        "current_price": current_price,
        "change_rate": change_rate,
    }
    # 추가 필드 매핑 (None이 아닌 값만)
    field_map = {
        "volume": "volume",
        "market_cap": "market_cap",
        "per": "per",
        "pbr": "pbr",
        "dividend_yield": "dividend_yield",
        "high_52w": "high_52w",
        "low_52w": "low_52w",
    }
    for key, col in field_map.items():
        val = extra.get(key)
        if val is not None:
            values[col] = val

    with engine.connect() as conn:
        conn.execute(insert(stock_prices).values(**values))
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


# ─────────────────────────────────────────────────────────────────────────────
# 분석기용 API — 감성 라벨링 + 지수 집계 + 한줄평/스냅샷 기록
#   호출자: sentiment/analyzer, sentiment/summarizer, main.analyze_all
# ─────────────────────────────────────────────────────────────────────────────


def get_unanalyzed_posts(limit=50):
    """감성분석 안 된 글 조회 (sentiment_label IS NULL)"""
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


def get_sentiment_weights(stock_id, hours=24):
    """최근 hours시간 글의 좋아요 가중치 집계.

    Row(total_weight, bull_weight, bear_weight, total_posts) 반환.
    가중치 공식: 1 + log(max(like_count, 0) + 1) — 좋아요 많을수록 영향력 ↑
    sentiment_label 이 NULL 인 글(아직 분석 안 된 글)은 제외.
    """
    since = datetime.now(timezone.utc) - timedelta(hours=hours)
    weight_expr = 1 + func.log(func.greatest(posts.c.like_count, 0) + 1)
    with engine.connect() as conn:
        return conn.execute(
            select(
                func.sum(weight_expr).label("total_weight"),
                func.sum(
                    case((posts.c.sentiment_label == "BULL", weight_expr), else_=0)
                ).label("bull_weight"),
                func.sum(
                    case((posts.c.sentiment_label == "BEAR", weight_expr), else_=0)
                ).label("bear_weight"),
                func.count().label("total_posts"),
            )
            .where(posts.c.stock_id == stock_id)
            .where(posts.c.crawled_at >= since)
            .where(posts.c.sentiment_label.isnot(None))
        ).fetchone()


def get_latest_price(stock_id):
    """종목 최신 시세 조회 (한줄평/시장 통계용)"""
    with engine.connect() as conn:
        result = conn.execute(
            select(stock_prices)
            .where(stock_prices.c.stock_id == stock_id)
            .order_by(stock_prices.c.updated_at.desc())
            .limit(1)
        ).fetchone()
        return result


def insert_snapshot(stock_id, index_type, index_value, raw_score, total_posts, period_start, period_end, period_type="DAILY"):
    """지표 스냅샷 INSERT (시계열 보존용)"""
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


def update_summary(stock_id, summary):
    """종목 한줄평 업데이트 (stocks.summary 덮어쓰기)"""
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
    """전체 시장 한줄평 INSERT (append-only, market_summary 테이블에 시계열로 누적)"""
    market_summary = metadata.tables["market_summary"]
    with engine.connect() as conn:
        conn.execute(insert(market_summary).values(summary=summary))
        conn.commit()
