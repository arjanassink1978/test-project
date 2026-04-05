import { test, expect } from "@playwright/test";
import { ForumPage } from "./pages/ForumPage";
import { ThreadDetailPage } from "./pages/ThreadDetailPage";
import { NewThreadPage } from "./pages/NewThreadPage";
import { setupDefaultUserAuth, setupModeratorAuth } from "./fixtures/auth";
import { createThreadViaApi, createReplyViaApi, deleteThreadViaApi } from "./fixtures/api";
import { SEEDED_CATEGORIES } from "./config";

test.describe("Forum", () => {
  test("forum index page loads and displays categories", async ({ page }) => {
    const forum = new ForumPage(page);
    await forum.goto();

    await expect(page.getByTestId("forum-heading")).toBeVisible();
    await expect(page.getByTestId("thread-list")).toBeVisible();
  });

  test("forum index shows new thread button only when logged in", async ({ page }) => {
    const forum = new ForumPage(page);
    await forum.goto();

    const hasButton = await forum.isNewThreadButtonVisible();
    expect(hasButton).toBe(false);
  });

  test("logged-in user sees new thread button on forum", async ({ page }) => {
    await setupDefaultUserAuth(page);

    const forum = new ForumPage(page);
    await forum.goto();

    const hasButton = await forum.isNewThreadButtonVisible();
    expect(hasButton).toBe(true);
  });

  test("clicking new thread button navigates to creation page", async ({ page }) => {
    await setupDefaultUserAuth(page);

    const forum = new ForumPage(page);
    await forum.goto();
    await forum.clickNewThread();

    await expect(page).toHaveURL("/forum/new");
  });

  test("create thread with valid data succeeds", async ({ page }) => {
    await setupDefaultUserAuth(page);

    const newThreadPage = new NewThreadPage(page);
    await newThreadPage.goto();

    const title = `Test Thread ${Date.now()}`;
    const description = "This is a test thread description";

    await newThreadPage.fillTitle(title);
    await newThreadPage.fillDescription(description);
    await newThreadPage.selectCategory(1);
    await newThreadPage.submit();

    await expect(page).toHaveURL(/\/forum\/threads\/\d+/);
  });

  test("create reply on thread succeeds", async ({ page }) => {
    const { token } = await setupDefaultUserAuth(page);

    const { id: threadId } = await createThreadViaApi(token, {
      title: `Thread for reply test ${Date.now()}`,
      description: "Test thread",
      categoryId: 1,
    });

    const threadDetail = new ThreadDetailPage(page);
    await threadDetail.gotoThread(threadId);

    const replyContent = `Test reply at ${Date.now()}`;
    await threadDetail.fillReplyContent(replyContent);
    await threadDetail.submitReply();

    const content = await threadDetail.getReplyContent(1);
    expect(content).toContain(replyContent);

    await deleteThreadViaApi(token, threadId);
  });

  test("upvote and downvote thread", async ({ page }) => {
    const { token } = await setupDefaultUserAuth(page);

    const { id: threadId } = await createThreadViaApi(token, {
      title: `Thread for voting ${Date.now()}`,
      description: "Test thread",
      categoryId: 1,
    });

    const threadDetail = new ThreadDetailPage(page);
    await threadDetail.gotoThread(threadId);

    const initialScore = await threadDetail.getVoteScore();

    await threadDetail.upvote();
    await page.waitForTimeout(300);
    let newScore = await threadDetail.getVoteScore();
    expect(parseInt(newScore)).toBeGreaterThan(parseInt(initialScore));

    await threadDetail.upvote();
    await page.waitForTimeout(300);
    newScore = await threadDetail.getVoteScore();
    expect(parseInt(newScore)).toBe(parseInt(initialScore));

    await deleteThreadViaApi(token, threadId);
  });

  test("filter threads by category", async ({ page }) => {
    const forum = new ForumPage(page);
    await forum.goto();

    await forum.filterByCategory(1);
    await page.waitForLoadState("networkidle");

    await expect(page.getByTestId("thread-list")).toBeVisible();
  });

  test("search threads by keyword", async ({ page }) => {
    const forum = new ForumPage(page);
    await forum.goto();

    await forum.search("Test");
    await page.waitForLoadState("networkidle");

    await expect(page.getByTestId("thread-list")).toBeVisible();
  });

  test("sort threads by newest", async ({ page }) => {
    const forum = new ForumPage(page);
    await forum.goto();

    await forum.setSort("newest");
    await page.waitForLoadState("networkidle");

    await expect(page.getByTestId("thread-list")).toBeVisible();
  });

  test("sort threads by popular", async ({ page }) => {
    const forum = new ForumPage(page);
    await forum.goto();

    await forum.setSort("popular");
    await page.waitForLoadState("networkidle");

    await expect(page.getByTestId("thread-list")).toBeVisible();
  });

  test("delete own thread succeeds", async ({ page }) => {
    const { token } = await setupDefaultUserAuth(page);

    const { id: threadId } = await createThreadViaApi(token, {
      title: `Thread to delete ${Date.now()}`,
      description: "Test thread for deletion",
      categoryId: 1,
    });

    const threadDetail = new ThreadDetailPage(page);
    await threadDetail.gotoThread(threadId);

    const deleteButton = page.locator("[data-testid='delete-thread-button']");
    if (await deleteButton.isVisible()) {
      await deleteButton.click();
      await page.waitForLoadState("networkidle");
    }
  });

  test("moderator can close thread", async ({ page }) => {
    const { token: userToken } = await setupDefaultUserAuth(page);

    const { id: threadId } = await createThreadViaApi(userToken, {
      title: `Thread for moderator ${Date.now()}`,
      description: "Test thread",
      categoryId: 1,
    });

    const { token: modToken } = await setupModeratorAuth(page);

    const threadDetail = new ThreadDetailPage(page);
    await threadDetail.gotoThread(threadId);

    const hasCloseButton = await threadDetail.closeThreadButtonExists();
    expect(hasCloseButton).toBe(true);

    await deleteThreadViaApi(modToken, threadId);
  });

  test("navigating to thread detail shows thread information", async ({ page }) => {
    const { token } = await setupDefaultUserAuth(page);

    const title = `Test Thread ${Date.now()}`;
    const description = "Test description for thread";

    const { id: threadId } = await createThreadViaApi(token, {
      title,
      description,
      categoryId: 1,
    });

    const threadDetail = new ThreadDetailPage(page);
    await threadDetail.gotoThread(threadId);

    const displayedTitle = await threadDetail.getThreadTitle();
    expect(displayedTitle).toContain(title);

    const displayedDesc = await threadDetail.getThreadDescription();
    expect(displayedDesc).toContain(description);

    await deleteThreadViaApi(token, threadId);
  });

  test("reply form appears on thread detail page", async ({ page }) => {
    const { token } = await setupDefaultUserAuth(page);

    const { id: threadId } = await createThreadViaApi(token, {
      title: `Thread for reply form ${Date.now()}`,
      description: "Test thread",
      categoryId: 1,
    });

    const threadDetail = new ThreadDetailPage(page);
    await threadDetail.gotoThread(threadId);

    const isVisible = await threadDetail.isReplyFormVisible();
    expect(isVisible).toBe(true);

    await deleteThreadViaApi(token, threadId);
  });

  test("create nested reply succeeds", async ({ page }) => {
    const { token } = await setupDefaultUserAuth(page);

    const { id: threadId } = await createThreadViaApi(token, {
      title: `Thread for nested reply ${Date.now()}`,
      description: "Test thread",
      categoryId: 1,
    });

    const { id: replyId } = await createReplyViaApi(token, threadId, {
      content: "First reply",
    });

    const threadDetail = new ThreadDetailPage(page);
    await threadDetail.gotoThread(threadId);

    const nestedReplyContent = `Nested reply ${Date.now()}`;
    await threadDetail.fillReplyContent(nestedReplyContent);
    await threadDetail.submitReply();

    const content = await threadDetail.getReplyContent(1);
    expect(content).toBeTruthy();

    await deleteThreadViaApi(token, threadId);
  });
});
