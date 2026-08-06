import { describe, expect, it } from "vitest";

import {
  createShareText,
  getHintTargetRank,
  getTemperature,
  isSupportedGameVersion,
  isValidGuess,
  MAX_SEED,
  normalizeGuess,
  parseSeed,
  selectAnswerWordId,
  sortByRank,
} from "./game";

describe("한국어 입력 정규화", () => {
  it("앞뒤와 단어 사이 공백을 제거하고 한글을 NFC로 합친다", () => {
    expect(normalizeGuess("  한 글 ")).toBe("한글");
  });

  it("완성형 한글만 허용한다", () => {
    expect(isValidGuess("바다")).toBe(true);
    expect(isValidGuess("sea")).toBe(false);
    expect(isValidGuess("")).toBe(false);
  });
});

describe("시드 퍼즐 선택", () => {
  it("32비트 범위의 숫자 문자열만 시드로 받는다", () => {
    expect(parseSeed("0")).toBe(0);
    expect(parseSeed(17)).toBe(17);
    expect(parseSeed(String(MAX_SEED))).toBe(MAX_SEED);
    expect(parseSeed(["17", "18"])).toBe(17);
    expect(parseSeed("4294967296")).toBeNull();
    expect(parseSeed("1.5")).toBeNull();
    expect(parseSeed(undefined)).toBeNull();
    expect(isSupportedGameVersion(1)).toBe(true);
    expect(isSupportedGameVersion("1")).toBe(true);
    expect(isSupportedGameVersion("2")).toBe(false);
  });

  it("같은 시드는 항상 같은 정답 ID를 만들고 사전 범위를 벗어나지 않는다", () => {
    const wordCount = 280_804;
    const first = selectAnswerWordId(20260806, wordCount);

    expect(selectAnswerWordId(20260806, wordCount)).toBe(first);
    expect(selectAnswerWordId(123456789, wordCount)).toBe(35475);
    expect(first).toBeGreaterThanOrEqual(0);
    expect(first).toBeLessThan(wordCount);
    expect(new Set([0, 1, 2, 3].map((seed) => selectAnswerWordId(seed, wordCount))).size).toBe(4);
  });
});

describe("온도 구간", () => {
  it("순위 경계에서 알맞은 한글 상태를 반환한다", () => {
    expect(getTemperature(1).label).toBe("정답");
    expect(getTemperature(10).label).toBe("매우 뜨거움");
    expect(getTemperature(100).label).toBe("뜨거움");
    expect(getTemperature(1000).label).toBe("따뜻함");
    expect(getTemperature(1001).label).toBe("차가움");
  });
});

describe("추측 순위 정렬", () => {
  it("원본 배열을 바꾸지 않고 정답에 가까운 순서로 정렬한다", () => {
    const guesses = [
      { guess: "바다", rank: 120 },
      { guess: "가족", rank: 1 },
      { guess: "사람", rank: 17 },
    ];

    expect(sortByRank(guesses).map((guess) => guess.rank)).toEqual([1, 17, 120]);
    expect(guesses.map((guess) => guess.rank)).toEqual([120, 1, 17]);
  });
});

describe("적응형 힌트", () => {
  it("현재 최고 순위보다 항상 높은 목표 순위를 만든다", () => {
    for (const bestRank of [2, 3, 10, 101, 1000, 4852]) {
      expect(getHintTargetRank(bestRank)).toBeLessThan(bestRank);
    }
  });
});

describe("결과 공유", () => {
  it("정답 단어 없이 게임 번호와 온도 흐름만 만든다", () => {
    const text = createShareText({
      seed: 7,
      solved: true,
      attemptCount: 2,
      results: [
        { level: 1, isHint: false },
        { level: 3, isHint: false },
        { level: 2, isHint: true },
      ],
    });

    expect(text).toBe("한국어 Hot & Cold · 시드 #7\n2번 만에 정답!\n🟦🟧💡");
    expect(text).not.toContain("가족");
  });
});
