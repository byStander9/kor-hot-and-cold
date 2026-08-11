import { readFileSync } from "node:fs";
import path from "node:path";

import { expect, test } from "@playwright/test";

const dataDirectory = path.resolve(process.cwd(), "../../data/demo");
const dictionary = JSON.parse(
  readFileSync(path.join(dataDirectory, "dictionary.json"), "utf8"),
) as { words: Array<{ id: number; word: string }> };
const answerPool = JSON.parse(
  readFileSync(path.join(dataDirectory, "answer-pool.json"), "utf8"),
) as { wordIds: number[] };
const safeAnswerWords = new Set(
  answerPool.wordIds.map((wordId) => dictionary.words[wordId].word),
);

test.beforeEach(async ({ page }) => {
  await page.goto("/?seed=123456789&v=2");
  await page.evaluate(() => localStorage.clear());
  await page.reload();
});

test("조사가 붙은 추측을 판정하고 새로고침 뒤 복원한다", async ({ page }) => {
  await expect(
    page.getByRole("heading", { name: "시드의 비밀 단어를 찾아보세요." }),
  ).toBeVisible();

  await page.getByLabel("어떤 단어가 떠오르나요?").fill("바다가");
  await page.getByRole("button", { name: "추측하기" }).click();

  const resultRow = page.getByRole("row").filter({ hasText: "바다" });
  await expect(resultRow).toBeVisible();
  await expect(resultRow).toContainText(/[\d,]+위/);

  await page.reload();
  await expect(page.getByRole("rowheader", { name: "바다" })).toBeVisible();
});

test("공개 게임 메타와 별칭 API가 정답을 노출하지 않는다", async ({ request }) => {
  const gameResponse = await request.get("/api/game?seed=123456789&v=2");
  expect(gameResponse.ok()).toBe(true);
  expect(gameResponse.headers()["access-control-allow-origin"]).toBe("*");
  const game = (await gameResponse.json()) as Record<string, unknown>;
  expect(game).toMatchObject({ seed: 123456789, version: 2 });
  expect(game.wordCount).toBeGreaterThan(250_000);
  expect(game).not.toHaveProperty("answer");
  expect(game).not.toHaveProperty("puzzleId");
  expect(game).not.toHaveProperty("answerWordId");

  const guessResponse = await request.post("/api/guess", {
    data: { guess: "바다가", seed: 123456789, version: 2 },
  });
  expect(guessResponse.ok()).toBe(true);
  const guess = (await guessResponse.json()) as Record<string, unknown>;
  expect(guess.guess).toBe("바다");
  expect(guess).not.toHaveProperty("answer");

  const preflightResponse = await request.fetch("/api/guess", {
    method: "OPTIONS",
    headers: {
      Origin: "http://127.0.0.1:8081",
      "Access-Control-Request-Method": "POST",
      "Access-Control-Request-Headers": "content-type",
    },
  });
  expect(preflightResponse.ok()).toBe(true);
  expect(preflightResponse.headers()["access-control-allow-methods"]).toContain("POST");
});

test("힌트는 현재 최고 기록보다 높은 순위를 반환한다", async ({ request }) => {
  const game = (await (await request.get("/api/game?seed=123456789&v=2")).json()) as {
    wordCount: number;
  };
  const firstHintResponse = await request.post("/api/hint", {
    data: { bestRank: game.wordCount + 1, seed: 123456789, version: 2 },
  });
  expect(firstHintResponse.ok()).toBe(true);
  const firstHint = (await firstHintResponse.json()) as { guess: string; rank: number };
  expect(firstHint.rank).toBeLessThan(game.wordCount + 1);
  expect(safeAnswerWords.has(firstHint.guess)).toBe(true);

  const nextHintResponse = await request.post("/api/hint", {
    data: { bestRank: firstHint.rank, seed: 123456789, version: 2 },
  });
  expect(nextHintResponse.ok()).toBe(true);
  const nextHint = (await nextHintResponse.json()) as { guess: string; rank: number };
  expect(nextHint.rank).toBeLessThan(firstHint.rank);
  expect(safeAnswerWords.has(nextHint.guess)).toBe(true);
});

