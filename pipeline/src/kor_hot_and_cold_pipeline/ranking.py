from __future__ import annotations

from dataclasses import dataclass
from typing import Protocol, Sequence

import numpy as np
from numpy.typing import NDArray

from .lexicon import LexiconEntry


MODEL_REPO_ID = "intfloat/multilingual-e5-small"
MODEL_REVISION = "614241f622f53c4eeff9890bdc4f31cfecc418b3"
MODEL_PREFIX = "query: "


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
