"""Exaone 배치 감성분석 테스트"""
from crawler.sentiment.analyzer import ask_ollama_batch

TEST_DATA = [
    {
        "label": "긍정",
        "title": "오늘 꿀잠",
        "text": "ㅋㅋㅋㅋㅋ 낼 폭등",
    },
    {
        "label": "부정",
        "title": "얘들아. 엔비 파란불 들어왔다",
        "text": "ㅜㅜ 낼 우짜노",
    },
    {
        "label": "긍정",
        "title": "나스닥 주구장창 오르는구나!",
        "text": "오늘 기관이 주도하고 외국인은 매도세가 팍 줄었던데...내일 기관들 올릴때 어떻게 올리는지 관찰해 보시길...",
    },
    {
        "label": "중립",
        "title": "삼전은",
        "text": "앤비디아 보지말고 마이크론하고 반도체지수만 보면 됨",
    },
    {
        "label": "긍정",
        "title": "큰형님 문자 왔습니다",
        "text": "235000원.언저리 비중60 매도후..비중40 존버 하거라",
    },
    {
        "label": "긍정",
        "title": "끝났네 내일 프리장 시초가",
        "text": "20만원 위로 퀀텀점프다!넥장 마감직전에 형이 얼른 합류하라 했자나낼부터 500원씩 오르면 포모와서 어케 견딜래",
    },
    {
        "label": "긍정",
        "title": "미장폭등하네",
        "text": "오늘국장판애들어쩌냐",
    },
    {
        "label": "긍정",
        "title": "삼전 내일 종가 18만~18만2천 본다",
        "text": "형은 분명히 말했어",
    },
    {
        "label": "부정",
        "title": "반도체지수 너무 약한데...",
        "text": "엔비디아도 그냥 강보합이고...갈등생기네...종가까지 유지해줘야 하는데...",
    },
    {
        "label": "부정",
        "title": "한국인특징",
        "text": "비쌀때.산다.부동산도 주식도 ㅋㅋㅋㅋㅋ고잘이야 진짜 ㅋㅋㅋ",
    },
]


if __name__ == "__main__":
    print("=== Exaone 배치 감성 분석 테스트 ===\n")

    results = ask_ollama_batch(TEST_DATA, 170000)

    for i, item in enumerate(TEST_DATA):
        data = results.get(str(i + 1), {})
        result = data.get("result", "알수없음")
        reason = data.get("reason", "")
        match = "✓" if (
            ("상승" in result and item["label"] == "긍정") or
            ("하락" in result and item["label"] == "부정") or
            ("중립" in result and item["label"] == "중립")
        ) else "✗"

        print(f"[{item['label']}] {item['title']}")
        print(f"  → Exaone: {result} {match}")
        print(f"  → 이유: {reason}")
        print()
