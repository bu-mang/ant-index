"""네이버증권 종목토론실 크롤러"""
import requests
import random
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


def _parse_int(text):
    """콤마 포함 숫자 문자열 → int (파싱 실패 시 None)"""
    if not text:
        return None
    try:
        return int(text.replace(",", ""))
    except (ValueError, AttributeError):
        return None


def _parse_float(text):
    """숫자 문자열 → float (파싱 실패 시 None)"""
    if not text:
        return None
    try:
        return float(text.replace(",", ""))
    except (ValueError, AttributeError):
        return None


def crawl_price(stock_code, retries=1):
    """네이버증권에서 현재가, 등락률, 거래량, 시총, PER, PBR, 배당수익률, 52주 고/저 크롤링"""
    for attempt in range(1 + retries):
        try:
            url = f"{BASE_URL}/item/main.naver?code={stock_code}"
            response = requests.get(url, headers=get_headers(), timeout=10)
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

            # 거래량 — rate_info > no_info 테이블 첫 번째 tr, 세 번째 td의 .blind
            volume = None
            rate_info = soup.select_one("div.rate_info")
            if rate_info:
                no_info = rate_info.select_one("table.no_info")
                if no_info:
                    first_tr = no_info.select("tr")
                    if first_tr:
                        tds = first_tr[0].select("td")
                        if len(tds) >= 3:
                            vol_blind = tds[2].select_one(".blind")
                            if vol_blind:
                                volume = _parse_int(vol_blind.get_text(strip=True))

            # tab_con1 투자정보 테이블에서 시총, PER, PBR, 배당수익률, 52주 고/저 추출
            market_cap = None
            per = None
            pbr = None
            dividend_yield = None
            high_52w = None
            low_52w = None

            tab = soup.select_one("#tab_con1")
            if tab:
                for tr in tab.select("tr"):
                    th = tr.select_one("th")
                    td = tr.select_one("td")
                    if not th or not td:
                        continue
                    th_text = th.get_text(strip=True)
                    td_text = td.get_text(" ", strip=True)

                    if th_text == "시가총액":
                        # "1,312조 4,895 억원" → 억원 단위로 변환
                        import re
                        nums = re.findall(r"([\d,]+)\s*(조|억)", td_text)
                        total_eok = 0
                        for val, unit in nums:
                            n = int(val.replace(",", ""))
                            if unit == "조":
                                total_eok += n * 10000
                            else:
                                total_eok += n
                        if total_eok > 0:
                            market_cap = total_eok  # 억원 단위

                    elif "52주최고" in th_text:
                        # "230,000 l 53,700"
                        parts = td_text.split("l")
                        if len(parts) >= 2:
                            high_52w = _parse_int(parts[0].strip())
                            low_52w = _parse_int(parts[1].strip())

                    elif th_text.startswith("PER") and "추정" not in th_text:
                        # "33.59 배 l 6,564 원"
                        parts = td_text.split("배")
                        if parts:
                            per = _parse_float(parts[0].strip())

                    elif th_text.startswith("PBR"):
                        # "3.45 배 l 63,997 원"
                        parts = td_text.split("배")
                        if parts:
                            pbr = _parse_float(parts[0].strip())

                    elif th_text.startswith("배당수익률"):
                        # "0.76 %"
                        parts = td_text.split("%")
                        if parts:
                            dividend_yield = _parse_float(parts[0].strip())

            return {
                "current_price": current_price,
                "change_rate": change_rate,
                "volume": volume,
                "market_cap": market_cap,
                "per": per,
                "pbr": pbr,
                "dividend_yield": dividend_yield,
                "high_52w": high_52w,
                "low_52w": low_52w,
            }
        except Exception:
            if attempt < retries:
                time.sleep(random.uniform(1, 2))
            else:
                raise


def crawl_kospi():
    """네이버증권에서 코스피 지수 현재값 + 등락률 크롤링"""
    url = f"{BASE_URL}/sise/sise_index.naver?code=KOSPI"
    response = requests.get(url, headers=get_headers())
    response.raise_for_status()

    soup = BeautifulSoup(response.text, "html.parser")

    now_val = soup.select_one("#now_value")
    if not now_val:
        return None

    value = float(now_val.get_text(strip=True).replace(",", ""))

    change_rate = 0.0
    rate_el = soup.select_one("#change_value_and_rate")
    if rate_el:
        # 텍스트에서 "+2.15%" 같은 부분 추출
        import re
        text = rate_el.get_text(" ", strip=True)
        match = re.search(r'([+-]?\d+\.\d+)%', text)
        if match:
            change_rate = float(match.group(1))

    return {"value": value, "change_rate": change_rate}


def crawl_post_detail(stock_code, nid):
    """글 상세 페이지에서 본문 텍스트를 가져옴.

    네이버가 종토방 상세 페이지를 SSR → CSR 로 전환한 이후로 HTML 안에 본문이
    박혀 있지 않아, 클라이언트가 호출하는 front-api 엔드포인트를 직접 호출한다.
    """
    api_url = "https://m.stock.naver.com/front-api/discussion/detail"
    headers = get_headers()
    headers["Accept"] = "application/json, text/plain, */*"
    headers["Referer"] = (
        f"https://m.stock.naver.com/pc/domestic/stock/{stock_code}/discussion/{nid}"
    )

    response = requests.get(api_url, headers=headers, params={"id": nid}, timeout=10)
    response.raise_for_status()

    data = response.json()
    if not data.get("isSuccess"):
        return None

    result = data.get("result") or {}
    content_html = result.get("contentHtml")
    if not content_html:
        return None

    content_soup = BeautifulSoup(content_html, "html.parser")
    return {
        "title": result.get("title", ""),
        "body": content_soup.get_text(strip=True),
        "views": result.get("viewCount", 0),
        "likes": result.get("recommendCount", 0),
        "dislikes": result.get("notRecommendCount", 0),
        "date": result.get("writtenAt", ""),
    }
