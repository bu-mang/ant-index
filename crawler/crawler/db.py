"""SQLAlchemy DB 연결 (Drizzle이 만든 테이블을 reflection으로 읽음)"""
from sqlalchemy import create_engine, MetaData
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
