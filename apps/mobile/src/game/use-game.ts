import { useCallback, useEffect, useState } from 'react';

import {
  ApiClientError,
  getGame,
  requestHint as fetchHint,
  revealAnswer as fetchAnswer,
  submitGuess as fetchGuess,
} from '../api/client';
import type { GameResponse } from '../api/types';
import {
  getBestRank,
  getGuessError,
  normalizeGuess,
  type GameGuess,
} from './domain';
import { loadStoredGame, saveStoredGame } from './storage';

type Action = 'idle' | 'guess' | 'hint' | 'reveal';
type InlineError = {
  message: string;
  retryable: boolean;
  operation?: Exclude<Action, 'idle'>;
} | null;

function getErrorMessage(error: unknown, fallback: string) {
  if (!(error instanceof ApiClientError)) return fallback;
  if (error.status === 404) {
    return '사전에 없는 단어예요. 다른 표현을 시도해 보세요.';
  }
  if (error.kind === 'network' || error.kind === 'timeout') {
    return '서버에 연결하지 못했어요.';
  }
  return error.message || fallback;
}

export function useGame(seed: number, gameVersion: number) {
  const [game, setGame] = useState<GameResponse | null>(null);
  const [guesses, setGuesses] = useState<GameGuess[]>([]);
  const [hintCount, setHintCount] = useState(0);
  const [gaveUp, setGaveUp] = useState(false);
  const [revealedAnswer, setRevealedAnswer] = useState('');
  const [loadState, setLoadState] = useState<'loading' | 'ready' | 'error'>(
    'loading',
  );
  const [loadError, setLoadError] = useState('');
  const [slowLoading, setSlowLoading] = useState(false);
  const [action, setAction] = useState<Action>('idle');
  const [inlineError, setInlineError] = useState<InlineError>(null);
  const [loadAttempt, setLoadAttempt] = useState(0);

  useEffect(() => {
    let active = true;
    const slowTimer = setTimeout(() => {
      if (active) setSlowLoading(true);
    }, 8_000);

    setLoadState('loading');
    setLoadError('');
    setSlowLoading(false);

    void (async () => {
      try {
        const metadata = await getGame(seed, gameVersion);
        const restored = await loadStoredGame({
          seed,
          gameVersion,
          wordCount: metadata.wordCount,
        });
        if (!active) return;

        setGame(metadata);
        setGuesses(restored?.guesses ?? []);
        setHintCount(restored?.hintCount ?? 0);
        setGaveUp(restored?.gaveUp ?? false);
        setRevealedAnswer(restored?.revealedAnswer ?? '');
        setLoadState('ready');
      } catch (error) {
        if (!active) return;
        setLoadError(getErrorMessage(error, '잠시 뒤 다시 시도해 주세요.'));
        setLoadState('error');
      } finally {
        clearTimeout(slowTimer);
      }
    })();

    return () => {
      active = false;
      clearTimeout(slowTimer);
    };
  }, [gameVersion, loadAttempt, seed]);

  useEffect(() => {
    if (loadState !== 'ready') return;
    void saveStoredGame({
      seed,
      gameVersion,
      game: { guesses, hintCount, gaveUp, revealedAnswer },
    });
  }, [gameVersion, gaveUp, guesses, hintCount, loadState, revealedAnswer, seed]);

  const solved = guesses.some((guess) => guess.solved);
  const finished = solved || gaveUp;
  const attemptCount = guesses.filter((guess) => guess.source === 'guess').length;
  const bestRank = game ? getBestRank(guesses, game.wordCount) : 0;
  const answer =
    guesses.find((guess) => guess.solved)?.guess ?? revealedAnswer;

  const runGuess = useCallback(
    async (candidate: string) => {
      if (!game || action !== 'idle' || finished) return false;

      const validationError = getGuessError(candidate);
      if (validationError) {
        setInlineError({
          message:
            validationError === 'TOO_LONG'
              ? '20자 이하의 한글 단어를 입력해 주세요.'
              : '완성된 한글 단어만 입력해 주세요.',
          retryable: false,
        });
        return false;
      }

      const normalized = normalizeGuess(candidate);
      if (guesses.some((guess) => guess.guess === normalized)) {
        setInlineError({ message: '이미 확인한 단어예요.', retryable: false });
        return false;
      }

      setAction('guess');
      setInlineError(null);
      const execute = () =>
        fetchGuess({ guess: normalized, seed, version: gameVersion });
      try {
        const result = await execute();
        if (guesses.some((guess) => guess.guess === result.guess)) {
          setInlineError({ message: '이미 확인한 단어예요.', retryable: false });
          return false;
        }
        setGuesses((current) => [
          ...current,
          { ...result, source: 'guess' },
        ]);
        return true;
      } catch (error) {
        const retryable =
          error instanceof ApiClientError &&
          (error.kind === 'network' || error.kind === 'timeout');
        setInlineError({
          message: getErrorMessage(error, '단어 순위를 확인하지 못했어요.'),
          retryable,
          operation: 'guess',
        });
        return false;
      } finally {
        setAction('idle');
      }
    }, [action, finished, game, gameVersion, guesses, seed],
  );

  const runHint = useCallback(async () => {
    if (!game || action !== 'idle' || finished || hintCount >= 3) return false;
    setAction('hint');
    setInlineError(null);
    const execute = () =>
      fetchHint({ bestRank, seed, version: gameVersion });
    try {
      const result = await execute();
      setHintCount((count) => count + 1);
      setGuesses((current) =>
        current.some((guess) => guess.guess === result.guess)
          ? current
          : [...current, { ...result, source: 'hint' }],
      );
      return true;
    } catch (error) {
      const retryable =
        error instanceof ApiClientError &&
        (error.kind === 'network' || error.kind === 'timeout');
      setInlineError({
        message: getErrorMessage(error, '힌트를 불러오지 못했어요.'),
        retryable,
        operation: 'hint',
      });
      return false;
    } finally {
      setAction('idle');
    }
  }, [action, bestRank, finished, game, gameVersion, hintCount, seed]);

  const runReveal = useCallback(async () => {
    if (action !== 'idle' || finished) return false;
    setAction('reveal');
    setInlineError(null);
    const execute = () => fetchAnswer({ seed, version: gameVersion });
    try {
      const result = await execute();
      setRevealedAnswer(result.answer);
      setGaveUp(true);
      return true;
    } catch (error) {
      const retryable =
        error instanceof ApiClientError &&
        (error.kind === 'network' || error.kind === 'timeout');
      setInlineError({
        message: getErrorMessage(error, '정답을 불러오지 못했어요.'),
        retryable,
        operation: 'reveal',
      });
      return false;
    } finally {
      setAction('idle');
    }
  }, [action, finished, gameVersion, seed]);

  return {
    action,
    answer,
    attemptCount,
    bestRank,
    finished,
    game,
    gaveUp,
    guesses,
    hintCount,
    inlineError,
    loadError,
    loadState,
    retryInitialLoad: () => setLoadAttempt((attempt) => attempt + 1),
    runGuess,
    runHint,
    runReveal,
    slowLoading,
    solved,
  };
}
