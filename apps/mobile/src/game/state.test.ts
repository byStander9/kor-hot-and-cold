import { describe, expect, it } from 'vitest';

import { getTemperature, type GameGuess } from './domain';
import { createStoredGame, parseStoredGame } from './state';

const guess: GameGuess = {
  guess: '바다',
  rank: 17,
  total: 280804,
  temperature: getTemperature(17),
  solved: false,
  source: 'guess',
};

describe('시드별 진행 상태', () => {
  it('화면 복원에 필요한 최소 필드만 저장하고 복원한다', () => {
    const stored = createStoredGame({
      seed: 7,
      gameVersion: 1,
      game: {
        guesses: [guess],
        hintCount: 1,
        gaveUp: false,
        revealedAnswer: '',
      },
    });
    const restored = parseStoredGame(JSON.stringify(stored), {
      seed: 7,
      gameVersion: 1,
      wordCount: 280804,
    });

    expect(stored.guesses[0]).toEqual({
      guess: '바다',
      rank: 17,
      source: 'guess',
    });
    expect(restored?.guesses[0]).toMatchObject({
      guess: '바다',
      rank: 17,
      total: 280804,
      solved: false,
    });
  });

  it('다른 시드나 깨진 JSON 기록은 복원하지 않는다', () => {
    const stored = createStoredGame({
      seed: 7,
      gameVersion: 1,
      game: {
        guesses: [guess],
        hintCount: 0,
        gaveUp: false,
        revealedAnswer: '',
      },
    });

    expect(
      parseStoredGame(JSON.stringify(stored), {
        seed: 8,
        gameVersion: 1,
        wordCount: 280804,
      }),
    ).toBeNull();
    expect(
      parseStoredGame('{', {
        seed: 7,
        gameVersion: 1,
        wordCount: 280804,
      }),
    ).toBeNull();
  });
});
