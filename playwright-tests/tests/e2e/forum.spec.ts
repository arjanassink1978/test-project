import { test, expect } from "@playwright/test";
import { ForumPage } from "./pages/ForumPage";
import { ThreadDetailPage } from "./pages/ThreadDetailPage";
import { loginAsDefaultUser, DEFAULT_USER } from "./fixtures/auth";

// -------------------------------------------------------------------------
// Forum Index Page — public view (no login needed)
// -------------------------------------------------------------------------

test.describe("Forum index page (public)", () => {
  test("shows forum heading and category filter", async ({ page }) => {
    const forumPage = new ForumPage(page);
    await forumPage.goto();
    await forumPage.waitForLoad();

    await expect(forumPage.getHeading()).toBeVisible();
    await expect(forumPage.getCategoryFilter()).toBeVisible();
  });

  test("sort select is visible", async ({ page }) => {
    const forumPage = new ForumPage(page);
    await forumPage.goto();
    await forumPage.waitForLoad();

    await expect(forumPage.getSortSelect()).toBeVisible();
  });

  test("search input is visible", async ({ page }) => {
    const forumPage = new ForumPage(page);
    await forumPage.goto();
    await forumPage.waitForLoad();

    await expect(forumPage.getSearchInput()).toBeVisible();
  });

  test("category filter shows all option", async ({ page }) => {
    const forumPage = new ForumPage(page);
    await forumPage.goto();
    await forumPage.waitForLoad();

    await expect(forumPage.getCategoryOption("all")).toBeVisible();
  });
});

// -------------------------------------------------------------------------
// Forum Index — authenticated view
// -------------------------------------------------------------------------

test.describe("Forum index page (authenticated)", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsDefaultUser(page);
  });

  test("shows new thread button when logged in", async ({ page }) => {
    await page.goto("/forum");
    const forumPage = new ForumPage(page);
    await forumPage.waitForLoad();

    await expect(forumPage.getNewThreadButton()).toBeVisible();
  });

  test("forum link is in dashboard nav", async ({ page }) => {
    // Already on dashboard after login
    await expect(
      page.getByTestId("forum-link").or(page.locator('a[href="/forum"]')).first()
    ).toBeVisible();
  });
});

// -------------------------------------------------------------------------
// Thread detail page
// -------------------------------------------------------------------------

test.describe("Thread detail page", () => {
  let threadId: number;

  test.beforeEach(async ({ page }) => {
    // Create a thread via UI before viewing its detail page
    await loginAsDefaultUser(page);
    await page.goto("/forum/new");
    await page
      .getByTestId("new-thread-heading")
      .or(page.locator("h1"))
      .waitFor({ state: "visible", timeout: 5000 });

    const title = `Detail Test Thread ${Date.now()}`;
    await page.getByTestId("thread-title-input").fill(title);
    await page
      .getByTestId("thread-desc-input")
      .fill("This is the thread description for Playwright tests.");

    await page.getByTestId("thread-submit-button").click();

    // Extract thread ID from redirect URL
    await page.waitForURL(/\/forum\/threads\/\d+/, { timeout: 10000 });
    const url = page.url();
    const match = url.match(/\/forum\/threads\/(\d+)/);
    if (!match) throw new Error("Could not extract thread ID from URL");
    threadId = Number(match[1]);
  });

  test("shows thread title, description, author, and score", async ({ page }) => {
    const detailPage = new ThreadDetailPage(page);
    await detailPage.goto(threadId);
    await detailPage.waitForLoad();

    await expect(detailPage.getTitle()).toContainText("Detail Test Thread");
    await expect(detailPage.getDescription()).toContainText(
      "This is the thread description"
    );
    await expect(detailPage.getAuthor()).toContainText(DEFAULT_USER.username);
    await expect(detailPage.getScore()).toBeVisible();
  });

  test("vote buttons are visible", async ({ page }) => {
    const detailPage = new ThreadDetailPage(page);
    await detailPage.goto(threadId);
    await detailPage.waitForLoad();

    await expect(detailPage.getUpvoteButton()).toBeVisible();
    await expect(detailPage.getDownvoteButton()).toBeVisible();
    await expect(detailPage.getVoteScore()).toBeVisible();
  });
});

// -------------------------------------------------------------------------
// Thread creation flow (authenticated)
// -------------------------------------------------------------------------

