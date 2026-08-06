from __future__ import annotations

from collections import defaultdict

from kiwipiepy import Kiwi

from .lexicon import LexiconEntry


INVARIANT_PARTICLES = ("도", "만", "의", "에", "에서", "에게", "부터", "까지")
VERB_ENDINGS: tuple[tuple[tuple[str, str], ...], ...] = (
    (("어", "EF"),),
    (("어요", "EF"),),
    (("습니다", "EF"),),
    (("었", "EP"), ("어요", "EF")),
    (("었", "EP"), ("다", "EF")),
    (("겠", "EP"), ("어요", "EF")),
    (("고", "EC"),),
    (("면", "EC"),),
    (("지만", "EC"),),
)


def _jongseong_index(word: str) -> int:
    last = ord(word[-1])
    if not 0xAC00 <= last <= 0xD7A3:
        return 0
    return (last - 0xAC00) % 28


def noun_particles(word: str) -> tuple[str, ...]:
    jongseong = _jongseong_index(word)
    has_final = jongseong != 0
    directional = "으로" if has_final and jongseong != 8 else "로"
    paired = (
        "은" if has_final else "는",
        "이" if has_final else "가",
        "을" if has_final else "를",
        "과" if has_final else "와",
        directional,
    )
    return (*paired, *INVARIANT_PARTICLES)


def build_aliases(entries: list[LexiconEntry], kiwi: Kiwi | None = None) -> dict[str, int]:
    analyzer = kiwi or Kiwi()
    headwords = {entry.word for entry in entries}
    candidates: defaultdict[str, set[int]] = defaultdict(set)

    for entry in entries:
        parts = set(entry.pos.split("/"))

        tag = "VV" if "동사" in parts else "VA" if "형용사" in parts else None
        if not tag or not entry.word.endswith("다"):
            continue

        stem = entry.word[:-1]
        endings = list(VERB_ENDINGS)
        endings.append((("는", "ETM"),) if tag == "VV" else (("은", "ETM"),))

        for ending in endings:
            try:
                surface = analyzer.join(((stem, tag), *ending))
            except ValueError:
                continue
            if surface:
                candidates[surface].add(entry.word_id)

    return {
        surface: next(iter(word_ids))
        for surface, word_ids in sorted(candidates.items())
        if surface not in headwords and len(word_ids) == 1
    }
