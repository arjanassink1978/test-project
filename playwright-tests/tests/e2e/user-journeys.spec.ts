import { test, expect } from "@playwright/test";
import { LoginPage } from "./pages/LoginPage";
import { RegisterPage } from "./pages/RegisterPage";
import { DashboardPage } from "./pages/DashboardPage";
import { ForumPage } from "./pages/ForumPage";
import { ThreadDetailPage } from "./pages/ThreadDetailPage";
import { NewThreadPage } from "./pages/NewThreadPage";
import { setupDefaultUserAuth } from "./fixtures/auth";
import { createThreadViaApi, deleteThreadViaApi } from "./fixtures/api";

test.describe("User Journeys", () => {
  test("complete registration to forum to thread creation journey", async ({ page }) => {
    const registerPage = new RegisterPage(page);
    const uniqueUsername = `journey_user_${Date.now()}`;
    const uniqueEmail = `journey_${Date.now()}@example.com`;

    await registerPage.goto();
    await registerPage.registerWith(uniqueEmail, uniqueUsername, "testpass1234", "testpass1234");

    await expect(page).toHaveURL("/login");

    const loginPage = new LoginPage(page);
    await loginPage.loginWith(uniqueUsername, "testpass1234");

    await expect(page).toHaveURL("/dashboard");

    const dashboard = new DashboardPage(page);
    const isWelcoming = await dashboard.isWelcomingHeadingVisible();
    expect(isWelcoming).toBe(true);

    await dashboard.clickForumLink();

    const forum = new ForumPage(page);
    const hasNewThreadButton = await forum.isNewThreadButtonVisible();
    expect(hasNewThreadButton).toBe(true);

    await forum.clickNewThread();

    const newThreadPage = new NewThreadPage(page);
    const title = `Journey Test Thread ${Date.now()}`;
    const description = "Test thread from user journey";

    await newThreadPage.fillTitle(title);
    await newThreadPage.fillDescription(description);
    await newThreadPage.selectCategory(1);
    await newThreadPage.submit();

    await expect(page).toHaveURL(/\/forum\/threads\/\d+/);

    const threadDetail = new ThreadDetailPage(page);
    const displayedTitle = await threadDetail.getThreadTitle();
    expect(displayedTitle).toContain(title);
  });

  test("forum navigation from dashboard to thread detail and back", async ({ page }) => {
    const { token } = await setupDefaultUserAuth(page);

    const { id: threadId } = await createThreadViaApi(token, {
      title: `Navigation Test Thread ${Date.now()}`,
      description: "For navigation testing",
      categoryId: 1,
    });

    const dashboard = new DashboardPage(page);
    await dashboard.goto();

    await dashboard.clickForumLink();
    await expect(page).toHaveURL("/forum");

    const forum = new ForumPage(page);
    await forum.clickThread(threadId);
    await expect(page).toHaveURL(`/forum/threads/${threadId}`);

    const threadDetail = new ThreadDetailPage(page);
    await threadDetail.clickForumLink();
    await expect(page).toHaveURL("/forum");

    await deleteThreadViaApi(token, threadId);
  });

  test("forum category filter flow", async ({ page }) => {
    const forum = new ForumPage(page);
    await forum.goto();

    await forum.filterByCategory(1);
    await page.waitForLoadState("networkidle");

    await expect(page.getByTestId("thread-list")).toBeVisible();

    await forum.filterByCategory(2);
    await page.waitForLoadState("networkidle");

    await expect(page.getByTestId("thread-list")).toBeVisible();

    await forum.clearCategoryFilter();
    await page.waitForLoadState("networkidle");

    await expect(page.getByTestId("thread-list")).toBeVisible();
  });

  test("thread voting journey - upvote, cancel, downvote", async ({ page }) => {
    const { token } = await setupDefaultUserAuth(page);

    const { id: threadId } = await createThreadViaApi(token, {
      title: `Voting Journey Thread ${Date.now()}`,
      description: "For voting testing",
      categoryId: 1,
    });

    const threadDetail = new ThreadDetailPage(page);
    await threadDetail.gotoThread(threadId);

    const initialScore = await threadDetail.getVoteScore();
    const initialScoreNum = parseInt(initialScore);

    await threadDetail.upvote();
    await page.waitForTimeout(300);
    let currentScore = await threadDetail.getVoteScore();
    let currentScoreNum = parseInt(currentScore);
    expect(currentScoreNum).toBeGreaterThan(initialScoreNum);

    await threadDetail.upvote();
    await page.waitForTimeout(300);
    currentScore = await threadDetail.getVoteScore();
    currentScoreNum = parseInt(currentScore);
    expect(currentScoreNum).toBe(initialScoreNum);

    await threadDetail.downvote();
    await page.waitForTimeout(300);
    currentScore = await threadDetail.getVoteScore();
    currentScoreNum = parseInt(currentScore);
    expect(currentScoreNum).toBeLessThan(initialScoreNum);

    await deleteThreadViaApi(token, threadId);
  });

  test("public thread access without authentication", async ({ page }) => {
    const { token } = await setupDefaultUserAuth(page);

    const { id: threadId } = await createThreadViaApi(token, {
      title: `Public Thread ${Date.now()}`,
      description: "Public thread test",
      categoryId: 1,
    });

    await page.evaluate(() => {
      localStorage.clear();
    });

    const threadDetail = new ThreadDetailPage(page);
    await threadDetail.gotoThread(threadId);

    const title = await threadDetail.getThreadTitle();
    expect(title).toBeTruthy();

    const description = await threadDetail.getThreadDescription();
    expect(description).toBeTruthy();

    await deleteThreadViaApi(token, threadId);
  });

  test("forum search and navigation journey", async ({ page }) => {
    const { token } = await setupDefaultUserAuth(page);

    const searchTerm = `SearchTest_${Date.now()}`;

    const { id: threadId } = await createThreadViaApi(token, {
      title: `${searchTerm} Thread`,
      description: "Searchable thread",
      categoryId: 1,
    });

    const forum = new ForumPage(page);
    await forum.goto();

    await forum.search(searchTerm);
    await page.waitForLoadState("networkidle");

    await expect(page.getByTestId("thread-list")).toBeVisible();

    await deleteThreadViaApi(token, threadId);
  });

  test("thread creation with category selection journey", async ({ page }) => {
    await setupDefaultUserAuth(page);

    const newThreadPage = new NewThreadPage(page);
    await newThreadPage.goto();

    const title = `Category Selection Test ${Date.now()}`;
    const description = "Test category selection";

    await newThreadPage.fillTitle(title);
    await newThreadPage.fillDescription(description);

    await newThreadPage.selectCategory(2);

    await newThreadPage.submit();

    await expect(page).toHaveURL(/\/forum\/threads\/\d+/);

    const threadDetail = new ThreadDetailPage(page);
    const displayedTitle = await threadDetail.getThreadTitle();
    expect(displayedTitle).toContain(title);
  });

  test("reply creation and visibility journey", async ({ page }) => {
    const { token } = await setupDefaultUserAuth(page);

    const { id: threadId } = await createThreadViaApi(token, {
      title: `Reply Test Thread ${Date.now()}`,
      description: "For reply testing",
      categoryId: 1,
    });

    const threadDetail = new ThreadDetailPage(page);
    await threadDetail.gotoThread(threadId);

    const replyContent = `Test reply at ${Date.now()}`;
    await threadDetail.fillReplyContent(replyContent);
    await threadDetail.submitReply();

    await page.waitForLoadState("networkidle");

    const displayedContent = await threadDetail.getReplyContent(1);
    expect(displayedContent).toContain(replyContent);

    await deleteThreadViaApi(token, threadId);
  });

  test("sort and filter combination journey", async ({ page }) => {
    const forum = new ForumPage(page);
    await forum.goto();

    await forum.filterByCategory(1);
    await page.waitForLoadState("networkidle");

    await forum.setSort("popular");
    await page.waitForLoadState("networkidle");

    await forum.search("test");
    await page.waitForLoadState("networkidle");

    await expect(page.getByTestId("thread-list")).toBeVisible();

    await forum.clearCategoryFilter();
    await page.waitForLoadState("networkidle");

    await expect(page.getByTestId("thread-list")).toBeVisible();
  });

  test("login to profile update journey", async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();

    await loginPage.loginWith("user", "user1234");

    await expect(page).toHaveURL("/dashboard");

    const dashboard = new DashboardPage(page);
    await dashboard.clickProfileLink();

    await expect(page).toHaveURL(/\/profile\/user/);
  });
});