test.describe("Create new thread flow", () => {
  let createdThreadId: number | null = null;

  test.beforeEach(async ({ page }) => {
    await loginAsDefaultUser(page);
  });

  test("navigates to new thread form from forum page", async ({ page }) => {
    await page.goto("/forum");
    const forumPage = new ForumPage(page);
    await forumPage.waitForLoad();

    await forumPage.getNewThreadButton().click();
    await page.waitForURL(/\/forum\/new/, { timeout: 5000 });

    await expect(
      page.getByTestId("new-thread-heading").or(page.locator("h1"))
    ).toBeVisible();
  });

  test("creates a thread via form and redirects to detail page", async ({ page }) => {
    await page.goto("/forum/new");
    await page
      .getByTestId("new-thread-heading")
      .or(page.locator("h1"))
      .waitFor({ state: "visible", timeout: 5000 });

    const title = `Playwright E2E Thread ${Date.now()}`;
    await page.getByTestId("thread-title-input").fill(title);
    await page.getByTestId("thread-desc-input").fill("Created by Playwright E2E test");

    await page.getByTestId("thread-submit-button").click();

    // Should redirect to thread detail page
    await page.waitForURL(/\/forum\/threads\/\d+/, { timeout: 10000 });

    const detailPage = new ThreadDetailPage(page);
    await expect(detailPage.getTitle()).toHaveText(title);

    // Extract thread ID from URL for cleanup
    const url = page.url();
    const match = url.match(/\/forum\/threads\/(\d+)/);
    if (match) createdThreadId = Number(match[1]);
  });

  test("title character counter updates as user types", async ({ page }) => {
    await page.goto("/forum/new");
    await page
      .getByTestId("new-thread-heading")
      .or(page.locator("h1"))
      .waitFor({ state: "visible", timeout: 5000 });

    const input = page.getByTestId("thread-title-input");
    await input.fill("Hello");

    await expect(page.getByTestId("thread-title-counter")).toContainText("5");
  });

  test("submit button is disabled when title is empty", async ({ page }) => {
    await page.goto("/forum/new");
    await page
      .getByTestId("new-thread-heading")
      .or(page.locator("h1"))
      .waitFor({ state: "visible", timeout: 5000 });

    await expect(page.getByTestId("thread-submit-button")).toBeDisabled();
  });
});

// -------------------------------------------------------------------------
// Reply flow (authenticated)
// -------------------------------------------------------------------------

test.describe("Reply flow", () => {
  let threadId: number;

  test.beforeEach(async ({ page }) => {
    // Create a thread via UI
    await loginAsDefaultUser(page);
    await page.goto("/forum/new");
    await page
      .getByTestId("new-thread-heading")
      .or(page.locator("h1"))
      .waitFor({ state: "visible", timeout: 5000 });

    const title = `Reply Test Thread ${Date.now()}`;
    await page.getByTestId("thread-title-input").fill(title);
    await page
      .getByTestId("thread-desc-input")
      .fill("Thread for reply testing");

    await page.getByTestId("thread-submit-button").click();

    // Extract thread ID from redirect URL
    await page.waitForURL(/\/forum\/threads\/\d+/, { timeout: 10000 });
    const url = page.url();
    const match = url.match(/\/forum\/threads\/(\d+)/);
    if (!match) throw new Error("Could not extract thread ID from URL");
    threadId = Number(match[1]);
  });

  test("shows reply form when logged in", async ({ page }) => {
    const detailPage = new ThreadDetailPage(page);
    await detailPage.goto(threadId);
    await detailPage.waitForLoad();

    await expect(detailPage.getReplyForm()).toBeVisible();
    await expect(detailPage.getReplyContentInput()).toBeVisible();
    await expect(detailPage.getReplySubmitButton()).toBeVisible();
  });

  test("creates a reply and it appears in the replies section", async ({ page }) => {
    const detailPage = new ThreadDetailPage(page);
    await detailPage.goto(threadId);
    await detailPage.waitForLoad();

    const replyContent = `E2E reply at ${Date.now()}`;
    await detailPage.getReplyContentInput().fill(replyContent);
    await detailPage.getReplySubmitButton().click();

    // Reply should appear after page refreshes replies
    await expect(
      page.locator(`text=${replyContent}`)
    ).toBeVisible({ timeout: 10000 });
  });
});

// -------------------------------------------------------------------------
// Search flow
// -------------------------------------------------------------------------

test.describe("Forum search", () => {
  test("filters threads by search keyword", async ({ page }) => {
    const uniqueKeyword = `UniqueKeyword${Date.now()}`;

    // Create a thread via UI with unique keyword
    await loginAsDefaultUser(page);
    await page.goto("/forum/new");
    await page
      .getByTestId("new-thread-heading")
      .or(page.locator("h1"))
      .waitFor({ state: "visible", timeout: 5000 });

    await page
      .getByTestId("thread-title-input")
      .fill(`Thread with ${uniqueKeyword}`);
    await page
      .getByTestId("thread-desc-input")
      .fill("Searchable description");

    await page.getByTestId("thread-submit-button").click();

    // Navigate to forum index and search
    await page.goto("/forum");
    const forumPage = new ForumPage(page);
    await forumPage.waitForLoad();

    await forumPage.getSearchInput().fill(uniqueKeyword);

    // Wait for debounced search — thread with keyword should appear
    await expect(
      page.locator(`text=${uniqueKeyword}`)
    ).toBeVisible({ timeout: 10000 });
  });
});
