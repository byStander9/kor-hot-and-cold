import csv
from pathlib import Path

import pyarrow as pa
import pyarrow.parquet as parquet

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

    standard_source = tmp_path / "standard.parquet"
    parquet.write_table(
        pa.table(
            {
                "text": [
                    "어휘: 감자-밭, 구성 단위: 단어, 품사: 「명사」, 의미 문형: , 뜻풀이: 감자를 심은 밭., 범주: 일반어",
                    "어휘: 푸르다(01), 구성 단위: 단어, 품사: 「형용사」, 공통 문형: 【…이】, 의미 문형: , 뜻풀이: 맑은 하늘과 같은 빛깔이다., 범주: 일반어",
                    "어휘: -ㄴ, 구성 단위: 단어, 품사: 「어미」, 의미 문형: , 뜻풀이: 관형어 기능을 하는 어미., 범주: 일반어",
                ]
            }
        ),
        standard_source,
    )

    entries = build_lexicon(source, standard_source)

    assert [entry.word for entry in entries] == ["감자밭", "꿈", "바다", "전문용어", "푸르다"]
    assert entries[2].level == "초급"
    assert entries[2].definitions == ("넓고 큰 물의 공간.", "많이 모인 상태를 비유하는 말.")
    assert entries[4].pos == "형용사"
