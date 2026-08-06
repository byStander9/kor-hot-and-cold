from __future__ import annotations

import ast
import csv
import re
from dataclasses import dataclass
from pathlib import Path

from huggingface_hub import hf_hub_download
import pyarrow.parquet as parquet


DATASET_REPO_ID = "binjang/NIKL-korean-english-dictionary"
DATASET_REVISION = "3b4cfd2126debfd5440cade3ef6c2a3c20cf7cf9"
DATASET_FILENAME = "2024_01.csv"
STANDARD_DATASET_REPO_ID = "hac541309/stdict_kor"
STANDARD_DATASET_REVISION = "c76642c5ffc81b677ecc9971632abc7388e1264f"
STANDARD_DATASET_FILENAME = "data/train-00000-of-00001-0182eadfa4250bef.parquet"

ALLOWED_POS = {
    "명사",
    "대명사",
    "수사",
    "동사",
    "형용사",
    "관형사",
    "부사",
    "감탄사",
    "보조 동사",
    "보조 형용사",
    "의존 명사",
}
HANGUL_WORD = re.compile(r"[가-힣]{1,20}")
STANDARD_WORD = re.compile(r"^어휘: (.*?), 구성 단위:")
STANDARD_POS = re.compile(r", 품사: (.*?)(?:, 공통 문형:|, 의미 문형:)")
STANDARD_DEFINITION = re.compile(
    r", 뜻풀이: (.*?)(?:, 용례:|, 범주:|, 관련 어휘:|$)", re.DOTALL
)


@dataclass(frozen=True)
class LexiconEntry:
    word_id: int
    word: str
    pos: str
    level: str
    category: str
    definitions: tuple[str, ...]

    @property
    def embedding_text(self) -> str:
        definitions = " ".join(self.definitions[:3])
        return f"{self.word}. 품사: {self.pos}. 뜻: {definitions}"


def download_dictionary() -> Path:
    path = hf_hub_download(
        repo_id=DATASET_REPO_ID,
        repo_type="dataset",
        revision=DATASET_REVISION,
        filename=DATASET_FILENAME,
    )
    return Path(path)


def download_standard_dictionary() -> Path:
    path = hf_hub_download(
        repo_id=STANDARD_DATASET_REPO_ID,
        repo_type="dataset",
        revision=STANDARD_DATASET_REVISION,
        filename=STANDARD_DATASET_FILENAME,
    )
    return Path(path)


def _parse_definitions(raw: str) -> list[str]:
    try:
        values = ast.literal_eval(raw)
    except (SyntaxError, ValueError):
        return []

    if not isinstance(values, list):
        return []
    return [value.strip() for value in values if isinstance(value, str) and value.strip()]


def _merge_entry(
    merged: dict[str, dict[str, object]],
    *,
    word: str,
    pos: str,
    level: str,
    category: str,
    definitions: list[str],
) -> None:
    current = merged.setdefault(
        word,
        {"parts": [], "level": level, "category": category, "definitions": []},
    )
    parts = current["parts"]
    current_definitions = current["definitions"]
    assert isinstance(parts, list)
    assert isinstance(current_definitions, list)

    if pos not in parts:
        parts.append(pos)
    for definition in definitions:
        if definition not in current_definitions:
            current_definitions.append(definition)

    level_order = {"초급": 0, "중급": 1, "고급": 2, "미분류": 3}
    current_level = str(current["level"])
    if level_order.get(level, 3) < level_order.get(current_level, 3):
        current["level"] = level
    if not current["category"] and category:
        current["category"] = category


def _normalize_standard_word(raw: str) -> str:
    without_sense_number = re.sub(r"\(\d+\)$", "", raw.strip())
    return re.sub(r"[-^ ]", "", without_sense_number)


def _add_standard_dictionary(
    merged: dict[str, dict[str, object]], source_path: Path
) -> None:
    parquet_file = parquet.ParquetFile(source_path)
    for batch in parquet_file.iter_batches(columns=["text"], batch_size=8192):
        for text in batch.column(0).to_pylist():
            word_match = STANDARD_WORD.search(text)
            pos_match = STANDARD_POS.search(text)
            definition_match = STANDARD_DEFINITION.search(text)
            if not (word_match and pos_match and definition_match):
                continue

            word = _normalize_standard_word(word_match.group(1))
            pos = pos_match.group(1).strip("「」 ")
            definition = definition_match.group(1).strip()
            if pos not in ALLOWED_POS or not HANGUL_WORD.fullmatch(word) or not definition:
                continue

            _merge_entry(
                merged,
                word=word,
                pos=pos,
                level="미분류",
                category="",
                definitions=[definition],
            )


def build_lexicon(
    source_path: Path, standard_source_path: Path | None = None
) -> list[LexiconEntry]:
    merged: dict[str, dict[str, object]] = {}

    with source_path.open(encoding="utf-8-sig", newline="") as file:
        for row in csv.DictReader(file):
            word = row["Form"].strip()
            pos = row["Part of Speech"].strip()
            level = row["Vocabulary Level"].strip()

            if pos not in ALLOWED_POS:
                continue
            if not HANGUL_WORD.fullmatch(word):
                continue

            _merge_entry(
                merged,
                word=word,
                pos=pos,
                level=level or "미분류",
                category=row["Semantic Category"].strip(),
                definitions=_parse_definitions(row["Korean Definition"]),
            )

    if standard_source_path is not None:
        _add_standard_dictionary(merged, standard_source_path)

    entries: list[LexiconEntry] = []
    for word_id, word in enumerate(sorted(merged)):
        item = merged[word]
        definitions = tuple(item["definitions"])
        if not definitions:
            continue
        entries.append(
            LexiconEntry(
                word_id=word_id,
                word=word,
                pos="/".join(item["parts"]),
                level=str(item["level"]),
                category=str(item["category"]),
                definitions=definitions,
            )
        )

    return [
        LexiconEntry(
            word_id=index,
            word=entry.word,
            pos=entry.pos,
            level=entry.level,
            category=entry.category,
            definitions=entry.definitions,
        )
        for index, entry in enumerate(entries)
    ]
