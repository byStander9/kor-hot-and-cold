import { getApiBaseUrl } from './config';
import {
  isApiError,
  type GameResponse,
  type GuessRequest,
  type GuessResponse,
  type HintRequest,
  type RankingPageResponse,
  type RevealRequest,
  type RevealResponse,
} from './types';

const REQUEST_TIMEOUT_MS = 30_000;

export class ApiClientError extends Error {
  constructor(
    message: string,
    readonly kind: 'timeout' | 'network' | 'response',
    readonly status?: number,
  ) {
    super(message);
    this.name = 'ApiClientError';
  }
}

async function requestJson<T>(path: string, init?: RequestInit): Promise<T> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(`${getApiBaseUrl()}${path}`, {
      ...init,
      headers: {
        Accept: 'application/json',
        ...init?.headers,
      },
      signal: controller.signal,
    });
    const data: unknown = await response.json();

    if (!response.ok) {
      throw new ApiClientError(
        isApiError(data) ? data.error : '요청을 처리하지 못했습니다.',
        'response',
        response.status,
      );
    }

    return data as T;
  } catch (error) {
    if (error instanceof ApiClientError) throw error;
    if (error instanceof Error && error.name === 'AbortError') {
      throw new ApiClientError('요청 시간이 초과됐습니다.', 'timeout');
    }
    throw new ApiClientError('서버에 연결하지 못했습니다.', 'network');
  } finally {
    clearTimeout(timeout);
  }
}

function postJson<T>(path: string, body: unknown) {
  return requestJson<T>(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

export function getGame(seed: number, version: number) {
  const query = new URLSearchParams({
    seed: String(seed),
    v: String(version),
  });
  return requestJson<GameResponse>(`/api/game?${query}`);
}

export function submitGuess(body: GuessRequest) {
  return postJson<GuessResponse>('/api/guess', body);
}

export function requestHint(body: HintRequest) {
  return postJson<GuessResponse>('/api/hint', body);
}

export function revealAnswer(body: RevealRequest) {
  return postJson<RevealResponse>('/api/reveal', body);
}

export function getRankingPage(options: {
  seed: number;
  version: number;
  offset: number;
  limit?: number;
  includeSensitive?: boolean;
}) {
  const query = new URLSearchParams({
    seed: String(options.seed),
    v: String(options.version),
    offset: String(options.offset),
    limit: String(options.limit ?? 200),
  });
  if (options.includeSensitive) query.set('includeSensitive', '1');
  return requestJson<RankingPageResponse>(`/api/rankings?${query}`);
}
