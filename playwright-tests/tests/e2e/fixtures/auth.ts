import { Page } from "@playwright/test";
import { LoginPage } from "../pages/LoginPage";

export const DEFAULT_USER = {
  username: "user",
  password: "user1234",
};

/**
 * Performs a full login via the UI and waits for the dashboard URL.
 * Delegates to LoginPage, which uses data-testid as the primary locator
 * strategy with semantic fallbacks for all form fields.
 *
 * Call this in beforeEach for tests that need a logged-in state.
 */
export async function loginAsDefaultUser(page: Page): Promise<void> {
  const loginPage = new LoginPage(page);
  await loginPage.login(DEFAULT_USER.username, DEFAULT_USER.password);
  await page.waitForURL(/\/dashboard/, { timeout: 10000 });
}
