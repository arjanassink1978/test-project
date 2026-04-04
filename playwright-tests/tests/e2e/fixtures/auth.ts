import { Page } from "@playwright/test";
import { LoginPage } from "../pages/LoginPage";
import { API_BASE } from "../config";

export const DEFAULT_USER = {
  username: "user",
  password: "user1234",
};

/**
 * Sets up authentication by calling /api/auth/login with JSON credentials.
 * Stores both 'authToken' and 'username' in localStorage for frontend access.
 *
 * Navigates to "/" first to ensure the page context allows localStorage access
 * (page.evaluate() fails on about:blank with a SecurityError).
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

  const data = await response.json() as { token?: string; username?: string; role?: string };
  const token = data.token;

  if (!token) {
    throw new Error("No token returned from auth API");
  }

  // Navigate to the frontend root so localStorage is accessible (about:blank blocks it).
  await page.goto("/");

  await page.evaluate(({ t, u, r }) => {
    localStorage.setItem("authToken", t);
    if (u) localStorage.setItem("username", u);
    if (r) localStorage.setItem("role", r);
  }, { t: token, u: data.username ?? credentials.username, r: data.role ?? "" });
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
  await page.waitForURL(/\/dashboard/, { timeout: 10000 });
}

/**
 * Sets up auth for the default user via API.
 * Call this in beforeEach for tests that need a logged-in state.
 */
export async function setupDefaultUserAuth(page: Page): Promise<void> {
  await setupAuthViaAPI(page, DEFAULT_USER);
}
