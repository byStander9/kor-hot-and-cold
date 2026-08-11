export const MAX_GUESS_LENGTH = 20;
export const MAX_SEED = 0xffffffff;
export const GAME_DATA_VERSION = 2;
export const LEXICON_DATA_VERSION = 1;

export type Temperature = {
  label: "정답" | "매우 뜨거움" | "뜨거움" | "따뜻함" | "차가움";
  level: 0 | 1 | 2 | 3 | 4;
};

export function normalizeGuess(input: string): string {
  return input.normalize("NFC").replace(/\s+/g, "");
}

export function isValidGuess(input: string): boolean {
  return (
    input.length > 0 &&
    input.length <= MAX_GUESS_LENGTH &&
    /^[가-힣]+$/u.test(input)
  );
}

export function parseSeed(value: unknown): number | null {
  const candidate = Array.isArray(value) ? value[0] : value;
  if (typeof candidate === "number") {
    return Number.isInteger(candidate) && candidate >= 0 && candidate <= MAX_SEED
      ? candidate
      : null;
  }
  if (typeof candidate !== "string" || !/^\d{1,10}$/.test(candidate)) {
    return null;
  }

  const seed = Number(candidate);
  return Number.isSafeInteger(seed) && seed >= 0 && seed <= MAX_SEED
    ? seed
    : null;
}

export function isSupportedGameVersion(value: unknown): boolean {
  return value === GAME_DATA_VERSION || value === String(GAME_DATA_VERSION);
}

export function selectAnswerWordId(seed: number, wordCount: number): number {
  if (!Number.isInteger(seed) || seed < 0 || seed > MAX_SEED) {
    throw new RangeError("시드는 0부터 4294967295 사이의 정수여야 합니다.");
  }
  if (!Number.isInteger(wordCount) || wordCount < 1) {
    throw new RangeError("어휘 수는 1 이상의 정수여야 합니다.");
  }

  let mixed = seed >>> 0;
  mixed = Math.imul(mixed ^ (mixed >>> 16), 0x21f0aaad);
  mixed = Math.imul(mixed ^ (mixed >>> 15), 0x735a2d97);
  mixed = (mixed ^ (mixed >>> 15)) >>> 0;
  return mixed % wordCount;
}

export function getTemperature(rank: number): Temperature {
  if (rank === 1) return { label: "정답", level: 4 };
  if (rank <= 10) return { label: "매우 뜨거움", level: 4 };
  if (rank <= 100) return { label: "뜨거움", level: 3 };
  if (rank <= 1000) return { label: "따뜻함", level: 2 };
  return { label: "차가움", level: 1 };
}

export function sortByRank<T extends { rank: number }>(items: readonly T[]): T[] {
  return items.toSorted((left, right) => left.rank - right.rank);
}

export function getHintTargetRank(bestRank: number): number {
  return Math.max(1, Math.floor(bestRank / 2));
}

export function createShareText(options: {
  seed: number;
  solved: boolean;
  attemptCount: number;
  results: Array<{ level: number; isHint: boolean }>;
  url?: string;
}): string {
  const outcome = options.solved
    ? `${options.attemptCount}번 만에 정답!`
    : "정답 확인 후 종료";
  const blocks = options.results
    .map((result) => {
      if (result.isHint) return "💡";
      if (result.level >= 4) return "🟥";
      if (result.level === 3) return "🟧";
      if (result.level === 2) return "🟨";
      return "🟦";
    })
    .join("");

  return [
    `한국어 Hot & Cold · 시드 #${options.seed}`,
    outcome,
    blocks,
    options.url,
  ]
    .filter(Boolean)
    .join("\n");
}
