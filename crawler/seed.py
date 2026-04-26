"""stocks 테이블에 종목 30개 시드 데이터 삽입"""
from crawler.db import engine, stocks
from sqlalchemy import insert, select

SEED_STOCKS = [
    {"code": "005930", "name": "삼성전자", "market": "KOSPI", "sector": "반도체"},
    {"code": "000660", "name": "SK하이닉스", "market": "KOSPI", "sector": "반도체"},
    {"code": "005380", "name": "현대차", "market": "KOSPI", "sector": "자동차"},
    {"code": "373220", "name": "LG에너지솔루션", "market": "KOSPI", "sector": "2차전지"},
    {"code": "042700", "name": "한미반도체", "market": "KOSPI", "sector": "반도체"},
    {"code": "012450", "name": "한화에어로스페이스", "market": "KOSPI", "sector": "방산"},
    {"code": "207940", "name": "삼성바이오로직스", "market": "KOSPI", "sector": "바이오"},
    {"code": "034020", "name": "두산에너빌리티", "market": "KOSPI", "sector": "에너지"},
    {"code": "015760", "name": "한국전력", "market": "KOSPI", "sector": "에너지"},
    {"code": "035420", "name": "NAVER", "market": "KOSPI", "sector": "플랫폼"},
    {"code": "068270", "name": "셀트리온", "market": "KOSPI", "sector": "바이오"},
    {"code": "042660", "name": "한화오션", "market": "KOSPI", "sector": "조선"},
    {"code": "272210", "name": "한화시스템", "market": "KOSPI", "sector": "방산"},
    {"code": "010140", "name": "삼성중공업", "market": "KOSPI", "sector": "조선"},
    {"code": "035720", "name": "카카오", "market": "KOSPI", "sector": "플랫폼"},
    {"code": "005490", "name": "POSCO홀딩스", "market": "KOSPI", "sector": "철강"},
    {"code": "066570", "name": "LG전자", "market": "KOSPI", "sector": "전자"},
    {"code": "096770", "name": "SK이노베이션", "market": "KOSPI", "sector": "에너지"},
    {"code": "000720", "name": "현대건설", "market": "KOSPI", "sector": "건설"},
    {"code": "047810", "name": "한국항공우주", "market": "KOSPI", "sector": "방산"},
    {"code": "011200", "name": "HMM", "market": "KOSPI", "sector": "해운"},
    {"code": "352820", "name": "하이브", "market": "KOSPI", "sector": "엔터"},
    {"code": "007660", "name": "이수페타시스", "market": "KOSPI", "sector": "반도체"},
    {"code": "003490", "name": "대한항공", "market": "KOSPI", "sector": "항공"},
    {"code": "009830", "name": "한화솔루션", "market": "KOSPI", "sector": "2차전지"},
    {"code": "377300", "name": "카카오페이", "market": "KOSPI", "sector": "플랫폼"},
    {"code": "000100", "name": "유한양행", "market": "KOSPI", "sector": "바이오"},
    {"code": "066970", "name": "엘앤에프", "market": "KOSPI", "sector": "2차전지"},
    {"code": "064400", "name": "LG씨엔에스", "market": "KOSPI", "sector": "IT"},
    {"code": "034220", "name": "LG디스플레이", "market": "KOSPI", "sector": "디스플레이"},
]


def seed():
    with engine.connect() as conn:
        existing = conn.execute(select(stocks)).fetchall()
        if existing:
            print(f"이미 {len(existing)}개 종목이 존재합니다. 시드 건너뜀.")
            return

        conn.execute(insert(stocks), SEED_STOCKS)
        conn.commit()
        print(f"종목 {len(SEED_STOCKS)}개 삽입 완료!")


if __name__ == "__main__":
    seed()
