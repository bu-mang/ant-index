import requests
import time
import random
from bs4 import BeautifulSoup

BASE_URL = "https://finance.naver.com"

# 데스크톱 Chrome UA 목록 (모바일 UA가 섞이면 네이버가 리다이렉트함)
DESKTOP_USER_AGENTS = [
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36",
]


def get_headers():
    """매 요청마다 랜덤 데스크톱 User-Agent 선택"""
    return {"User-Agent": random.choice(DESKTOP_USER_AGENTS)}

# ----------------------------
# 종목토론방 한 페이지의 포스트들 긁어오기
# ----------------------------
# def = 함수 정의 (JS의 function)
# stock_code = 필수 파라미터
# page=1 = 기본값이 1인 선택 파라미터 (JS의 function crawlBoard(stockCode, page = 1))
def crawl_board(stock_code, page=1):
    """종목토론실 글 목록 크롤링 (1페이지 = 약 20개 글)"""

    # f"..." = 템플릿 리터럴 (JS의 `${변수}` 와 동일)
    url = f"{BASE_URL}/item/board.naver?code={stock_code}&page={page}"

    # requests.get() = HTTP GET 요청 (JS의 axios.get())
    # headers= → 키워드 인자. 파이썬은 이름을 명시해서 넘길 수 있음
    response = requests.get(url, headers=get_headers())

    # 응답 코드가 4xx/5xx이면 에러를 던짐 (JS의 if (!response.ok) throw ...)
    response.raise_for_status()

    # response.text = 응답 HTML 문자열
    # BeautifulSoup()으로 파싱 가능한 트리 객체로 변환
    # JS로 치면: const dom = new DOMParser().parseFromString(html, "text/html")
    soup = BeautifulSoup(response.text, "html.parser")

    # soup.find() = 첫 번째 매칭 요소 찾기 (JS의 document.querySelector())
    # class_= → 파이썬에서 class는 예약어라서 class_ 로 씀
    table = soup.find("table", class_="type2")

    # not = JS의 ! (부정)
    # 테이블이 없으면 빈 리스트 반환
    if not table:
        return []  # [] = 빈 배열 (JS의 [])

    posts = []  # 결과를 담을 빈 리스트(배열)

    # find_all() = 모든 매칭 요소 찾기 (JS의 document.querySelectorAll())
    rows = table.find_all("tr")

    # for ... in = JS의 for (const row of rows)
    for row in rows:
        cells = row.find_all("td")

        # len() = 길이 (JS의 .length)
        # 셀이 6개 미만이면 = 글이 아닌 행 (헤더, 구분선 등)
        # continue = 이 반복 건너뛰기 (JS와 동일)
        if len(cells) < 6:
            continue

        # row.find("a") = 이 행 안에서 <a> 태그 찾기
        link = row.find("a")

        # or = JS의 || (둘 중 하나라도 참이면)
        # link.get("href") = 속성 가져오기 (JS의 link.getAttribute("href"))
        # .get()은 속성이 없으면 None 반환 (에러 안 남)
        if not link or not link.get("href"):
            continue
        href = link["href"]  # dict 접근 (JS의 link["href"])

        # "board_read" not in href = JS의 !href.includes("board_read")
        if "board_read" not in href:
            continue

        # --- nid 파라미터 추출 ---
        # href = "/item/board_read.naver?code=005930&nid=415073879&page=1"
        # 여기서 nid=415073879 를 뽑아내는 과정

        nid = None  # None = JS의 null

        # href.split("&") = "&"로 자르기 (JS의 .split("&"))
        # → ["code=005930", "nid=415073879", "page=1"]
        for param in href.split("&"):
            # .startswith() = JS의 .startsWith()
            if param.startswith("nid="):
                nid = param.split("=")[1]  # "nid=415073879" → "415073879"
                break  # 찾았으니 루프 종료

        if not nid:
            continue

        # dict = JS의 객체 리터럴 { key: value }
        # get_text(strip=True) = 태그 안의 텍스트만 추출 (JS의 .textContent.trim())
        # .replace(",", "") = 쉼표 제거 ("1,234" → "1234")
        # int() = 문자열 → 정수 변환 (JS의 parseInt())
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

        # .append() = 배열에 추가 (JS의 .push())
        posts.append(post)

    return posts


# 직접 실행 시 테스트
if __name__ == "__main__":
    print("=== 삼성전자 종목토론실 크롤링 테스트 ===\n")
    posts = crawl_board("005930")
    print(f"총 {len(posts)}개 글 수집\n")
    for p in posts[:5]:
        print(f"[{p['date']}] {p['title']}")
        print(f"  조회 {p['views']} / 추천 {p['likes']} / 비추천 {p['dislikes']}")
        print(f"  URL: {p['url']}")
        print()
