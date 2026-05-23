"""중앙 로깅 설정.

엔트리포인트(main.py / seed.py / 테스트) 시작 시 setup_logging() 을 1회 호출.
라이브러리 모듈들은 `logging.getLogger(__name__)` 만 쓰고 설정은 건드리지 않는다.

포맷: `2026-05-13 12:34:56 [INFO] crawler.scrapers.naver: 삼성전자 종토방 크롤링 중...`
출력: stdout (docker logs 와 호환)
"""
import logging
import sys

_configured = False


def setup_logging(level: int = logging.INFO) -> None:
    """루트 로거 설정. 멱등 — 중복 호출 시 첫 호출만 유효."""
    global _configured
    if _configured:
        return

    handler = logging.StreamHandler(sys.stdout)
    handler.setFormatter(
        logging.Formatter(
            fmt="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
            datefmt="%Y-%m-%d %H:%M:%S",
        )
    )

    root = logging.getLogger()
    root.setLevel(level)
    root.handlers = [handler]  # 다른 라이브러리가 잡아놓은 핸들러 초기화

    # 외부 라이브러리 노이즈 줄이기
    logging.getLogger("urllib3").setLevel(logging.WARNING)
    logging.getLogger("requests").setLevel(logging.WARNING)

    _configured = True
