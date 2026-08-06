from __future__ import annotations

import argparse
import json
from pathlib import Path

from .aliases import build_aliases
from .lexicon import (
    DATASET_REPO_ID,
    DATASET_REVISION,
    STANDARD_DATASET_REPO_ID,
    STANDARD_DATASET_REVISION,
    build_lexicon,
    download_dictionary,
    download_standard_dictionary,
)
from .ranking import (
    MODEL_REPO_ID,
    MODEL_REVISION,
    create_ranking,
    encode_entries,
    load_encoder,
    write_embedding_shards,
)


TARGETS = [
    "가족",
    "겨울",
    "꿈",
    "날씨",
    "돈",
    "동물",
    "바다",
    "병원",
    "사랑",
    "시간",
    "여행",
    "영화",
    "운동",
    "음식",
    "음악",
    "자동차",
    "책",
    "친구",
    "컴퓨터",
    "학교",
]


def repo_root() -> Path:
    return Path(__file__).resolve().parents[3]


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="공개 자료로 데모용 순위 데이터를 만듭니다.")
    parser.add_argument("--source", type=Path, help="이미 내려받은 사전 CSV 경로")
    parser.add_argument(
        "--standard-source", type=Path, help="이미 내려받은 표준국어대사전 Parquet 경로"
    )
    parser.add_argument(
        "--output",
        type=Path,
        default=repo_root() / "data" / "demo",
        help="생성 데이터를 저장할 경로",
    )
    return parser.parse_args()


def write_json(path: Path, value: object) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(
        json.dumps(value, ensure_ascii=False, separators=(",", ":")),
        encoding="utf-8",
    )


def remove_legacy_puzzles(output: Path) -> None:
    (output / "schedule.json").unlink(missing_ok=True)
    puzzle_directory = output / "puzzles"
    if not puzzle_directory.exists():
        return
    for puzzle_path in puzzle_directory.glob("demo-*.json"):
        puzzle_path.unlink()
    try:
        puzzle_directory.rmdir()
    except OSError:
        pass


def main() -> int:
    args = parse_args()
    remove_legacy_puzzles(args.output)
    source_path = args.source or download_dictionary()
    standard_source_path = args.standard_source or download_standard_dictionary()
    entries = build_lexicon(source_path, standard_source_path)
    encoder = load_encoder()
    vectors = encode_entries(entries, encoder)
    write_embedding_shards(args.output, vectors)

    write_json(
        args.output / "dictionary.json",
        {
            "version": 1,
            "sources": [
                {"repo_id": DATASET_REPO_ID, "revision": DATASET_REVISION},
                {
                    "repo_id": STANDARD_DATASET_REPO_ID,
                    "revision": STANDARD_DATASET_REVISION,
                },
            ],
            "words": [
                {
                    "id": entry.word_id,
                    "word": entry.word,
                    "pos": entry.pos,
                    "level": entry.level,
                    "category": entry.category,
                }
                for entry in entries
            ],
        },
    )
    aliases = build_aliases(entries)
    write_json(
        args.output / "aliases.json",
        {
            "version": 1,
            "source": {
                "software": "Kiwi/kiwipiepy",
                "license": "LGPL-3.0",
            },
            "count": len(aliases),
            "aliases": aliases,
        },
    )

    evaluation: dict[str, object] = {
        "model": {"repo_id": MODEL_REPO_ID, "revision": MODEL_REVISION},
        "lexicon_size": len(entries),
        "targets": {},
    }

    for answer in TARGETS:
        ranking = create_ranking(entries, vectors, answer)
        evaluation["targets"][answer] = {
            "neighbors": ranking.neighbors,
        }

    write_json(args.output / "evaluation.json", evaluation)

    print(
        f"어휘 {len(entries):,}개, 별칭 {len(aliases):,}개, "
        f"전체 어휘 임베딩을 {args.output}에 생성했습니다."
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
