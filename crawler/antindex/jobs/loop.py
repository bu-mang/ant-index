"""주기적 작업 반복 유틸 — interval 간격으로 task() 를 재실행한다.

예외가 나도 다음 사이클로 진행하므로 24/7 운영에서 한 번의 실패가
프로세스를 죽이지 않는다.
"""
import logging
import time
from typing import Callable

log = logging.getLogger(__name__)

LOOP_INTERVAL: int = 30 * 60  # 30분 (초)


def run_loop(task: Callable[[], None], interval: float = LOOP_INTERVAL) -> None:
    """지정된 작업을 interval 간격으로 반복 실행"""
    while True:
        start = time.time()
        try:
            task()
        except Exception as e:
            log.exception("작업 중 예외 발생: %s", e)

        elapsed = time.time() - start
        wait = max(0.0, interval - elapsed)
        if wait > 0:
            log.info("다음 실행까지 %d분 %d초 대기...", int(wait // 60), int(wait % 60))
            time.sleep(wait)
