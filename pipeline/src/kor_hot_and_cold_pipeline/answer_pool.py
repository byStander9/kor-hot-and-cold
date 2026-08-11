from __future__ import annotations

import argparse
import hashlib
import json
from pathlib import Path
from typing import Any


def repo_root() -> Path:
    return Path(__file__).resolve().parents[3]


def canonical_word_ids(word_ids: list[int]) -> bytes:
    return json.dumps(word_ids, separators=(",", ":")).encode("utf-8")


def answer_pool_sha256(word_ids: list[int]) -> str:
    return hashlib.sha256(canonical_word_ids(word_ids)).hexdigest()


def build_answer_pool(
    words: list[dict[str, Any]], policy: dict[str, Any]
) -> dict[str, Any]:
    criteria = policy["criteria"]
    levels = set(criteria["levels"])
    parts_of_speech = set(criteria["partsOfSpeech"])
    denied_categories = set(policy["deniedCategories"])
    denied_words = set(policy["deniedAnswerWords"])
    minimum_length = int(criteria["minimumLength"])
    maximum_length = int(criteria["maximumLength"])
    require_category = bool(criteria["requiredCategory"])

    word_ids = sorted(
        int(word["id"])
        for word in words
        if word["level"] in levels
        and (not require_category or bool(word["category"]))
        and minimum_length <= len(word["word"]) <= maximum_length
        and parts_of_speech.intersection(str(word["pos"]).split("/"))
        and word["category"] not in denied_categories
        and word["word"] not in denied_words
    )

    if not word_ids or len(word_ids) != len(set(word_ids)):
        raise ValueError("정답 풀은 중복 없는 한 개 이상의 어휘 ID여야 합니다.")

    return {
        "gameVersion": int(policy["gameVersion"]),
        "lexiconVersion": int(policy["lexiconVersion"]),
        "policyVersion": int(policy["policyVersion"]),
        "count": len(word_ids),
        "sha256": answer_pool_sha256(word_ids),
        "wordIds": word_ids,
    }


def write_json(path: Path, value: object) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(
        json.dumps(value, ensure_ascii=False, separators=(",", ":")),
        encoding="utf-8",
    )


def parse_args() -> argparse.Namespace:
    root = repo_root()
    parser = argparse.ArgumentParser(
        description="현재 사전과 안전 정책에서 시드 정답 allowlist를 생성합니다."
    )
    parser.add_argument(
        "--dictionary",
        type=Path,
        default=root / "data" / "demo" / "dictionary.json",
    )
    parser.add_argument(
        "--policy",
        type=Path,
        default=root / "data" / "safety" / "answer-policy.json",
    )
    parser.add_argument(
        "--output",
        type=Path,
        default=root / "data" / "demo" / "answer-pool.json",
    )
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    dictionary = json.loads(args.dictionary.read_text(encoding="utf-8"))
    policy = json.loads(args.policy.read_text(encoding="utf-8"))
    if int(dictionary["version"]) != int(policy["lexiconVersion"]):
        raise ValueError("사전과 안전 정책의 lexiconVersion이 일치하지 않습니다.")

    answer_pool = build_answer_pool(dictionary["words"], policy)
    write_json(args.output, answer_pool)
    print(
        f"정답 allowlist {answer_pool['count']:,}개를 {args.output}에 생성했습니다."
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
