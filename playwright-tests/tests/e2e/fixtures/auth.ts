import { Page } from "@playwright/test";
import { LoginPage } from "../pages/LoginPage";
import { API_BASE } from "../config";

export const DEFAULT_USER = {
  username: "user",
  password: "user1234",
};

/**
 * Sets up authentication by obtaining tokens via API using Basic Auth,
 * then stores them in localStorage and sessionStorage.
 * This avoids repetitive UI login flows while still testing the actual feature.
 */
export async function setupAuthViaAPI(page: Page, credentials: { username: string; password: string }): Promise<void> {
  const basicAuth = Buffer.from(`${credentials.username}:${credentials.password}`).toString("base64");

  const response = await fetch(`${API_BASE}/api/auth`, {
    method: "POST",
    headers: {
      "Authorization": `Basic ${basicAuth}`,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(`Auth setup failed: ${response.status}`);
  }

  const data = await response.json() as { token?: string };
  const token = data.token;

  if (!token) {
    throw new Error("No token returned from auth API");
  }

  await page.evaluate((t) => {
    localStorage.setItem("authToken", t);
    sessionStorage.setItem("authToken", t);
  }, token);
}

/**
 * Performs a full login via the UI and waits for the dashboard URL.
 * Delegates to LoginPage, which uses data-testid as the primary locator
 * strategy with semantic fallbacks for all form fields.
 *
 * Used for testing the actual login flow; for other tests, use setupAuthViaAPI.
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
