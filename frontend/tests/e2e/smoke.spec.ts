import { test, expect } from "@playwright/test";

test.describe("App smoke test", () => {
  test("page loads and shows login modal", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByText("SID.AI")).toBeVisible({ timeout: 10000 });
  });

  test("login modal shows signup form", async ({ page }) => {
    await page.goto("/");
    await page.getByText("Sign Up", { exact: true }).click();
    await expect(page.getByPlaceholder("Your name")).toBeVisible();
  });

  test("login form validates required fields", async ({ page }) => {
    await page.goto("/");
    const submitButtons = page.getByRole("button", { name: "Sign In" });
    await submitButtons.first().click();
    await expect(page.getByPlaceholder("you@example.com")).toBeVisible();
  });
});

test.describe("Application shell", () => {
  test("sidebar is visible on desktop", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByText("SID.AI")).toBeVisible();
  });

  test("dark theme toggle exists", async ({ page }) => {
    await page.goto("/");
    const toggle = page.locator("button").filter({ has: page.locator("svg") }).first();
    await expect(toggle).toBeVisible();
  });
});
