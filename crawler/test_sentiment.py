# from transformers import pipeline
import requests
import json

test_data = [
    {
        "label": "긍정",
        "title": "오늘 꿀잠",
        "text": "ㅋㅋㅋㅋㅋ 낼 폭등",
        "views": 5,
        "likes": 0,
        "dislikes": 0,
        "date": "2026.03.17 22:56",
        "price": 170000,
    },
    {
        "label": "부정",
        "title": "얘들아. 엔비 파란불 들어왔다",
        "text": "ㅜㅜ 낼 우짜노",
        "views": 44,
        "likes": 2,
        "dislikes": 18,
        "date": "2026.03.17 22:53",
        "price": 170000,
    },
    {
        "label": "긍정",
        "title": "나스닥 주구장창 오르는구나!",
        "text": "오늘 기관이 주도하고 외국인은 매도세가 팍 줄었던데...내일 기관들 올릴때 어떻게 올리는지 관찰해 보시길...",
        "views": 58,
        "likes": 9,
        "dislikes": 0,
        "date": "2026.03.17 22:52",
        "price": 170000,
    },
    {
        "label": "중립",
        "title": "삼전은",
        "text": "앤비디아 보지말고 마이크론하고 반도체지수만 보면 됨",
        "views": 21,
        "likes": 12,
        "dislikes": 0,
        "date": "2026.03.17 22:52",
        "price": 170000,
    },
    {
        "label": "긍정",
        "title": "큰형님 문자 왔습니다 😆😆",
        "text": "235000원.언저리 비중60 매도후..비중40 존버 하거라 👍",
        "views": 35,
        "likes": 2,
        "dislikes": 2,
        "date": "2026.03.17 22:51",
        "price": 170000,
    },
    {
        "label": "긍정",
        "title": "끝났네 내일 프리장 시초가",
        "text": "20만원 위로 퀀텀점프다!넥장 마감직전에 형이 얼른 합류하라 했자나낼부터 500원씩 오르면 포모와서 어케 견딜래",
        "views": 82,
        "likes": 10,
        "dislikes": 0,
        "date": "2026.03.17 22:51",
        "price": 170000,
    },
    {
        "label": "긍정",
        "title": "미장폭등하네",
        "text": "오늘국장판애들어쩌냐",
        "views": 181,
        "likes": 14,
        "dislikes": 0,
        "date": "2026.03.17 22:49",
        "price": 170000,
    },
    {
        "label": "긍정",
        "title": "삼전 내일 종가 18만~18만2천 본다",
        "text": "형은 분명히 말했어",
        "views": 95,
        "likes": 1,
        "dislikes": 24,
        "date": "2026.03.17 22:49",
        "price": 170000,
    },
    {
        "label": "부정",
        "title": "반도체지수 너무 약한데...",
        "text": "엔비디아도 그냥 강보합이고...갈등생기네...종가까지 유지해줘야 하는데...",
        "views": 57,
        "likes": 0,
        "dislikes": 7,
        "date": "2026.03.17 22:47",
        "price": 170000,
    },
    {
        "label": "부정",
        "title": "한국인특징",
        "text": "비쌀때.산다.부동산도 주식도 ㅋㅋㅋㅋㅋ고잘이야 진짜 ㅋㅋㅋ",
        "views": 27,
        "likes": 2,
        "dislikes": 5,
        "date": "2026.03.17 22:47",
        "price": 170000,
    },
]

PROMPT_TEMPLATE = """너는 주식 커뮤니티 감성 분석기야. 글의 제목과 본문을 보고 작성자의 시장 심리를 판별해.

판별 기준:
- 상승론자: 주가 상승 기대, 매수 권유, 낙관, 하락론자 조롱
- 하락론자: 주가 하락 우려/예측, 비관, 불안, 상승론자 조롱, 비꼬기
- 중립: 단순 정보 공유, 질문, 판단 불가

톤으로도 판단해:
- "ㅜㅜ", "우짜노", "갈등생기네" → 불안 = 하락론자
- "ㅋㅋ 폭등", "퀀텀점프" → 기대 = 상승론자  
- "고잘이야 ㅋㅋ", "한국인특징" → 비꼬기 = 하락론자
- "~약한데", "~유지해줘야 하는데" → 걱정 = 하락론자

예시:
글: 숏충이들 오늘도 돈 잃었냐 ㅋㅋ → 상승론자
글: 존버하다 결국 반토막 ㅋㅋ → 하락론자
글: 떡상 가즈아!!! → 상승론자
글: 이 주식 끝났다 빨리 탈출해 → 하락론자
글: 마이크론하고 반도체지수만 보면 됨 → 중립
글: 반도체지수 너무 약한데... 갈등생기네 → 하락론자
글: 미장폭등하네 국장판애들어쩌냐 → 상승론자
글: 비쌀때 산다 ㅋㅋ 고잘이야 → 하락론자

판별할 글: {text}
참고: 이 종목의 현재 주가는 {price}원이다.

상승론자/하락론자/중립 중 하나만 답해."""

def ask_ollama(text, price):
    response = requests.post("http://localhost:11434/api/generate", json={
        "model": "exaone3.5:7.8b",
        "prompt": PROMPT_TEMPLATE.format(text=text, price=price),
        "stream": False,
    })
    return response.json()["response"].strip()


if __name__ == "__main__":
    print("=== Exaone 감성 분석 테스트 ===\n")

    for item in test_data:
        result = ask_ollama(item["title"] + " " + item["text"], item["price"])
        match = "✓" if (
            ("상승" in result and item["label"] == "긍정") or
            ("하락" in result and item["label"] == "부정") or
            ("중립" in result and item["label"] == "중립")
        ) else "✗"

        print(f"[{item['label']}] {item['title']}")
        print(f"  → Exaone: {result} {match}")
        print()

# 테스트할 모델 목록
# models = [
#     "Copycats/koelectra-base-v3-generalized-sentiment-analysis",
#     "snunlp/KR-FinBert-SC",
#     "jaehyeong/koelectra-base-v3-generalized-sentiment-analysis",
# ]

# # 모델 하나씩 돌리면서 비교
# for model_name in models:
#     print(f"\n{'='*50}")
#     print(f"모델: {model_name}")
#     print(f"{'='*50}")

#     classifier = pipeline("sentiment-analysis", model=model_name)

#     correct = 0
#     for item in test_data:
#         result = classifier(item["text"])[0]
#         # result = {"label": "POSITIVE", "score": 0.92} 같은 형태

#         print(f"[{item['label']}] {item['title']}")
#         print(f"  → 모델: {result['label']} ({result['score']:.2f})")

#     print(f"\n정확도: {correct}/{len(test_data)}")