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
