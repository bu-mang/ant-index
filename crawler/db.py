import os
from dotenv import load_dotenv
from sqlalchemy import create_engine, MetaData, Table

load_dotenv()

engine = create_engine(os.getenv("DATABASE_URL"))
metadata = MetaData()

# Drizzle가 만든 테이블을 그대로 반영 (autoload)
metadata.reflect(bind=engine)

stocks = metadata.tables["stocks"]
stock_prices = metadata.tables["stock_prices"]
posts = metadata.tables["posts"]
news = metadata.tables["news"]
index_snapshots = metadata.tables["index_snapshots"]
