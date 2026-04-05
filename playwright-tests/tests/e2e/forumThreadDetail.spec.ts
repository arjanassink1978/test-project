import { test, expect } from "@playwright/test";
import { ThreadDetailPage } from "./pages/ThreadDetailPage";
import { API_BASE } from "./config";
import { loginAsDefaultUser, loginAsModerator, loginAsAdmin, DEFAULT_USER } from "./fixtures/auth";

async function fetchBearerToken(credentials: {
  username: string;
  password: string;
}): Promise<string> {
  const res = await fetch(`${API_BASE}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username: credentials.username, password: credentials.password }),
  });
  if (!res.ok) throw new Error(`Failed to authenticate: ${res.status}`);
  const data = (await res.json()) as { token?: string };
  if (!data.token) throw new Error("No token returned from auth API");
  return data.token;
}

async function createThreadViaApi(credentials: {
  username: string;
  password: string;
}): Promise<number> {
  const token = await fetchBearerToken(credentials);
  const res = await fetch(`${API_BASE}/api/forum/threads`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      title: `Thread Detail E2E Test ${Date.now()}`,
      description: "Thread for E2E testing forum UI fixes",
    }),
  });
  if (!res.ok) throw new Error(`Failed to create thread: ${res.status}`);
  const data = (await res.json()) as { id: number };
  return data.id;
}

// -------------------------------------------------------------------------
// Forum link navigation — unique journey test (logged-in user clicks forum link)
// -------------------------------------------------------------------------

test.describe("Forum link navigation from thread detail", () => {
  let threadId: number;

  test.beforeEach(async () => {
    threadId = await createThreadViaApi(DEFAULT_USER);
  });

  test("clicking forum link on thread detail navigates to /forum", async ({ page }) => {
    await loginAsDefaultUser(page);
    const detailPage = new ThreadDetailPage(page);
    await detailPage.goto(threadId);
    await detailPage.waitForLoad();

    const forumLink = page.locator('a[data-testid="forum-link"]');
    await expect(forumLink).toBeVisible({ timeout: 10000 });
    await forumLink.click();

    await expect(page).toHaveURL(/\/forum/, { timeout: 10000 });
  });
});

// -------------------------------------------------------------------------
// Close/Reopen thread flow — user journey with state change
// (role-based visibility is covered in rbac.spec.ts)
// -------------------------------------------------------------------------

test.describe("Close and reopen thread journey", () => {
  let threadId: number;

  test.beforeEach(async () => {
    threadId = await createThreadViaApi(DEFAULT_USER);
  });

  test("moderator closes thread — button updates to 'Reopen Thread', then reopens", async ({ page }) => {
    await loginAsModerator(page);
    const detailPage = new ThreadDetailPage(page);
    await detailPage.goto(threadId);
    await detailPage.waitForLoad();

    const closeButton = detailPage.getCloseThreadButton();
    await expect(closeButton).toHaveText("Close Thread");

    await closeButton.click();
    await expect(closeButton).toHaveText("Reopen Thread", { timeout: 5000 });

    await closeButton.click();
    await expect(closeButton).toHaveText("Close Thread", { timeout: 5000 });
  });
});
