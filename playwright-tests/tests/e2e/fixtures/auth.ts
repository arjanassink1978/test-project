import { Page } from "@playwright/test";
import { LoginPage } from "../pages/LoginPage";

export const DEFAULT_USER = {
  username: "user",
  password: "user1234",
};

export const MODERATOR_USER = {
  username: "moderator",
  password: "moderator1234",
};

export const ADMIN_USER = {
  username: "admin",
  password: "admin1234",
};

/**
 * Performs a full login via the UI as a regular user and waits for the dashboard URL.
 * Delegates to LoginPage, which uses data-testid as the primary locator
 * strategy with semantic fallbacks for all form fields.
 *
 * Call this in beforeEach for tests that need a logged-in state as a regular user.
 */
export async function loginAsDefaultUser(page: Page): Promise<void> {
  const loginPage = new LoginPage(page);
  await loginPage.login(DEFAULT_USER.username, DEFAULT_USER.password);
  await page.waitForURL(/\/dashboard/, { timeout: 10000 });
}

/**
 * Performs a full login via the UI as a moderator and waits for the dashboard URL.
 * Moderators can close threads and delete replies.
 *
 * Call this in tests that need moderator permissions.
 */
export async function loginAsModerator(page: Page): Promise<void> {
  const loginPage = new LoginPage(page);
  await loginPage.login(MODERATOR_USER.username, MODERATOR_USER.password);
  await page.waitForURL(/\/dashboard/, { timeout: 10000 });
}

/**
 * Performs a full login via the UI as an admin and waits for the dashboard URL.
 * Admins have access to the /admin panel for user and category management.
 *
 * Call this in tests that need admin permissions.
 */
export async function loginAsAdmin(page: Page): Promise<void> {
  const loginPage = new LoginPage(page);
  await loginPage.login(ADMIN_USER.username, ADMIN_USER.password);
  await page.waitForURL(/\/dashboard/, { timeout: 10000 });
}
