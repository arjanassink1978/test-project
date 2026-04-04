import { test, expect } from "@playwright/test";
import { ThreadDetailPage } from "./pages/ThreadDetailPage";
import { LoginPage } from "./pages/LoginPage";
import { API_BASE } from "./config";

const MODERATOR = { username: "moderator", password: "moderator1234" };
const USER = { username: "user", password: "user1234" };

async function loginAs(page: import("@playwright/test").Page, creds: { username: string; password: string }) {
  const loginPage = new LoginPage(page);
  await loginPage.login(creds.username, creds.password);
  await page.waitForURL(/\/dashboard/, { timeout: 10000 });
}

async function fetchBearerToken(credentials: { username: string; password: string }): Promise<string> {
  const res = await fetch(`${API_BASE}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username: credentials.username, password: credentials.password }),
  });
  if (!res.ok) throw new Error(`Failed to authenticate: ${res.status}`);
  const data = await res.json() as { token?: string };
  if (!data.token) throw new Error("No token returned from auth API");
  return data.token;
}

async function createThreadViaApi(credentials: { username: string; password: string }): Promise<number> {
  const token = await fetchBearerToken(credentials);
  const res = await fetch(`${API_BASE}/api/forum/threads`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`,
    },
    body: JSON.stringify({
      title: `RBAC E2E Test Thread ${Date.now()}`,
      description: "Thread for RBAC E2E testing",
    }),
  });
  if (!res.ok) throw new Error(`Failed to create thread: ${res.status}`);
  const data = await res.json() as { id: number };
  return data.id;
}

async function createReplyViaApi(
  threadId: number,
  credentials: { username: string; password: string }
): Promise<number> {
  const token = await fetchBearerToken(credentials);
  const res = await fetch(`${API_BASE}/api/forum/threads/${threadId}/replies`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`,
    },
    body: JSON.stringify({ content: "E2E test reply content" }),
  });
  if (!res.ok) throw new Error(`Failed to create reply: ${res.status}`);
  const data = await res.json() as { id: number };
  return data.id;
}

test.describe("RBAC — Moderator can close threads", () => {
  let threadId: number;

  test.beforeEach(async () => {
    threadId = await createThreadViaApi(USER);
  });

  test("moderator sees Close Thread button on thread detail", async ({ page }) => {
    await loginAs(page, MODERATOR);
    const detailPage = new ThreadDetailPage(page);
    await detailPage.goto(threadId);
    await detailPage.waitForLoad();

    await expect(detailPage.getCloseThreadButton()).toBeVisible();
  });

  test("regular user does not see Close Thread button", async ({ page }) => {
    await loginAs(page, USER);
    const detailPage = new ThreadDetailPage(page);
    await detailPage.goto(threadId);
    await detailPage.waitForLoad();

    await expect(detailPage.getCloseThreadButton()).not.toBeVisible();
  });

  test("moderator closes thread — CLOSED badge appears and reply form disappears", async ({ page }) => {
    await loginAs(page, MODERATOR);
    const detailPage = new ThreadDetailPage(page);
    await detailPage.goto(threadId);
    await detailPage.waitForLoad();

    await detailPage.getCloseThreadButton().click();

    await expect(detailPage.getClosedBadge()).toBeVisible();
    await expect(detailPage.getThreadClosedMessage()).toBeVisible();
    await expect(detailPage.getReplyForm()).not.toBeVisible();
  });
});

test.describe("RBAC — Moderator can delete replies", () => {
  let threadId: number;
  let replyId: number;

  test.beforeEach(async () => {
    threadId = await createThreadViaApi(USER);
    replyId = await createReplyViaApi(threadId, USER);
  });

  test("moderator sees delete button on replies", async ({ page }) => {
    await loginAs(page, MODERATOR);
    const detailPage = new ThreadDetailPage(page);
    await detailPage.goto(threadId);
    await detailPage.waitForLoad();

    await expect(detailPage.getDeleteReplyButton(replyId)).toBeVisible();
  });

  test("regular user does not see delete button on replies", async ({ page }) => {
    await loginAs(page, USER);
    const detailPage = new ThreadDetailPage(page);
    await detailPage.goto(threadId);
    await detailPage.waitForLoad();

    await expect(detailPage.getDeleteReplyButton(replyId)).not.toBeVisible();
  });
});

test.describe("RBAC — Closed thread shows error for reply attempt", () => {
  let threadId: number;

  test.beforeEach(async () => {
    threadId = await createThreadViaApi(USER);
    const token = await fetchBearerToken(MODERATOR);
    await fetch(`${API_BASE}/api/forum/threads/${threadId}/close?closed=true`, {
      method: "POST",
      headers: { "Authorization": `Bearer ${token}` },
    });
  });

  test("closed thread shows CLOSED badge", async ({ page }) => {
    await loginAs(page, USER);
    const detailPage = new ThreadDetailPage(page);
    await detailPage.goto(threadId);
    await detailPage.waitForLoad();

    await expect(detailPage.getClosedBadge()).toBeVisible();
  });

  test("closed thread shows closed message and no reply form for logged-in user", async ({ page }) => {
    await loginAs(page, USER);
    const detailPage = new ThreadDetailPage(page);
    await detailPage.goto(threadId);
    await detailPage.waitForLoad();

    await expect(detailPage.getThreadClosedMessage()).toBeVisible();
    await expect(detailPage.getReplyForm()).not.toBeVisible();
  });
});
