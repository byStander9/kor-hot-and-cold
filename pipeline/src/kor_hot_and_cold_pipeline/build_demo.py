from __future__ import annotations

import argparse
import json
from pathlib import Path

from .lexicon import build_lexicon, download_dictionary
from .ranking import MODEL_REPO_ID, MODEL_REVISION, create_ranking, encode_entries, load_encoder


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


def main() -> int:
    args = parse_args()
    source_path = args.source or download_dictionary()
    entries = build_lexicon(source_path)
    encoder = load_encoder()
    vectors = encode_entries(entries, encoder)

    write_json(
        args.output / "dictionary.json",
        {
            "version": 1,
            "source": {
                "repo_id": "binjang/NIKL-korean-english-dictionary",
                "revision": "3b4cfd2126debfd5440cade3ef6c2a3c20cf7cf9",
            },
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

    schedule: list[dict[str, object]] = []
    evaluation: dict[str, object] = {
        "model": {"repo_id": MODEL_REPO_ID, "revision": MODEL_REVISION},
        "lexicon_size": len(entries),
        "targets": {},
    }

    for index, answer in enumerate(TARGETS, start=1):
        ranking = create_ranking(entries, vectors, answer)
        puzzle_id = f"demo-{index:03d}"
        write_json(
            args.output / "puzzles" / f"{puzzle_id}.json",
            {
                "version": 1,
                "id": puzzle_id,
                "answerWordId": ranking.answer_word_id,
                "ranks": ranking.ranks,
                "hintWordIds": ranking.hints,
                "model": {"repoId": MODEL_REPO_ID, "revision": MODEL_REVISION},
            },
        )
        schedule.append({"day": index - 1, "puzzleId": puzzle_id})
        evaluation["targets"][answer] = {
            "puzzle_id": puzzle_id,
            "neighbors": ranking.neighbors,
        }

    write_json(
        args.output / "schedule.json",
        {"version": 1, "epoch": "2026-08-06", "timezone": "Asia/Seoul", "schedule": schedule},
    )
    write_json(args.output / "evaluation.json", evaluation)

    print(f"어휘 {len(entries):,}개, 문제 {len(TARGETS)}개를 {args.output}에 생성했습니다.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

