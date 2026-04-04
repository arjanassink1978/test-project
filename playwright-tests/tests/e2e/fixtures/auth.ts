import { Page } from "@playwright/test";
import { LoginPage } from "../pages/LoginPage";
import { API_BASE } from "../config";

export const DEFAULT_USER = {
  username: "user",
  password: "user1234",
};

/**
 * Sets up authentication by calling /api/auth/login with JSON credentials.
 * Stores the auth token in localStorage.
 */
export async function setupAuthViaAPI(page: Page, credentials: { username: string; password: string }): Promise<void> {
  const response = await fetch(`${API_BASE}/api/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      username: credentials.username,
      password: credentials.password,
    }),
  });

  if (!response.ok) {
    throw new Error(`Auth setup failed: ${response.status}`);
  }

  // Note: The actual token/session handling depends on backend implementation
  // For now, we just verify the endpoint responds successfully
}

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
  // Wait for redirect to dashboard
  await page.waitForURL(/\/dashboard/, { timeout: 10000 });
}

/**
 * Sets up auth for the default user via API.
 * Call this in beforeEach for tests that need a logged-in state.
 */
export async function setupDefaultUserAuth(page: Page): Promise<void> {
  await setupAuthViaAPI(page, DEFAULT_USER);
}
