import csv
from pathlib import Path

from kor_hot_and_cold_pipeline.lexicon import build_lexicon


def test_build_lexicon_filters_and_merges_entries(tmp_path: Path) -> None:
    source = tmp_path / "dictionary.csv"
    fieldnames = [
        "Form",
        "Part of Speech",
        "Korean Definition",
        "English Definition",
        "Usages",
        "Vocabulary Level",
        "Semantic Category",
    ]
    rows = [
        {
            "Form": "바다",
            "Part of Speech": "명사",
            "Korean Definition": "['넓고 큰 물의 공간.']",
            "English Definition": "[]",
            "Usages": "[]",
            "Vocabulary Level": "초급",
            "Semantic Category": "자연",
        },
        {
            "Form": "바다",
            "Part of Speech": "명사",
            "Korean Definition": "['많이 모인 상태를 비유하는 말.']",
            "English Definition": "[]",
            "Usages": "[]",
            "Vocabulary Level": "중급",
            "Semantic Category": "",
        },
        {
            "Form": "꿈",
            "Part of Speech": "명사",
            "Korean Definition": "['잠자는 동안 경험하는 영상과 소리.']",
            "English Definition": "[]",
            "Usages": "[]",
            "Vocabulary Level": "초급",
            "Semantic Category": "삶",
        },
        {
            "Form": "-답다",
            "Part of Speech": "접사",
            "Korean Definition": "['성질이 있음.']",
            "English Definition": "[]",
            "Usages": "[]",
            "Vocabulary Level": "중급",
            "Semantic Category": "",
        },
        {
            "Form": "전문용어",
            "Part of Speech": "명사",
            "Korean Definition": "['전문 분야의 말.']",
            "English Definition": "[]",
            "Usages": "[]",
            "Vocabulary Level": "고급",
            "Semantic Category": "",
        },
    ]
    with source.open("w", encoding="utf-8", newline="") as file:
        writer = csv.DictWriter(file, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(rows)

    entries = build_lexicon(source)

    assert [entry.word for entry in entries] == ["꿈", "바다"]
    assert entries[1].level == "초급"
    assert entries[1].definitions == ("넓고 큰 물의 공간.", "많이 모인 상태를 비유하는 말.")
