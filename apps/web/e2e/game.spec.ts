import { expect, test } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.goto("/");
  await page.evaluate(() => localStorage.clear());
  await page.reload();
});

test("조사가 붙은 추측을 판정하고 새로고침 뒤 복원한다", async ({ page }) => {
  await expect(
    page.getByRole("heading", { name: "오늘의 비밀 단어를 찾아보세요." }),
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
  const gameResponse = await request.get("/api/game");
  expect(gameResponse.ok()).toBe(true);
  const game = (await gameResponse.json()) as Record<string, unknown>;
  expect(game).toHaveProperty("gameNumber");
  expect(game).toHaveProperty("wordCount", 4851);
  expect(game).not.toHaveProperty("answer");
  expect(game).not.toHaveProperty("puzzleId");

  const guessResponse = await request.post("/api/guess", {
    data: { guess: "바다가" },
  });
  expect(guessResponse.ok()).toBe(true);
  const guess = (await guessResponse.json()) as Record<string, unknown>;
  expect(guess.guess).toBe("바다");
  expect(guess).not.toHaveProperty("answer");
});

test("힌트는 현재 최고 기록보다 높은 순위를 반환한다", async ({ request }) => {
  const firstHintResponse = await request.post("/api/hint", {
    data: { bestRank: 4852 },
  });
  expect(firstHintResponse.ok()).toBe(true);
  const firstHint = (await firstHintResponse.json()) as { rank: number };
  expect(firstHint.rank).toBeLessThan(4852);

  const nextHintResponse = await request.post("/api/hint", {
    data: { bestRank: firstHint.rank },
  });
  expect(nextHintResponse.ok()).toBe(true);
  const nextHint = (await nextHintResponse.json()) as { rank: number };
  expect(nextHint.rank).toBeLessThan(firstHint.rank);
});

test("정답 공개와 정답 추측 뒤 전체 순위를 반환한다", async ({ request }) => {
  const revealResponse = await request.post("/api/reveal");
  expect(revealResponse.ok()).toBe(true);
  const reveal = (await revealResponse.json()) as {
    answer: string;
    rankings: Array<{ word: string; rank: number }>;
  };
  expect(reveal.rankings).toHaveLength(4851);
  expect(reveal.rankings[0]).toEqual({ word: reveal.answer, rank: 1 });
  expect(reveal.rankings.at(-1)?.rank).toBe(4851);

  const solvedResponse = await request.post("/api/guess", {
    data: { guess: reveal.answer },
  });
  expect(solvedResponse.ok()).toBe(true);
  const solved = (await solvedResponse.json()) as {
    solved: boolean;
    rankings: Array<{ word: string; rank: number }>;
  };
  expect(solved.solved).toBe(true);
  expect(solved.rankings).toEqual(reveal.rankings);
});

test("게임을 포기한 뒤 전체 순위표를 펼친다", async ({ page }) => {
  page.on("dialog", (dialog) => dialog.accept());
  await page.getByRole("button", { name: "포기하고 정답 보기" }).click();
  await page.getByRole("button", { name: "전체 순위 보기" }).click();

  await expect(page.getByRole("heading", { name: "전체 순위" })).toBeVisible();
  await expect(page.getByText("4,851개 단어 · 1위부터 정렬")).toBeVisible();
  await expect(page.getByRole("cell", { name: "1위", exact: true })).toBeVisible();
});
