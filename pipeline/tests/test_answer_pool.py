import json
from pathlib import Path

from kor_hot_and_cold_pipeline.answer_pool import (
    answer_pool_sha256,
    build_answer_pool,
)


ROOT = Path(__file__).resolve().parents[2]


def test_build_answer_pool_applies_every_policy_condition() -> None:
    policy = {
        "gameVersion": 2,
        "lexiconVersion": 1,
        "policyVersion": 1,
        "criteria": {
            "levels": ["초급", "중급"],
            "requiredCategory": True,
            "partsOfSpeech": ["명사", "동사", "형용사"],
            "minimumLength": 2,
            "maximumLength": 6,
        },
        "deniedCategories": ["제외 범주"],
        "deniedAnswerWords": ["제외어"],
    }
    words = [
        {"id": 0, "word": "바다", "pos": "명사", "level": "초급", "category": "자연"},
        {"id": 1, "word": "제외어", "pos": "명사", "level": "초급", "category": "자연"},
        {"id": 2, "word": "학교", "pos": "명사", "level": "고급", "category": "교육"},
        {"id": 3, "word": "달리다", "pos": "동사", "level": "중급", "category": ""},
        {"id": 4, "word": "무기", "pos": "명사", "level": "중급", "category": "제외 범주"},
        {"id": 5, "word": "그리고", "pos": "부사", "level": "초급", "category": "말"},
    ]

    result = build_answer_pool(words, policy)

    assert result["wordIds"] == [0]
    assert result["count"] == 1
    assert result["sha256"] == answer_pool_sha256([0])


def test_tracked_answer_pool_matches_dictionary_policy_and_reviewed_hash() -> None:
    dictionary = json.loads(
        (ROOT / "data" / "demo" / "dictionary.json").read_text(encoding="utf-8")
    )
    policy = json.loads(
        (ROOT / "data" / "safety" / "answer-policy.json").read_text(
            encoding="utf-8"
        )
    )
    tracked = json.loads(
        (ROOT / "data" / "demo" / "answer-pool.json").read_text(encoding="utf-8")
    )

    rebuilt = build_answer_pool(dictionary["words"], policy)

    assert tracked == rebuilt
    assert tracked["count"] == 3186
    assert tracked["sha256"] == "6e02bede36c355668e978fa566e1945925b38ebfe55dd10267a1fdedf1300b2c"
    assert tracked["wordIds"] == sorted(set(tracked["wordIds"]))
