import { Page } from "@playwright/test";
import { LoginPage } from "../pages/LoginPage";

export const DEFAULT_USER = {
  username: "user",
  password: "user1234",
};

/**
 * Performs a full login via the UI and waits for the dashboard URL.
 */
export async function loginAsDefaultUser(page: Page): Promise<void> {
  const loginPage = new LoginPage(page);
  await loginPage.login(DEFAULT_USER.username, DEFAULT_USER.password);
  // Wait for redirect to dashboard
  await page.waitForURL(/\/dashboard/, { timeout: 10000 });
}
