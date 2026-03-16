# Python 치트시트 (JS 개발자용)

> Nest.js/Next.js 경험 기준으로 Python을 빠르게 읽고 쓰기 위한 가이드.
> 이 프로젝트 크롤러에서 실제로 쓸 것들 위주로 정리.

---

## 변수 & 타입

```python
# JS: const, let, var → Python: 그냥 할당
name = "삼성전자"           # str
price = 67300             # int
rate = -2.1               # float
is_active = True          # JS: true/false → Python: True/False
data = None               # JS: null → Python: None
```

## 문자열 (f-string = 템플릿 리터럴)

```python
# JS: `삼성전자 ${price}원`
# Python:
f"삼성전자 {price}원"
f"등락률: {rate:.1f}%"    # 소수점 1자리 포맷

# 멀티라인
query = """
    SELECT * FROM stocks
    WHERE market = 'KOSPI'
"""
```

## 리스트 & 딕셔너리

```python
# 리스트 (JS: Array)
stocks = ["삼성전자", "SK하이닉스", "테슬라"]
stocks.append("애플")         # JS: push()
stocks[0]                     # "삼성전자"
len(stocks)                   # JS: .length

# 딕셔너리 (JS: Object)
stock = {
    "code": "005930",
    "name": "삼성전자",
    "price": 67300,
}
stock["code"]                 # JS: stock.code 또는 stock["code"]
stock.get("sector", "없음")   # 키 없으면 기본값 반환 (JS: stock.sector ?? "없음")
```

## 리스트 컴프리헨션 (JS: map/filter)

```python
# JS: prices.map(p => p * 1.1)
prices = [100, 200, 300]
new_prices = [p * 1.1 for p in prices]

# JS: prices.filter(p => p > 150)
expensive = [p for p in prices if p > 150]

# JS: prices.filter(p => p > 100).map(p => p * 2)
result = [p * 2 for p in prices if p > 100]
```

## 조건문

```python
# JS: if / else if / else → Python: if / elif / else
if score >= 80:
    label = "극도의 분노"
elif score >= 60:
    label = "불안"
elif score >= 40:
    label = "보통"
else:
    label = "평온"

# JS: value === null → Python:
if data is None:
    print("데이터 없음")

# JS: &&, ||, ! → Python: and, or, not
if score > 80 and source == "NAVER":
    print("높음")
```

## 반복문

```python
# 기본 for
for stock in stocks:
    print(stock)

# 인덱스 필요할 때 (JS: forEach((item, i) => ...))
for i, stock in enumerate(stocks):
    print(f"{i}: {stock}")

# 딕셔너리 순회
for key, value in stock.items():
    print(f"{key}: {value}")

# range (JS: for(let i=0; i<10; i++))
for i in range(10):
    print(i)
```

## 함수

```python
# JS: function / const fn = () => {}
# Python: def
def calculate_score(profanity_count, total_posts):
    if total_posts == 0:
        return 0
    return (profanity_count / total_posts) * 1000

# 기본값
def crawl(stock_code, page=1, delay=3):
    pass  # 아직 구현 안 함 (JS: 빈 함수)

# 여러 값 리턴 (JS에는 없는 기능)
def get_stats():
    return 72, 35  # 튜플로 리턴

sb, gazua = get_stats()
```

## 클래스

```python
# JS: class와 거의 동일, this → self
class NaverCrawler:
    def __init__(self, stock_code):    # JS: constructor
        self.stock_code = stock_code   # JS: this.stockCode
        self.base_url = "https://finance.naver.com"

    def crawl(self):                   # 메서드에 항상 self 첫 번째 인자
        url = f"{self.base_url}/item/board.nhn?code={self.stock_code}"
        return url

crawler = NaverCrawler("005930")
crawler.crawl()
```

## 에러 처리

