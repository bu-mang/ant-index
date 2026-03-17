from transformers import pipeline

test_data = [
    {
        "label": "긍정",
        "title": "오늘 꿀잠",
        "text": "ㅋㅋㅋㅋㅋ 낼 폭등",
        "views": 5,
        "likes": 0,
        "dislikes": 0,
        "date": "2026.03.17 22:56",
    },
    {
        "label": "부정",
        "title": "얘들아. 엔비 파란불 들어왔다",
        "text": "ㅜㅜ 낼 우짜노",
        "views": 44,
        "likes": 2,
        "dislikes": 18,
        "date": "2026.03.17 22:53",
    },
    {
        "label": "긍정",
        "title": "나스닥 주구장창 오르는구나!",
        "text": "오늘 기관이 주도하고 외국인은 매도세가 팍 줄었던데...내일 기관들 올릴때 어떻게 올리는지 관찰해 보시길...",
        "views": 58,
        "likes": 9,
        "dislikes": 0,
        "date": "2026.03.17 22:52",
    },
    {
        "label": "중립",
        "title": "삼전은",
        "text": "앤비디아 보지말고 마이크론하고 반도체지수만 보면 됨",
        "views": 21,
        "likes": 12,
        "dislikes": 0,
        "date": "2026.03.17 22:52",
    },
    {
        "label": "긍정",
        "title": "큰형님 문자 왔습니다 😆😆",
        "text": "235000원.언저리 비중60 매도후..비중40 존버 하거라 👍",
        "views": 35,
        "likes": 2,
        "dislikes": 2,
        "date": "2026.03.17 22:51",
    },
    {
        "label": "긍정",
        "title": "끝났네 내일 프리장 시초가",
        "text": "20만원 위로 퀀텀점프다!넥장 마감직전에 형이 얼른 합류하라 했자나낼부터 500원씩 오르면 포모와서 어케 견딜래",
        "views": 82,
        "likes": 10,
        "dislikes": 0,
        "date": "2026.03.17 22:51",
    },
    {
        "label": "긍정",
        "title": "미장폭등하네",
        "text": "오늘국장판애들어쩌냐",
        "views": 181,
        "likes": 14,
        "dislikes": 0,
        "date": "2026.03.17 22:49",
    },
    {
        "label": "부정",
        "title": "삼전 내일 종가 18만~18만2천 본다",
        "text": "형은 분명히 말했어",
        "views": 95,
        "likes": 1,
        "dislikes": 24,
        "date": "2026.03.17 22:49",
    },
    {
        "label": "부정",
        "title": "반도체지수 너무 약한데...",
        "text": "엔비디아도 그냥 강보합이고...갈등생기네...종가까지 유지해줘야 하는데...",
        "views": 57,
        "likes": 0,
        "dislikes": 7,
        "date": "2026.03.17 22:47",
    },
    {
        "label": "부정",
        "title": "한국인특징",
        "text": "비쌀때.산다.부동산도 주식도 ㅋㅋㅋㅋㅋ고잘이야 진짜 ㅋㅋㅋ",
        "views": 27,
        "likes": 2,
        "dislikes": 5,
        "date": "2026.03.17 22:47",
    },
]

# 테스트할 모델 목록
models = [
    "Copycats/koelectra-base-v3-generalized-sentiment-analysis",
    "snunlp/KR-FinBert-SC",
    "jaehyeong/koelectra-base-v3-generalized-sentiment-analysis",
]


# 모델 하나씩 돌리면서 비교
for model_name in models:
    print(f"\n{'='*50}")
    print(f"모델: {model_name}")
    print(f"{'='*50}")

    classifier = pipeline("sentiment-analysis", model=model_name)

    correct = 0
    for item in test_data:
        result = classifier(item["text"])[0]
        # result = {"label": "POSITIVE", "score": 0.92} 같은 형태

        print(f"[{item['label']}] {item['title']}")
        print(f"  → 모델: {result['label']} ({result['score']:.2f})")

    print(f"\n정확도: {correct}/{len(test_data)}")