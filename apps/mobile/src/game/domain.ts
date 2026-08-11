import type { GuessResponse, Temperature } from '../api/types';

export const GAME_DATA_VERSION = 1;
export const MAX_SEED = 0xffffffff;
export const MAX_GUESS_LENGTH = 20;

export type GuessSource = 'guess' | 'hint';

export type GameGuess = GuessResponse & {
  source: GuessSource;
};

export function normalizeGuess(input: string) {
  return input.normalize('NFC').replace(/\s+/g, '');
}

export function getGuessError(input: string) {
  const normalized = normalizeGuess(input);
  if (normalized.length === 0) return 'EMPTY' as const;
  if (normalized.length > MAX_GUESS_LENGTH) return 'TOO_LONG' as const;
  if (!/^[가-힣]+$/u.test(normalized)) return 'INVALID_KOREAN' as const;
  return null;
}

export function parseSeed(input: unknown) {
  const value = Array.isArray(input) ? input[0] : input;
  if (typeof value === 'number') {
    return Number.isInteger(value) && value >= 0 && value <= MAX_SEED
      ? value
      : null;
  }
  if (typeof value !== 'string' || !/^\d{1,10}$/.test(value)) return null;

  const seed = Number(value);
  return Number.isSafeInteger(seed) && seed <= MAX_SEED ? seed : null;
}

export function createRandomSeed() {
  return Math.floor(Math.random() * (MAX_SEED + 1));
}

export function resolveRouteSeed(input: unknown, generatedSeed: number | null) {
  return input === undefined ? generatedSeed : parseSeed(input);
}

export function getTemperature(rank: number): Temperature {
  if (rank === 1) return { label: '정답', level: 4 };
  if (rank <= 10) return { label: '매우 뜨거움', level: 4 };
  if (rank <= 100) return { label: '뜨거움', level: 3 };
  if (rank <= 1000) return { label: '따뜻함', level: 2 };
  return { label: '차가움', level: 1 };
}

export function sortGuessesByRank(guesses: readonly GameGuess[]) {
  return [...guesses].sort((left, right) => left.rank - right.rank);
}

export function getBestRank(guesses: readonly GameGuess[], wordCount: number) {
  return guesses.reduce(
    (best, guess) => Math.min(best, guess.rank),
    wordCount + 1,
  );
}

export function createShareText(options: {
  seed: number;
  solved: boolean;
  guesses: readonly GameGuess[];
  url?: string;
}) {
  const attempts = options.guesses.filter((guess) => guess.source === 'guess');
  const outcome = options.solved
    ? `${attempts.length}번 만에 정답!`
    : '정답 확인 후 종료';
  const blocks = options.guesses
    .map((guess) => {
      if (guess.source === 'hint') return '💡';
      if (guess.temperature.level >= 4) return '🟥';
      if (guess.temperature.level === 3) return '🟧';
      if (guess.temperature.level === 2) return '🟨';
      return '🟦';
    })
    .join('');

  return [
    `뜨겁고 차갑게 · 시드 #${options.seed}`,
    outcome,
    blocks,
    options.url,
  ]
    .filter(Boolean)
    .join('\n');
}
