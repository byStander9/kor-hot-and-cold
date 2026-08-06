from __future__ import annotations

from dataclasses import dataclass
import json
from pathlib import Path
from typing import Protocol, Sequence

import numpy as np
from numpy.typing import NDArray

from .lexicon import LexiconEntry


MODEL_REPO_ID = "intfloat/multilingual-e5-small"
MODEL_REVISION = "614241f622f53c4eeff9890bdc4f31cfecc418b3"
MODEL_PREFIX = "query: "
QUANTIZATION_SCALE = 127
VECTOR_SHARD_SIZE = 50_000


class Encoder(Protocol):
    def encode(self, sentences: Sequence[str], **kwargs: object) -> NDArray[np.float32]: ...


@dataclass(frozen=True)
class PuzzleRanking:
    answer: str
    answer_word_id: int
    ranks: list[int]
    hints: list[int]
    neighbors: list[tuple[str, float]]


def load_encoder() -> Encoder:
    from sentence_transformers import SentenceTransformer

    return SentenceTransformer(MODEL_REPO_ID, revision=MODEL_REVISION)


def encode_entries(entries: Sequence[LexiconEntry], encoder: Encoder) -> NDArray[np.float32]:
    vectors = encoder.encode(
        [MODEL_PREFIX + entry.embedding_text for entry in entries],
        batch_size=128,
        convert_to_numpy=True,
        normalize_embeddings=True,
        show_progress_bar=True,
    )
    return np.asarray(vectors, dtype=np.float32)


def quantize_embeddings(vectors: NDArray[np.float32]) -> NDArray[np.int8]:
    return np.rint(np.clip(vectors, -1.0, 1.0) * QUANTIZATION_SCALE).astype(np.int8)


def write_embedding_shards(
    output: Path,
    vectors: NDArray[np.float32],
    shard_size: int = VECTOR_SHARD_SIZE,
) -> dict[str, object]:
    if vectors.ndim != 2 or vectors.shape[0] == 0 or vectors.shape[1] == 0:
        raise ValueError("임베딩은 비어 있지 않은 2차원 배열이어야 합니다.")
    if shard_size < 1:
        raise ValueError("분할 크기는 1 이상이어야 합니다.")

    output.mkdir(parents=True, exist_ok=True)
    for stale_shard in output.glob("vectors-*.bin"):
        stale_shard.unlink()

    quantized = quantize_embeddings(vectors)
    shards: list[dict[str, object]] = []
    for shard_index, start in enumerate(range(0, len(quantized), shard_size)):
        shard = quantized[start : start + shard_size]
        filename = f"vectors-{shard_index:03d}.bin"
        (output / filename).write_bytes(shard.tobytes(order="C"))
        shards.append(
            {
                "file": filename,
                "startWordId": start,
                "wordCount": len(shard),
            }
        )

    metadata: dict[str, object] = {
        "version": 1,
        "format": "int8-row-major",
        "dimensions": vectors.shape[1],
        "scale": QUANTIZATION_SCALE,
        "wordCount": vectors.shape[0],
        "model": {"repoId": MODEL_REPO_ID, "revision": MODEL_REVISION},
        "shards": shards,
    }
    (output / "vectors.json").write_text(
        json.dumps(metadata, ensure_ascii=False, separators=(",", ":")),
        encoding="utf-8",
    )
    return metadata


def create_ranking(
    entries: Sequence[LexiconEntry],
    vectors: NDArray[np.float32],
    answer: str,
) -> PuzzleRanking:
    word_to_id = {entry.word: entry.word_id for entry in entries}
    if answer not in word_to_id:
        raise ValueError(f"정답 후보가 어휘집에 없습니다: {answer}")

    answer_word_id = word_to_id[answer]
    scores = vectors @ vectors[answer_word_id]
    stable_order = np.lexsort((np.arange(len(entries)), -scores))
    order = np.concatenate(
        ([answer_word_id], stable_order[stable_order != answer_word_id])
    )

    rank_array = np.empty(len(entries), dtype=np.int32)
    rank_array[order] = np.arange(1, len(entries) + 1, dtype=np.int32)

    hint_ranks = [min(rank, len(entries)) for rank in (1000, 300, 80)]
    hint_ids = [int(order[rank - 1]) for rank in hint_ranks]
    neighbors = [
        (entries[int(word_id)].word, round(float(scores[int(word_id)]), 6))
        for word_id in order[1:31]
    ]

    return PuzzleRanking(
        answer=answer,
        answer_word_id=answer_word_id,
        ranks=rank_array.tolist(),
        hints=hint_ids,
        neighbors=neighbors,
    )
