import { test, expect } from "@playwright/test";
import { LoginPage } from "./pages/LoginPage";
import { ThreadDetailPage } from "./pages/ThreadDetailPage";
import { DashboardPage } from "./pages/DashboardPage";
import { loginAsDefaultUser } from "./fixtures/auth";
import { API_BASE } from "./config";

const SEEDED_USERS = {
  user: { username: "user", password: "user1234" },
  moderator: { username: "moderator", password: "moderator1234" },
  admin: { username: "admin", password: "admin1234" },
};

async function loginAs(
  page: import("@playwright/test").Page,
  creds: { username: string; password: string }
) {
  const loginPage = new LoginPage(page);
  await loginPage.login(creds.username, creds.password);
  await page.waitForURL(/\/dashboard/, { timeout: 10000 });
}

async function createThreadViaApi(credentials: {
  username: string;
  password: string;
}): Promise<number> {
  const basicAuth = Buffer.from(
    `${credentials.username}:${credentials.password}`
  ).toString("base64");
  const res = await fetch(`${API_BASE}/api/forum/threads`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Basic ${basicAuth}`,
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

test.describe("Forum link visibility and navigation", () => {
  let threadId: number;

  test.beforeEach(async () => {
    threadId = await createThreadViaApi(SEEDED_USERS.user);
  });

  test("forum link is visible on thread detail page for logged-in user", async ({
    page,
  }) => {
    await loginAs(page, SEEDED_USERS.user);
    const detailPage = new ThreadDetailPage(page);
    await detailPage.goto(threadId);
    await detailPage.waitForLoad();

    const forumLink = page.locator('a[data-testid="forum-link"]');
    await expect(forumLink).toBeVisible({ timeout: 10000 });
  });

  test("forum link text is 'Forum' on thread detail page", async ({ page }) => {
    await loginAs(page, SEEDED_USERS.user);
    const detailPage = new ThreadDetailPage(page);
    await detailPage.goto(threadId);
    await detailPage.waitForLoad();

    const forumLink = page.locator('a[data-testid="forum-link"]');
    await expect(forumLink).toHaveText("Forum", { timeout: 10000 });
  });

  test("forum link is visible for anonymous users on thread detail page", async ({
    page,
  }) => {
    const detailPage = new ThreadDetailPage(page);
    await detailPage.goto(threadId);
    await detailPage.waitForLoad();

    const forumLink = page.locator('a[data-testid="forum-link"]');
    await expect(forumLink).toBeVisible({ timeout: 10000 });
  });

  test("clicking forum link navigates to /forum page", async ({ page }) => {
    await loginAs(page, SEEDED_USERS.user);
    const detailPage = new ThreadDetailPage(page);
    await detailPage.goto(threadId);
    await detailPage.waitForLoad();

    const forumLink = page.locator('a[data-testid="forum-link"]');
    await forumLink.click();

    await expect(page).toHaveURL(/\/forum/, { timeout: 10000 });
  });

  test("forum link has indigo background styling matching dashboard", async ({
    page,
  }) => {
    await loginAs(page, SEEDED_USERS.user);
    const detailPage = new ThreadDetailPage(page);
    await detailPage.goto(threadId);
    await detailPage.waitForLoad();

    const forumLink = page.locator('a[data-testid="forum-link"]');
    const classStr = await forumLink.getAttribute("class");

    expect(classStr).toContain("border-indigo-200");
    expect(classStr).toContain("bg-indigo-50");
    expect(classStr).toContain("text-indigo-700");
  });
});

test.describe("Close Thread button styling", () => {
  let threadId: number;

  test.beforeEach(async () => {
    threadId = await createThreadViaApi(SEEDED_USERS.user);
  });

  test("close thread button is visible only for moderator role", async ({
    page,
  }) => {
    await loginAs(page, SEEDED_USERS.moderator);
    const detailPage = new ThreadDetailPage(page);
    await detailPage.goto(threadId);
    await detailPage.waitForLoad();

    const closeButton = detailPage.getCloseThreadButton();
    await expect(closeButton).toBeVisible({ timeout: 5000 });
  });

  test("close thread button is visible for admin role", async ({ page }) => {
    await loginAs(page, SEEDED_USERS.admin);
    const detailPage = new ThreadDetailPage(page);
    await detailPage.goto(threadId);
    await detailPage.waitForLoad();

    const closeButton = detailPage.getCloseThreadButton();
    await expect(closeButton).toBeVisible({ timeout: 5000 });
  });

  test("close thread button is not visible for regular user role", async ({
    page,
  }) => {
    await loginAs(page, SEEDED_USERS.user);
    const detailPage = new ThreadDetailPage(page);
    await detailPage.goto(threadId);
    await detailPage.waitForLoad();

    const closeButton = detailPage.getCloseThreadButton();
    await expect(closeButton).not.toBeVisible();
  });

  test("close thread button is not visible for anonymous user", async ({
    page,
  }) => {
    const detailPage = new ThreadDetailPage(page);
    await detailPage.goto(threadId);
    await detailPage.waitForLoad();

    const closeButton = detailPage.getCloseThreadButton();
    await expect(closeButton).not.toBeVisible();
  });

  test("close thread button shows 'Close Thread' text for open thread", async ({
    page,
  }) => {
    await loginAs(page, SEEDED_USERS.moderator);
    const detailPage = new ThreadDetailPage(page);
    await detailPage.goto(threadId);
    await detailPage.waitForLoad();

    const closeButton = detailPage.getCloseThreadButton();
    await expect(closeButton).toHaveText("Close Thread");
  });

  test("close thread button shows 'Reopen Thread' text after closing", async ({
    page,
  }) => {
    await loginAs(page, SEEDED_USERS.moderator);
    const detailPage = new ThreadDetailPage(page);
    await detailPage.goto(threadId);
    await detailPage.waitForLoad();

    const closeButton = detailPage.getCloseThreadButton();
    await closeButton.click();

    await expect(closeButton).toHaveText("Reopen Thread", { timeout: 5000 });
  });

  test("close thread button has red danger styling", async ({ page }) => {
    await loginAs(page, SEEDED_USERS.moderator);
    const detailPage = new ThreadDetailPage(page);
    await detailPage.goto(threadId);
    await detailPage.waitForLoad();

    const closeButton = detailPage.getCloseThreadButton();
    const classStr = await closeButton.getAttribute("class");

    expect(classStr).toContain("border-red-200");
    expect(classStr).toContain("text-red-600");
    expect(classStr).toContain("hover:bg-red-50");
  });

  test("close thread button remains visible with correct text after reopening", async ({
    page,
  }) => {
    await loginAs(page, SEEDED_USERS.moderator);
    const detailPage = new ThreadDetailPage(page);
    await detailPage.goto(threadId);
    await detailPage.waitForLoad();

    const closeButton = detailPage.getCloseThreadButton();

    await closeButton.click();
    await expect(closeButton).toHaveText("Reopen Thread", { timeout: 5000 });

    await closeButton.click();
    await expect(closeButton).toHaveText("Close Thread", { timeout: 5000 });
  });

  test("close thread button text is readable after closing and reopening", async ({
    page,
  }) => {
    await loginAs(page, SEEDED_USERS.moderator);
    const detailPage = new ThreadDetailPage(page);
    await detailPage.goto(threadId);
    await detailPage.waitForLoad();

    const closeButton = detailPage.getCloseThreadButton();

    await closeButton.click();
    await expect(closeButton).toHaveText("Reopen Thread", { timeout: 5000 });

    await closeButton.click();
    await expect(closeButton).toHaveText("Close Thread", { timeout: 5000 });
  });
});

test.describe("Thread detail page integration", () => {
  let threadId: number;

  test.beforeEach(async () => {
    threadId = await createThreadViaApi(SEEDED_USERS.user);
  });

  test("thread detail page loads and displays content correctly", async ({
    page,
  }) => {
    const detailPage = new ThreadDetailPage(page);
    await detailPage.goto(threadId);
    await detailPage.waitForLoad();

    const title = detailPage.getTitle();
    const description = detailPage.getDescription();
    const author = detailPage.getAuthor();

    await expect(title).toBeVisible();
    await expect(description).toBeVisible();
    await expect(author).toBeVisible();
  });

  test("navigation bar shows forum link and profile link when logged in", async ({
    page,
  }) => {
    await loginAs(page, SEEDED_USERS.user);
    const detailPage = new ThreadDetailPage(page);
    await detailPage.goto(threadId);
    await detailPage.waitForLoad();

    const forumLink = page.locator('a[data-testid="forum-link"]');
    const profileLink = page.locator('a[data-testid="profile-link"]');

    await expect(forumLink).toBeVisible({ timeout: 10000 });
    await expect(profileLink).toBeVisible({ timeout: 10000 });
  });

  test("forum link and profile link are both accessible on thread detail", async ({
    page,
  }) => {
    await loginAs(page, SEEDED_USERS.user);
    const detailPage = new ThreadDetailPage(page);
    await detailPage.goto(threadId);
    await detailPage.waitForLoad();

    const forumLink = page.locator('a[data-testid="forum-link"]');
    const profileLink = page.locator('a[data-testid="profile-link"]');

    await expect(forumLink).toBeEnabled();
    await expect(profileLink).toBeEnabled();
  });

  test("forum link matches indigo styling on both dashboard and thread detail", async ({
    page,
  }) => {
    await loginAsDefaultUser(page);
    const dashboardPage = new DashboardPage(page);
    await dashboardPage.waitForLoad();

    const dashboardForumLink = page.locator('a[data-testid="forum-link"]');
    const dashboardClass = await dashboardForumLink.getAttribute("class");

    await dashboardForumLink.click();

    const newThreadId = await createThreadViaApi(SEEDED_USERS.user);
    const detailPage = new ThreadDetailPage(page);
    await page.goto(`/forum/threads/${newThreadId}`);
    await detailPage.waitForLoad();

    const detailForumLink = page.locator('a[data-testid="forum-link"]');
    const detailClass = await detailForumLink.getAttribute("class");

    expect(dashboardClass).toBe(detailClass);
  });
});