test("정답 공개 뒤 전체 순위를 페이지 단위로 반환한다", async ({ request }) => {
  const game = (await (await request.get("/api/game?seed=123456789&v=2")).json()) as {
    wordCount: number;
  };
  const revealResponse = await request.post("/api/reveal", {
    data: { seed: 123456789, version: 2 },
  });
  expect(revealResponse.ok()).toBe(true);
  const reveal = (await revealResponse.json()) as {
    answer: string;
  };
  expect(safeAnswerWords.has(reveal.answer)).toBe(true);

  const firstPageResponse = await request.get(
    "/api/rankings?seed=123456789&v=2&offset=0&limit=3",
  );
  expect(firstPageResponse.ok()).toBe(true);
  const firstPage = (await firstPageResponse.json()) as {
    items: Array<{ word: string; rank: number }>;
    offset: number;
    limit: number;
    total: number;
    nextOffset: number | null;
  };
  expect(firstPage).toMatchObject({
    offset: 0,
    limit: 3,
    nextOffset: 3,
  });
  expect(firstPage.total).toBeLessThan(game.wordCount);
  expect(firstPage.items).toHaveLength(3);
  expect(firstPage.items[0]).toEqual({ word: reveal.answer, rank: 1 });

  const lastPageResponse = await request.get(
    `/api/rankings?seed=123456789&v=2&offset=${firstPage.total - 2}&limit=2`,
  );
  expect(lastPageResponse.ok()).toBe(true);
  const lastPage = (await lastPageResponse.json()) as {
    items: Array<{ word: string; rank: number }>;
    nextOffset: number | null;
  };
  expect(lastPage.nextOffset).toBeNull();

  const sensitiveGuessResponse = await request.post("/api/guess", {
    data: { guess: "자살", seed: 123456789, version: 2 },
  });
  expect(sensitiveGuessResponse.ok()).toBe(true);
  const sensitiveGuess = (await sensitiveGuessResponse.json()) as { rank: number };
  const optInPageResponse = await request.get(
    `/api/rankings?seed=123456789&v=2&offset=${sensitiveGuess.rank - 1}&limit=1&includeSensitive=1`,
  );
  expect(optInPageResponse.ok()).toBe(true);
  const optInPage = (await optInPageResponse.json()) as {
    items: Array<{ word: string; rank: number }>;
    total: number;
  };
  expect(optInPage.total).toBe(game.wordCount);
  expect(optInPage.items).toEqual([{ word: "자살", rank: sensitiveGuess.rank }]);

  const solvedResponse = await request.post("/api/guess", {
    data: { guess: reveal.answer, seed: 123456789, version: 2 },
  });
  expect(solvedResponse.ok()).toBe(true);
  const solved = (await solvedResponse.json()) as {
    solved: boolean;
  };
  expect(solved.solved).toBe(true);
  expect(solved).not.toHaveProperty("rankings");
});

test("같은 시드를 직접 열고 랜덤 새 게임으로 전환한다", async ({ page }) => {
  await expect(page.getByText("시드 #123456789")).toBeVisible();
  await page.reload();
  await expect(page).toHaveURL(/seed=123456789&v=2/);

  await page.getByLabel("게임 시드").fill("777");
  await page.getByRole("button", { name: "시드 열기" }).click();
  await expect(page).toHaveURL(/seed=777&v=2/);
  await expect(page.getByText("시드 #777")).toBeVisible();

  await page.getByRole("button", { name: "랜덤 새 게임" }).click();
  await expect(page).not.toHaveURL(/seed=777&v=2/);
  await expect(page).toHaveURL(/\?seed=\d+&v=2/);
});

test("시드 없는 주소는 랜덤 시드 주소로 이동한다", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveURL(/\?seed=\d+&v=2/);
  await expect(page.getByLabel("게임 시드")).toHaveValue(/\d+/);
});

test("v1 링크를 새 정답에 연결하지 않고 안전한 새 게임을 안내한다", async ({ page }) => {
  await page.goto("/?seed=123456789&v=1");

  await expect(page).toHaveURL(/seed=123456789&v=1/);
  await expect(
    page.getByRole("heading", { name: "이전 게임 버전은 열 수 없어요." }),
  ).toBeVisible();
  await page.getByRole("link", { name: "안전한 새 게임 시작" }).click();
  await expect(page).toHaveURL(/\?seed=\d+&v=2/);
});

test("게임을 포기한 뒤 전체 순위표를 펼친다", async ({ page }) => {
  page.on("dialog", (dialog) => dialog.accept());
  await page.getByRole("button", { name: "포기하고 정답 보기" }).click();
  await page.getByRole("button", { name: "전체 순위 보기" }).click();

  await expect(page.getByRole("heading", { name: "전체 순위" })).toBeVisible();
  await expect(page.getByText(/개 표시 · 실제 의미 순위 유지 · 민감 단어 제외/)).toBeVisible();
  await expect(page.getByRole("cell", { name: "1위", exact: true })).toBeVisible();
  await page.getByRole("button", { name: "민감 단어 포함해서 보기" }).click();
  await expect(page.getByText(/민감 단어 포함/)).toBeVisible();
  await page.getByRole("button", { name: "마지막" }).click();
  await expect(
    page.getByRole("cell", { name: "280,804위", exact: true }),
  ).toBeVisible();
});
