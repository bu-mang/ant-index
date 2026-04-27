"""네이버증권 종목토론실 크롤러"""
import requests
import random
import json
import time
from bs4 import BeautifulSoup

BASE_URL = "https://finance.naver.com"

DESKTOP_USER_AGENTS = [
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36",
]


def get_headers():
    """매 요청마다 랜덤 데스크톱 User-Agent 선택"""
    return {"User-Agent": random.choice(DESKTOP_USER_AGENTS)}


def crawl_board(stock_code, pages=5):
    """종목토론실 글 목록 크롤링 (pages 페이지만큼, 페이지당 약 20개 글)"""
    all_posts = []

    for page in range(1, pages + 1):
        url = f"{BASE_URL}/item/board.naver?code={stock_code}&page={page}"
        response = requests.get(url, headers=get_headers())
        response.raise_for_status()

        soup = BeautifulSoup(response.text, "html.parser")
        table = soup.find("table", class_="type2")

        if not table:
            break

        rows = table.find_all("tr")

        for row in rows:
            cells = row.find_all("td")
            if len(cells) < 6:
                continue

            link = row.find("a")
            if not link or not link.get("href"):
                continue
            href = link["href"]

            if "board_read" not in href:
                continue

            nid = None
            for param in href.split("&"):
                if param.startswith("nid="):
                    nid = param.split("=")[1]
                    break

            if not nid:
                continue

            post = {
                "nid": nid,
                "date": cells[0].get_text(strip=True),
                "title": cells[1].get_text(strip=True),
                "author": cells[2].get_text(strip=True),
                "views": int(cells[3].get_text(strip=True).replace(",", "") or 0),
                "likes": int(cells[4].get_text(strip=True).replace(",", "") or 0),
                "dislikes": int(cells[5].get_text(strip=True).replace(",", "") or 0),
                "url": f"{BASE_URL}{href}",
            }
            all_posts.append(post)

        time.sleep(random.uniform(1, 2))  # 페이지 간 딜레이

    return all_posts


def crawl_price(stock_code):
    """네이버증권에서 현재가, 등락률 크롤링"""
    url = f"{BASE_URL}/item/main.naver?code={stock_code}"
    response = requests.get(url, headers=get_headers())
    response.raise_for_status()

    soup = BeautifulSoup(response.text, "html.parser")

    # 현재가
    no_today = soup.select_one("p.no_today .blind")
    if not no_today:
        return None

    current_price = int(no_today.get_text(strip=True).replace(",", ""))

    # 등락률 (첫 번째 no_exday)
    exday = soup.select_one("p.no_exday")
    change_rate = 0.0
    if exday:
        ems = exday.select("em")
        # 두 번째 em이 등락률 (%)
        if len(ems) >= 2:
            rate_blind = ems[1].select_one(".blind")
            if rate_blind:
                rate = float(rate_blind.get_text(strip=True))
                # no_down이면 음수
                if "no_down" in ems[1].get("class", []):
                    rate = -rate
                change_rate = rate

    return {
        "current_price": current_price,
        "change_rate": change_rate,
    }


def crawl_post_detail(stock_code, nid):
    """글 상세 페이지에서 본문 텍스트를 가져옴"""
    iframe_url = f"https://m.stock.naver.com/pc/domestic/stock/{stock_code}/discussion/{nid}"
    response = requests.get(iframe_url, headers=get_headers())
    response.raise_for_status()

    soup = BeautifulSoup(response.text, "html.parser")
    next_data = soup.find("script", id="__NEXT_DATA__")
    if not next_data:
        return None

    data = json.loads(next_data.string)
    queries = data["props"]["pageProps"]["dehydratedState"]["queries"]

    for query in queries:
        result = query.get("state", {}).get("data", {}).get("result", {})
        if isinstance(result, dict) and "contentHtml" in result:
            if not result["contentHtml"]:
                return None
            content_soup = BeautifulSoup(result["contentHtml"], "html.parser")
            return {
                "title": result.get("title", ""),
                "body": content_soup.get_text(strip=True),
                "views": result.get("viewCount", 0),
                "likes": result.get("recommendCount", 0),
                "dislikes": result.get("notRecommendCount", 0),
                "date": result.get("writtenAt", ""),
            }

    return None
