from __future__ import annotations

import ast
import csv
import re
from dataclasses import dataclass
from pathlib import Path

from huggingface_hub import hf_hub_download


DATASET_REPO_ID = "binjang/NIKL-korean-english-dictionary"
DATASET_REVISION = "3b4cfd2126debfd5440cade3ef6c2a3c20cf7cf9"
DATASET_FILENAME = "2024_01.csv"

ALLOWED_POS = {"명사", "동사", "형용사"}
ALLOWED_LEVELS = {"초급", "중급"}
HANGUL_WORD = re.compile(r"[가-힣]{1,6}")


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


def _parse_definitions(raw: str) -> list[str]:
    try:
        values = ast.literal_eval(raw)
    except (SyntaxError, ValueError):
        return []

    if not isinstance(values, list):
        return []
    return [value.strip() for value in values if isinstance(value, str) and value.strip()]


def build_lexicon(source_path: Path) -> list[LexiconEntry]:
    merged: dict[str, dict[str, object]] = {}

    with source_path.open(encoding="utf-8-sig", newline="") as file:
        for row in csv.DictReader(file):
            word = row["Form"].strip()
            pos = row["Part of Speech"].strip()
            level = row["Vocabulary Level"].strip()

            if pos not in ALLOWED_POS or level not in ALLOWED_LEVELS:
                continue
            if not HANGUL_WORD.fullmatch(word):
                continue

            current = merged.setdefault(
                word,
                {
                    "parts": [],
                    "level": level,
                    "category": row["Semantic Category"].strip(),
                    "definitions": [],
                },
            )
            parts = current["parts"]
            definitions = current["definitions"]
            assert isinstance(parts, list)
            assert isinstance(definitions, list)

            if pos not in parts:
                parts.append(pos)
            for definition in _parse_definitions(row["Korean Definition"]):
                if definition not in definitions:
                    definitions.append(definition)
            if level == "초급":
                current["level"] = level
            if not current["category"] and row["Semantic Category"].strip():
                current["category"] = row["Semantic Category"].strip()

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
