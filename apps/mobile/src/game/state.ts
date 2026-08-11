import { getTemperature, type GameGuess, type GuessSource } from './domain';

export const STORED_GAME_SCHEMA_VERSION = 1;

export type RestoredGame = {
  guesses: GameGuess[];
  hintCount: number;
  gaveUp: boolean;
  revealedAnswer: string;
};

export type StoredGame = {
  schemaVersion: 1;
  seed: number;
  gameVersion: number;
  guesses: {
    guess: string;
    rank: number;
    source: GuessSource;
  }[];
  hintCount: number;
  gaveUp: boolean;
  revealedAnswer: string;
};

export function createStoredGame(options: {
  seed: number;
  gameVersion: number;
  game: RestoredGame;
}): StoredGame {
  return {
    schemaVersion: STORED_GAME_SCHEMA_VERSION,
    seed: options.seed,
    gameVersion: options.gameVersion,
    guesses: options.game.guesses.map(({ guess, rank, source }) => ({
      guess,
      rank,
      source,
    })),
    hintCount: options.game.hintCount,
    gaveUp: options.game.gaveUp,
    revealedAnswer: options.game.revealedAnswer,
  };
}

export function parseStoredGame(
  raw: string,
  options: { seed: number; gameVersion: number; wordCount: number },
): RestoredGame | null {
  try {
    const stored = JSON.parse(raw) as Partial<StoredGame>;
    if (
      stored.schemaVersion !== STORED_GAME_SCHEMA_VERSION ||
      stored.seed !== options.seed ||
      stored.gameVersion !== options.gameVersion ||
      !Array.isArray(stored.guesses)
    ) {
      return null;
    }

    const guesses = stored.guesses.flatMap((guess) => {
      if (
        typeof guess?.guess !== 'string' ||
        !Number.isInteger(guess.rank) ||
        guess.rank < 1 ||
        guess.rank > options.wordCount ||
        (guess.source !== 'guess' && guess.source !== 'hint')
      ) {
        return [];
      }

      return [
        {
          guess: guess.guess,
          rank: guess.rank,
          total: options.wordCount,
          temperature: getTemperature(guess.rank),
          solved: guess.rank === 1,
          source: guess.source,
        },
      ];
    });

    const revealedAnswer =
      typeof stored.revealedAnswer === 'string' ? stored.revealedAnswer : '';
    const gaveUp = stored.gaveUp === true && revealedAnswer.length > 0;

    return {
      guesses,
      hintCount: Math.min(3, Math.max(0, Number(stored.hintCount) || 0)),
      gaveUp,
      revealedAnswer,
    };
  } catch {
    return null;
  }
}
