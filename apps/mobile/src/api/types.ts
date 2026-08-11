export type ApiError = {
  error: string;
};

export type Temperature = {
  label: '정답' | '매우 뜨거움' | '뜨거움' | '따뜻함' | '차가움';
  level: 0 | 1 | 2 | 3 | 4;
};

export type GameResponse = {
  seed: number;
  version: number;
  wordCount: number;
};

export type GuessRequest = {
  guess: string;
  seed: number;
  version: number;
};

export type GuessResponse = {
  guess: string;
  rank: number;
  total: number;
  temperature: Temperature;
  solved: boolean;
};

export type HintRequest = {
  bestRank: number;
  seed: number;
  version: number;
};

export type RevealRequest = {
  seed: number;
  version: number;
};

export type RevealResponse = {
  answer: string;
};

export type RankingEntry = {
  word: string;
  rank: number;
};

export type RankingPageResponse = {
  items: RankingEntry[];
  offset: number;
  limit: number;
  total: number;
  nextOffset: number | null;
};

export function isApiError(value: unknown): value is ApiError {
  return (
    typeof value === 'object' &&
    value !== null &&
    'error' in value &&
    typeof value.error === 'string'
  );
}
