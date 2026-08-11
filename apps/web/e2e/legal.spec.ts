import { expect, test } from "@playwright/test";

test("개인정보처리방침이 실제 데이터 흐름과 문의 경로를 공개한다", async ({ page }) => {
  await page.goto("/privacy");

  await expect(page.getByRole("heading", { name: "개인정보처리방침" })).toBeVisible();
  await expect(page.getByText("회원가입이나 로그인을 요구하지 않으며")).toBeVisible();
  await expect(page.getByText("이용자가 입력한 추측어")).toBeVisible();
  await expect(page.getByRole("link", { name: "Hugging Face 개인정보처리방침" })).toHaveAttribute(
    "href",
    "https://huggingface.co/privacy",
  );
  await expect(page.getByRole("link", { name: "GitHub Issues" })).toHaveAttribute(
    "href",
    "https://github.com/byStander9/kor-hot-and-cold/issues/new",
  );
});

test("데이터·오픈소스 페이지가 주요 출처와 라이선스를 공개한다", async ({ page }) => {
  await page.goto("/licenses");

  await expect(page.getByRole("heading", { name: "데이터·오픈소스 출처" })).toBeVisible();
  await expect(page.getByRole("link", { name: "표준국어대사전 Hugging Face 변환본" })).toBeVisible();
  await expect(page.getByRole("link", { name: "intfloat/multilingual-e5-small" })).toBeVisible();
  await expect(page.getByText("CC BY-SA 3.0", { exact: false })).toBeVisible();
  await expect(page.getByText("LGPL-3.0", { exact: false })).toBeVisible();
});
