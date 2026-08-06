import numpy as np

from kor_hot_and_cold_pipeline.lexicon import LexiconEntry
from kor_hot_and_cold_pipeline.ranking import (
    create_ranking,
    quantize_embeddings,
    write_embedding_shards,
)


def entry(word_id: int, word: str) -> LexiconEntry:
    return LexiconEntry(word_id, word, "명사", "초급", "", (word,))


def test_create_ranking_keeps_answer_first_and_is_deterministic() -> None:
    entries = [entry(0, "바다"), entry(1, "강"), entry(2, "산")]
    vectors = np.array(
        [
            [1.0, 0.0],
            [0.8, 0.2],
            [0.0, 1.0],
        ],
        dtype=np.float32,
    )

    ranking = create_ranking(entries, vectors, "바다")

    assert ranking.answer_word_id == 0
    assert ranking.ranks == [1, 2, 3]
    assert ranking.neighbors[0][0] == "강"


def test_quantized_embeddings_are_split_with_metadata(tmp_path) -> None:
    vectors = np.array(
        [[1.0, 0.0], [0.5, -0.5], [-1.0, 1.0]],
        dtype=np.float32,
    )

    metadata = write_embedding_shards(tmp_path, vectors, shard_size=2)

    assert quantize_embeddings(vectors).tolist() == [[127, 0], [64, -64], [-127, 127]]
    assert metadata["dimensions"] == 2
    assert metadata["wordCount"] == 3
    assert [shard["wordCount"] for shard in metadata["shards"]] == [2, 1]
    assert (tmp_path / "vectors-000.bin").stat().st_size == 4
    assert (tmp_path / "vectors-001.bin").stat().st_size == 2
