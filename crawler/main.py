"""개미지표 크롤러 엔트리포인트.

CLI: typer 기반. 모든 비즈니스 로직은 crawler.jobs.* 에 있고,
이 파일은 명령어 ↔ job 함수 매핑만 담당하는 얇은 디스패처다.

사용법:
  python main.py                  # 크롤링 1회 + 분석 1회 (= once)
  python main.py once             # 크롤링 1회 + 분석 1회
  python main.py crawl            # 글 크롤링만 1회
  python main.py price            # 시세만 빠르게 1회
  python main.py analyze          # 분석만 1회 (한줄평까지)
  python main.py clean            # 1년 지난 글 삭제 1회
  python main.py loop             # 크롤링+분석(30분) + 시세(5분) 동시 반복
  python main.py loop-crawl-price # 글 크롤링(30분) + 시세(5분) 동시 반복
  python main.py loop-crawl       # 크롤링만 30분 주기 반복
  python main.py loop-analyze     # 분석만 30분 주기 반복
  python main.py loop-price       # 시세만 5분 주기 반복

도움말: python main.py --help
"""
import threading

import typer

from crawler.jobs.analyze import analyze_all
from crawler.jobs.crawl import clean as run_clean
from crawler.jobs.crawl import crawl_all
from crawler.jobs.loop import run_loop
from crawler.jobs.price import price_all
from crawler.logging_config import setup_logging

app = typer.Typer(
    help="개미지표 크롤러 — 글/시세 수집 + 감성분석 + 지표 산출",
    no_args_is_help=False,
    add_completion=False,
)

PRICE_INTERVAL = 5 * 60  # 시세 루프 주기 (초)


@app.callback(invoke_without_command=True)
def _main(ctx: typer.Context) -> None:
    """모든 명령 실행 전에 로깅을 초기화한다.

    인자 없이 호출되면 (기본 동작) 'once' 명령을 실행한다 — 기존 호환성 유지.
    """
    setup_logging()
    if ctx.invoked_subcommand is None:
        crawl_all()
        analyze_all()


@app.command()
def once() -> None:
    """크롤링 1회 + 분석 1회."""
    crawl_all()
    analyze_all()


@app.command()
def crawl() -> None:
    """글 크롤링만 1회."""
    crawl_all()


@app.command()
def price() -> None:
    """시세만 1회."""
    price_all()


@app.command()
def analyze() -> None:
    """미분석 글 감성분석 + 한줄평 생성 (1회)."""
    analyze_all()


@app.command()
def clean() -> None:
    """1년 지난 글 삭제."""
    run_clean()


@app.command()
def loop() -> None:
    """크롤링+분석(30분) + 시세(5분) 동시 반복."""
    t = threading.Thread(
        target=run_loop,
        args=(price_all,),
        kwargs={"interval": PRICE_INTERVAL},
        daemon=True,
    )
    t.start()
    run_loop(lambda: (crawl_all(), analyze_all()))


@app.command(name="loop-crawl-price")
def loop_crawl_price() -> None:
    """글 크롤링(30분) + 시세(5분) 동시 반복."""
    t = threading.Thread(
        target=run_loop,
        args=(price_all,),
        kwargs={"interval": PRICE_INTERVAL},
        daemon=True,
    )
    t.start()
    run_loop(crawl_all)


@app.command(name="loop-crawl")
def loop_crawl() -> None:
    """글 크롤링만 30분 주기 반복."""
    run_loop(crawl_all)


@app.command(name="loop-analyze")
def loop_analyze() -> None:
    """분석만 30분 주기 반복."""
    run_loop(analyze_all)


@app.command(name="loop-price")
def loop_price() -> None:
    """시세만 5분 주기 반복."""
    run_loop(price_all, interval=PRICE_INTERVAL)


if __name__ == "__main__":
    app()
