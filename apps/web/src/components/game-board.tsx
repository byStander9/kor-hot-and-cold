"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

import {
  createShareText,
  GAME_DATA_VERSION,
  getTemperature,
  parseSeed,
  sortByRank,
} from "@/lib/game";

import styles from "./game-board.module.css";

type GuessResult = {
  guess: string;
  rank: number;
  total: number;
  temperature: {
    label: string;
    level: number;
  };
  solved: boolean;
  source?: "guess" | "hint";
};

type RankingEntry = {
  word: string;
  rank: number;
};

type GuessResponse = GuessResult & {
  rankings?: RankingEntry[];
};

type Props = {
  wordCount: number;
  seed: number;
  gameVersion: number;
};

type StoredGame = {
  version: 2;
  seed: number;
  gameVersion: number;
  guesses: Array<{
    guess: string;
    rank: number;
    source: "guess" | "hint";
  }>;
  hintCount: number;
  gaveUp: boolean;
  revealedAnswer: string;
};

const STORAGE_PREFIX = "kor-hot-and-cold:game:v2";
const RANKING_PAGE_SIZE = 500;

function loadStoredGame(seed: number, gameVersion: number, wordCount: number) {
  try {
    const raw = localStorage.getItem(`${STORAGE_PREFIX}:${gameVersion}:${seed}`);
    if (!raw) return null;

    const stored = JSON.parse(raw) as Partial<StoredGame>;
    if (
      stored.version !== 2 ||
      stored.seed !== seed ||
      stored.gameVersion !== gameVersion ||
      !Array.isArray(stored.guesses)
    ) {
      return null;
    }

    const guesses = stored.guesses.flatMap((guess) => {
      if (
        typeof guess?.guess !== "string" ||
        !Number.isInteger(guess?.rank) ||
        guess.rank < 1 ||
        guess.rank > wordCount ||
        (guess.source !== "guess" && guess.source !== "hint")
      ) {
        return [];
      }

      return [
        {
          ...guess,
          total: wordCount,
          temperature: getTemperature(guess.rank),
          solved: guess.rank === 1,
        },
      ];
    });

    return {
      guesses,
      hintCount: Math.min(3, Math.max(0, Number(stored.hintCount) || 0)),
      gaveUp: stored.gaveUp === true,
      revealedAnswer:
        typeof stored.revealedAnswer === "string" ? stored.revealedAnswer : "",
    };
  } catch {
    return null;
  }
}

