"use client";

import { useState, type FormEvent } from "react";

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

type Props = {
  wordCount: number;
};

export default function GameBoard({ wordCount }: Props) {
  const [input, setInput] = useState("");
  const [guesses, setGuesses] = useState<GuessResult[]>([]);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hintCount, setHintCount] = useState(0);
  const [revealedAnswer, setRevealedAnswer] = useState("");

  const attemptCount = guesses.filter((guess) => guess.source !== "hint").length;
  const bestRank = guesses.reduce(
    (best, guess) => Math.min(best, guess.rank),
    wordCount,
  );
  const solved = guesses.some((guess) => guess.solved);
  const finished = solved || Boolean(revealedAnswer);

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
        body: JSON.stringify({ guess: candidate }),
      });
      const data = (await response.json()) as GuessResult | { error: string };

      if (!response.ok || "error" in data) {
        setError("error" in data ? data.error : "단어를 확인하지 못했습니다.");
        return;
      }

      setGuesses((current) => [{ ...data, source: "guess" }, ...current]);
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
        body: JSON.stringify({ hintIndex: hintCount }),
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
    if (!window.confirm("오늘의 정답을 확인하고 게임을 끝낼까요?")) return;

    setIsSubmitting(true);
    setError("");

    try {
      const response = await fetch("/api/reveal", { method: "POST" });
      const data = (await response.json()) as { answer?: string; error?: string };

      if (!response.ok || !data.answer) {
        setError(data.error || "정답을 불러오지 못했습니다.");
        return;
      }

      setRevealedAnswer(data.answer);
    } catch {
      setError("정답을 불러오지 못했습니다. 잠시 뒤 다시 시도해 주세요.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section id="game" className={styles.board} aria-label="단어 추측 게임">
      <div className={styles.thermometer} aria-hidden="true">
        <span>차가움</span>
        <div className={styles.thermometerTrack} />
        <span>뜨거움</span>
      </div>

      {solved ? (
        <div className={styles.solved} role="status">
          <span className={styles.solvedMark}>정답!</span>
          <strong>{guesses.find((guess) => guess.solved)?.guess}</strong>
          <p>{attemptCount}번 만에 오늘의 단어를 찾았습니다.</p>
        </div>
      ) : revealedAnswer ? (
        <div className={styles.revealed} role="status">
          <span>오늘의 정답</span>
          <strong>{revealedAnswer}</strong>
          <p>내일 새로운 단어로 다시 만나요.</p>
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
            {error || "명사·동사·형용사의 사전 기본형을 입력하세요."}
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
            <caption className={styles.srOnly}>입력한 단어의 의미 근접 순위</caption>
            <thead>
              <tr>
                <th scope="col">단어</th>
                <th scope="col">온도</th>
                <th scope="col">순위</th>
              </tr>
            </thead>
            <tbody>
              {guesses.map((guess) => {
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
    </section>
  );
}
