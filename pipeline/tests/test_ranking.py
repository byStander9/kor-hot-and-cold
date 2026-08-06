import numpy as np

from kor_hot_and_cold_pipeline.lexicon import LexiconEntry
from kor_hot_and_cold_pipeline.ranking import create_ranking


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