export default function GameBoard({ wordCount, seed, gameVersion }: Props) {
  const router = useRouter();
  const [input, setInput] = useState("");
  const [seedInput, setSeedInput] = useState(String(seed));
  const [guesses, setGuesses] = useState<GuessResult[]>([]);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hintCount, setHintCount] = useState(0);
  const [revealedAnswer, setRevealedAnswer] = useState("");
  const [gaveUp, setGaveUp] = useState(false);
  const [storageReady, setStorageReady] = useState(false);
  const [shareMessage, setShareMessage] = useState("");
  const [allRankings, setAllRankings] = useState<RankingEntry[]>([]);
  const [showAllRankings, setShowAllRankings] = useState(false);
  const [rankingPage, setRankingPage] = useState(0);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      const stored = loadStoredGame(seed, gameVersion, wordCount);
      if (stored) {
        setGuesses(stored.guesses);
        setHintCount(stored.hintCount);
        setGaveUp(stored.gaveUp);
        setRevealedAnswer(stored.revealedAnswer);
      }
      setStorageReady(true);
    });

    return () => window.cancelAnimationFrame(frame);
  }, [gameVersion, seed, wordCount]);

  useEffect(() => {
    if (!storageReady) return;

    const stored: StoredGame = {
      version: 2,
      seed,
      gameVersion,
      guesses: guesses.map(({ guess, rank, source = "guess" }) => ({
        guess,
        rank,
        source,
      })),
      hintCount,
      gaveUp,
      revealedAnswer,
    };

    try {
      localStorage.setItem(
        `${STORAGE_PREFIX}:${gameVersion}:${seed}`,
        JSON.stringify(stored),
      );
    } catch {
      // 저장소가 차단된 환경에서도 현재 게임은 계속 진행한다.
    }
  }, [gameVersion, gaveUp, guesses, hintCount, revealedAnswer, seed, storageReady]);

  const attemptCount = guesses.filter((guess) => guess.source !== "hint").length;
  const bestRank = guesses.reduce(
    (best, guess) => Math.min(best, guess.rank),
    wordCount + 1,
  );
  const solved = guesses.some((guess) => guess.solved);
  const finished = solved || gaveUp;
  const rankedGuesses = sortByRank(guesses);
  const rankingPageCount = Math.ceil(allRankings.length / RANKING_PAGE_SIZE);
  const rankingStart = rankingPage * RANKING_PAGE_SIZE;
  const visibleRankings = allRankings.slice(
    rankingStart,
    rankingStart + RANKING_PAGE_SIZE,
  );

  async function submitGuess(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const candidate = input.trim();
    if (!candidate || isSubmitting || finished) return;

    if (guesses.some((guess) => guess.guess === candidate.replace(/\s+/g, ""))) {
      setError("이미 확인한 단어예요.");
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      const response = await fetch("/api/guess", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ guess: candidate, seed, version: gameVersion }),
      });
      const data = (await response.json()) as GuessResponse | { error: string };

      if (!response.ok || "error" in data) {
        setError("error" in data ? data.error : "단어를 확인하지 못했습니다.");
        return;
      }

      if (guesses.some((guess) => guess.guess === data.guess)) {
        setError(`이미 ${data.guess}의 순위를 확인했어요.`);
        setInput("");
        return;
      }

      setGuesses((current) => [{ ...data, source: "guess" }, ...current]);
      if (data.rankings) setAllRankings(data.rankings);
      setInput("");
    } catch {
      setError("서버에 연결하지 못했습니다. 잠시 뒤 다시 시도해 주세요.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function requestHint() {
    if (hintCount >= 3 || isSubmitting || finished) return;
    setIsSubmitting(true);
    setError("");

    try {
      const response = await fetch("/api/hint", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bestRank, seed, version: gameVersion }),
      });
      const data = (await response.json()) as GuessResult | { error: string };

      if (!response.ok || "error" in data) {
        setError("error" in data ? data.error : "힌트를 불러오지 못했습니다.");
        return;
      }

      setHintCount((count) => count + 1);
      setGuesses((current) =>
        current.some((guess) => guess.guess === data.guess)
          ? current
          : [{ ...data, source: "hint" }, ...current],
      );
    } catch {
      setError("힌트를 불러오지 못했습니다. 잠시 뒤 다시 시도해 주세요.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function giveUp() {
    if (isSubmitting || finished) return;
    if (!window.confirm("이 시드의 정답을 확인하고 게임을 끝낼까요?")) return;

    setIsSubmitting(true);
    setError("");

    try {
      const response = await fetch("/api/reveal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ seed, version: gameVersion }),
      });
      const data = (await response.json()) as {
        answer?: string;
        rankings?: RankingEntry[];
        error?: string;
      };

      if (!response.ok || !data.answer || !data.rankings) {
        setError(data.error || "정답을 불러오지 못했습니다.");
        return;
      }

      setRevealedAnswer(data.answer);
      setAllRankings(data.rankings);
      setGaveUp(true);
    } catch {
      setError("정답을 불러오지 못했습니다. 잠시 뒤 다시 시도해 주세요.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function toggleAllRankings() {
    if (showAllRankings) {
      setShowAllRankings(false);
      return;
    }

    if (allRankings.length > 0) {
      setRankingPage(0);
      setShowAllRankings(true);
      return;
    }

    setIsSubmitting(true);
    setShareMessage("");

    try {
      const response = await fetch("/api/reveal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ seed, version: gameVersion }),
      });
      const data = (await response.json()) as {
        answer?: string;
        rankings?: RankingEntry[];
        error?: string;
      };

      if (!response.ok || !data.rankings) {
        setShareMessage(data.error || "전체 순위를 불러오지 못했습니다.");
        return;
      }

      if (data.answer) setRevealedAnswer(data.answer);
      setAllRankings(data.rankings);
      setRankingPage(0);
      setShowAllRankings(true);
    } catch {
      setShareMessage(
        "전체 순위를 불러오지 못했습니다. 잠시 뒤 다시 시도해 주세요.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  async function shareResult() {
    const text = createShareText({
      seed,
      solved,
      attemptCount,
      results: [...guesses].reverse().map((guess) => ({
        level: guess.temperature.level,
        isHint: guess.source === "hint",
      })),
      url: window.location.href,
    });

    try {
      if (navigator.share) {
        await navigator.share({ title: "한국어 Hot and Cold", text });
        setShareMessage("공유 메뉴를 열었습니다.");
      } else {
        await navigator.clipboard.writeText(text);
        setShareMessage("결과를 클립보드에 복사했습니다.");
      }
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return;
      setShareMessage("공유하지 못했습니다. 다시 시도해 주세요.");
    }
  }

  function navigateToSeed(nextSeed: number) {
    router.push(`/?seed=${nextSeed}&v=${GAME_DATA_VERSION}`);
  }

  function startRandomGame() {
    const values = new Uint32Array(1);
    window.crypto.getRandomValues(values);
    navigateToSeed(values[0]);
  }

  function openSeed(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const requestedSeed = parseSeed(seedInput);
    if (requestedSeed === null) {
      setError("시드는 0부터 4294967295 사이의 정수로 입력해 주세요.");
      return;
    }
    navigateToSeed(requestedSeed);
  }

  return (
    <section id="game" className={styles.board} aria-label="단어 추측 게임">
      <div className={styles.thermometer} aria-hidden="true">
        <span>차가움</span>
        <div className={styles.thermometerTrack} />
        <span>뜨거움</span>
      </div>

      <div className={styles.seedControls}>
        <form onSubmit={openSeed}>
          <label htmlFor="seed">게임 시드</label>
          <input
            id="seed"
            inputMode="numeric"
            pattern="[0-9]*"
            value={seedInput}
            onChange={(event) => setSeedInput(event.target.value)}
            aria-describedby="seed-help"
          />
          <button type="submit">시드 열기</button>
        </form>
        <button type="button" onClick={startRandomGame}>
          랜덤 새 게임
        </button>
        <p id="seed-help">같은 시드를 공유하면 모두 같은 문제로 경쟁할 수 있어요.</p>
      </div>

      {solved ? (
        <div className={styles.solved} role="status">
          <span className={styles.solvedMark}>정답!</span>
          <strong>{guesses.find((guess) => guess.solved)?.guess}</strong>
          <p>{attemptCount}번 만에 이 시드의 단어를 찾았습니다.</p>
        </div>
      ) : gaveUp ? (
        <div className={styles.revealed} role="status">
          <span>이 시드의 정답</span>
          <strong>{revealedAnswer || "확인 완료"}</strong>
          <p>랜덤 새 게임을 눌러 바로 다음 문제를 시작할 수 있어요.</p>
        </div>
      ) : (
        <form className={styles.form} onSubmit={submitGuess}>
          <label htmlFor="guess">어떤 단어가 떠오르나요?</label>
          <div className={styles.inputRow}>
            <input
              id="guess"
              name="guess"
              value={input}
              onChange={(event) => setInput(event.target.value)}
              maxLength={20}
              autoComplete="off"
              autoCapitalize="none"
              placeholder="예: 바다"
              aria-describedby="guess-message"
            />
            <button type="submit" disabled={isSubmitting || !input.trim()}>
              {isSubmitting ? "확인 중" : "추측하기"}
            </button>
          </div>
          <p
            id="guess-message"
            className={error ? styles.error : styles.help}
            aria-live="polite"
          >
            {error || "기본형뿐 아니라 자주 쓰는 조사·활용형도 입력할 수 있어요."}
          </p>
        </form>
      )}

      {!finished ? (
        <div className={styles.actions}>
          <button
            type="button"
            onClick={requestHint}
            disabled={isSubmitting || hintCount >= 3}
          >
            힌트 보기 <span>{hintCount}/3</span>
          </button>
          <button type="button" onClick={giveUp} disabled={isSubmitting}>
            포기하고 정답 보기
          </button>
        </div>
      ) : null}

      {finished ? (
        <div className={styles.finishActions}>
          <button type="button" onClick={shareResult}>
            결과 공유하기
          </button>
          <button
            type="button"
            onClick={toggleAllRankings}
            disabled={isSubmitting}
          >
            {showAllRankings ? "전체 순위 닫기" : "전체 순위 보기"}
          </button>
          <p aria-live="polite">{shareMessage}</p>
        </div>
      ) : null}

      <div className={styles.summary} aria-live="polite">
        <div>
          <span>시도</span>
          <strong>{attemptCount}</strong>
        </div>
        <div>
          <span>최고 순위</span>
          <strong>{guesses.length > 0 ? `${bestRank}위` : "—"}</strong>
        </div>
      </div>

      {guesses.length > 0 ? (
        <div className={styles.tableWrap}>
          <table>
            <caption className={styles.srOnly}>
              입력한 단어를 의미 근접 순위가 높은 순서로 정렬
            </caption>
            <thead>
              <tr>
                <th scope="col">단어</th>
                <th scope="col">온도</th>
                <th scope="col">순위</th>
              </tr>
            </thead>
            <tbody>
              {rankedGuesses.map((guess) => {
                const closeness = Math.max(
                  3,
                  ((guess.total - guess.rank + 1) / guess.total) * 100,
                );

                return (
                  <tr key={guess.guess}>
                    <th scope="row">
                      {guess.guess}
                      {guess.source === "hint" ? (
                        <span className={styles.hintBadge}>힌트</span>
                      ) : null}
                    </th>
                    <td>
                      <span
                        className={styles.temperature}
                        data-level={guess.temperature.level}
                      >
                        {guess.temperature.label}
                      </span>
                      <span className={styles.rankBar} aria-hidden="true">
                        <span style={{ width: `${closeness}%` }} />
                      </span>
                    </td>
                    <td className={styles.rank}>{guess.rank.toLocaleString("ko-KR")}위</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div className={styles.empty}>
          <span aria-hidden="true">?</span>
          <p>첫 단어를 입력하면 여기에 순위가 쌓여요.</p>
        </div>
      )}

      {showAllRankings ? (
        <section
          className={styles.fullRanking}
          aria-labelledby="full-ranking-title"
        >
          <header>
            <h2 id="full-ranking-title">전체 순위</h2>
            <p>
              {allRankings.length.toLocaleString("ko-KR")}개 단어 · 1위부터
              정렬
            </p>
          </header>
          <div className={styles.fullRankingTable}>
            <table>
              <caption className={styles.srOnly}>
                이 시드의 모든 단어 의미 근접 순위
              </caption>
              <thead>
                <tr>
                  <th scope="col">순위</th>
                  <th scope="col">단어</th>
                </tr>
              </thead>
              <tbody>
                {visibleRankings.map((entry) => (
                  <tr key={entry.word}>
                    <td className={styles.rank}>
                      {entry.rank.toLocaleString("ko-KR")}위
                    </td>
                    <th scope="row">{entry.word}</th>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <nav className={styles.rankingPagination} aria-label="전체 순위 페이지">
            <button
              type="button"
              onClick={() => setRankingPage(0)}
              disabled={rankingPage === 0}
            >
              처음
            </button>
            <button
              type="button"
              onClick={() => setRankingPage((page) => Math.max(0, page - 1))}
              disabled={rankingPage === 0}
            >
              이전
            </button>
            <span aria-live="polite">
              {rankingPage + 1}/{rankingPageCount} 페이지 · {rankingStart + 1}–
              {Math.min(rankingStart + RANKING_PAGE_SIZE, allRankings.length)}위
            </span>
            <button
              type="button"
              onClick={() =>
                setRankingPage((page) => Math.min(rankingPageCount - 1, page + 1))
              }
              disabled={rankingPage >= rankingPageCount - 1}
            >
              다음
            </button>
            <button
              type="button"
              onClick={() => setRankingPage(rankingPageCount - 1)}
              disabled={rankingPage >= rankingPageCount - 1}
            >
              마지막
            </button>
          </nav>
        </section>
      ) : null}
    </section>
  );
}
