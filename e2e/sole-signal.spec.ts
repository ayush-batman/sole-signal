import { expect, test } from "@playwright/test";
import path from "node:path";

test("onboarding presents the business constraints", async ({ page }) => {
  await page.goto("/onboarding");
  await expect(
    page.getByRole("heading", { name: "Set up your decision profile" }),
  ).toBeVisible();
  await expect(page.getByLabel("Business type")).toBeVisible();
  await expect(page.getByLabel("Desired gross margin (%)")).toHaveValue("55");
  await expect(page.getByLabel("Lead time (days)")).toHaveValue("45");
});

test("CSV upload validates valid and invalid files before sign-in", async ({
  page,
}) => {
  await page.goto("/catalog");
  const input = page.locator('input[type="file"]');
  await input.setInputFiles(
    path.join(process.cwd(), "e2e/fixtures/valid-observations.csv"),
  );
  await expect(page.getByText("1", { exact: true }).first()).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Sign in with GitHub to import" }),
  ).toBeEnabled();

  await input.setInputFiles(
    path.join(process.cwd(), "e2e/fixtures/invalid-observations.csv"),
  );
  await expect(page.getByText("Missing required column: url")).toBeVisible();
  await expect(page.getByText(/Row 2 · title/)).toBeVisible();
});

test("trend exploration reaches decomposed evidence", async ({ page }) => {
  await page.goto("/trends");
  await page
    .getByRole("link", {
      name: /Low-profile retro suede sneakers with gum sole/,
    })
    .click();
  await expect(
    page.getByRole("heading", {
      name: "Low-profile retro suede sneakers with gum sole",
    }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Score decomposition" }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Evidence ledger" }),
  ).toBeVisible();
  await expect(page.getByText("Model trend-v1")).toBeVisible();
});

test("mobile navigation opens and closes without exposing hidden links", async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name !== "mobile", "Mobile-only navigation check");
  await page.goto("/dashboard");
  await expect(page.getByRole("navigation")).toBeHidden();
  await page.getByRole("button", { name: "Open navigation" }).click();
  await expect(page.getByRole("navigation")).toBeVisible();
  await page.getByRole("link", { name: "Sources" }).click();
  await expect(page.getByRole("heading", { name: "Sources" })).toBeVisible();
});
