from kiwipiepy import Kiwi

from kor_hot_and_cold_pipeline.aliases import build_aliases, noun_particles
from kor_hot_and_cold_pipeline.lexicon import LexiconEntry


def entry(word_id: int, word: str, pos: str) -> LexiconEntry:
    return LexiconEntry(word_id, word, pos, "초급", "", ("시험 뜻풀이",))


def test_noun_particles_follow_final_consonant() -> None:
    assert "바다는" in {f"바다{particle}" for particle in noun_particles("바다")}
    assert "집은" in {f"집{particle}" for particle in noun_particles("집")}
    assert "길로" in {f"길{particle}" for particle in noun_particles("길")}


def test_build_aliases_uses_kiwi_for_irregular_conjugation() -> None:
    aliases = build_aliases(
        [
            entry(0, "듣다", "동사"),
            entry(1, "하다", "동사"),
            entry(2, "예쁘다", "형용사"),
            entry(3, "바다", "명사"),
        ],
        Kiwi(),
    )

    assert aliases["들었어요"] == 0
    assert aliases["해요"] == 1
    assert aliases["예뻐요"] == 2
    assert aliases["바다가"] == 3