```python
# JS: try/catch/finally → Python: try/except/finally
try:
    response = requests.get(url)
    response.raise_for_status()
except requests.exceptions.HTTPError as e:    # JS: catch(e)
    print(f"HTTP 에러: {e}")
except Exception as e:                        # 모든 에러 캐치
    print(f"에러: {e}")
finally:
    print("완료")
```

## 모듈 & import

```python
# JS: import axios from 'axios'
import requests

# JS: import { load } from 'cheerio'
from bs4 import BeautifulSoup

# JS: import { something } from './utils'
from sources.naver import NaverCrawler

# JS: import * as path from 'path'
import os
```

## 자주 쓸 패턴들

### HTTP 요청 (requests = axios)

```python
import requests

# GET
response = requests.get(url, headers={"User-Agent": "Mozilla/5.0"})
html = response.text          # JS: response.data
status = response.status_code # JS: response.status

# POST
response = requests.post(url, json={"key": "value"})
data = response.json()        # JS: response.data (axios는 자동 파싱)
```

### HTML 파싱 (BeautifulSoup = cheerio)

```python
from bs4 import BeautifulSoup

soup = BeautifulSoup(html, "html.parser")

# JS: $('div.comment')
comments = soup.select("div.comment")

# JS: $(el).text()
for comment in comments:
    text = comment.get_text(strip=True)
    link = comment.select_one("a")
    if link:
        href = link["href"]    # JS: $(link).attr("href")
```

### 정규식 (re = JS RegExp)

```python
import re

text = "ㅅㅂ 진짜 시1발"

# JS: /ㅅㅂ/.test(text)
if re.search(r"ㅅㅂ", text):
    print("비속어 발견")

# JS: text.match(/시\d발/g)
matches = re.findall(r"시\d발", text)  # ['시1발']

# 패턴 미리 컴파일 (성능)
pattern = re.compile(r"ㅅ+ㅂ|시+발|씨+발")
result = pattern.findall(text)
```

### 시간 다루기

```python
import time
from datetime import datetime, timedelta

# 현재 시각
now = datetime.now()

# 딜레이 (JS: await new Promise(r => setTimeout(r, 3000)))
time.sleep(3)

# 랜덤 딜레이
import random
time.sleep(random.uniform(2, 5))  # 2~5초 랜덤

# 30일 전
thirty_days_ago = now - timedelta(days=30)
```

### 환경변수

```python
# JS: process.env.DB_HOST
from dotenv import load_dotenv
import os

load_dotenv()  # .env 파일 로드
db_host = os.getenv("DB_HOST", "localhost")  # 기본값
```

### SQLAlchemy Core (DB)

```python
from sqlalchemy import create_engine, Table, Column, Integer, String, MetaData, insert, select

engine = create_engine(os.getenv("DATABASE_URL"))
metadata = MetaData()

# 테이블 정의
posts = Table("posts", metadata,
    Column("id", Integer, primary_key=True),
    Column("stock_id", Integer),
    Column("content", String),
)

# INSERT
with engine.connect() as conn:
    conn.execute(insert(posts).values(
        stock_id=1, content="텍스트"
    ))
    conn.commit()

# SELECT
with engine.connect() as conn:
    result = conn.execute(
        select(posts).where(posts.c.stock_id == 1)
    )
    rows = result.fetchall()
```

---

## 주의할 차이점

| JS               | Python                    | 비고                    |
| ---------------- | ------------------------- | ----------------------- |
| `{}` 중괄호 블록 | **들여쓰기(4칸)**         | 가장 큰 차이!           |
| `===`            | `==`                      | Python은 `==`만 씀      |
| `null`           | `None`                    |                         |
| `true/false`     | `True/False`              | 대문자                  |
| `this`           | `self`                    | 메서드 첫 인자로 명시   |
| `console.log()`  | `print()`                 |                         |
| `async/await`    | `async/await` (거의 동일) | 이 프로젝트에서는 안 씀 |
| `;` 세미콜론     | 없음                      |                         |
| `camelCase`      | `snake_case`              | Python 컨벤션           |
