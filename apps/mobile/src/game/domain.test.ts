import { describe, expect, it } from 'vitest';

import {
  createShareText,
  getBestRank,
  getGuessError,
  getTemperature,
  normalizeGuess,
  parseSeed,
  sortGuessesByRank,
  type GameGuess,
} from './domain';

const guesses: GameGuess[] = [
  {
    guess: '바다',
    rank: 120,
    total: 1000,
    temperature: getTemperature(120),
    solved: false,
    source: 'guess',
  },
  {
    guess: '기술',
    rank: 1,
    total: 1000,
    temperature: getTemperature(1),
    solved: true,
    source: 'guess',
  },
];

describe('한국어 추측 입력', () => {
  it('공백을 제거하고 한글을 NFC로 합친다', () => {
    expect(normalizeGuess('  한 글 ')).toBe('한글');
    expect(getGuessError('한글')).toBeNull();
    expect(getGuessError('hello')).toBe('INVALID_KOREAN');
  });
});

describe('시드와 순위', () => {
  it('32비트 범위의 정수 시드만 허용한다', () => {
    expect(parseSeed('0')).toBe(0);
    expect(parseSeed('4294967295')).toBe(4294967295);
    expect(parseSeed('4294967296')).toBeNull();
    expect(parseSeed('1.5')).toBeNull();
  });

  it('원본을 바꾸지 않고 순위 오름차순으로 정렬한다', () => {
    expect(sortGuessesByRank(guesses).map((guess) => guess.rank)).toEqual([
      1, 120,
    ]);
    expect(guesses.map((guess) => guess.rank)).toEqual([120, 1]);
    expect(getBestRank(guesses, 1000)).toBe(1);
  });
});

describe('결과 공유', () => {
  it('정답 단어를 노출하지 않고 시드와 온도 흐름만 만든다', () => {
    const text = createShareText({ seed: 7, solved: true, guesses });
    expect(text).toContain('시드 #7');
    expect(text).toContain('2번 만에 정답!');
    expect(text).not.toContain('기술');
  });
});
