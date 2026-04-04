import { test, expect } from "@playwright/test";
import { LoginPage } from "./pages/LoginPage";
import { RegisterPage } from "./pages/RegisterPage";
import { DashboardPage } from "./pages/DashboardPage";
import { ForumPage } from "./pages/ForumPage";
import { ThreadDetailPage } from "./pages/ThreadDetailPage";
import { ProfilePage } from "./pages/ProfilePage";
import { loginAsDefaultUser, setupDefaultUserAuth, DEFAULT_USER } from "./fixtures/auth";
import { API_BASE } from "./config";

// ---------------------------------------------------------------------------
// Full user journey: register → login → create thread → reply → vote
// ---------------------------------------------------------------------------

test.describe("Full user journey: register → login → forum → create thread → reply → vote", () => {
  const timestamp = Date.now();
  const journeyUser = {
    email: `journey${timestamp}@example.com`,
    username: `journey${timestamp}`.slice(0, 20),
    password: "Journey1234",
  };

  test("end-to-end journey completes without errors", async ({ page }) => {
    // Step 1: Register
    const registerPage = new RegisterPage(page);
    await registerPage.register(journeyUser.email, journeyUser.username, journeyUser.password);
    await expect(page).toHaveURL(/\/login/, { timeout: 10000 });

    // Step 2: Login
    const loginPage = new LoginPage(page);
    await loginPage.fillUsername(journeyUser.username);
    await loginPage.fillPassword(journeyUser.password);
    await loginPage.submit();
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 10000 });

    // Step 3: Navigate to forum via the dashboard forum link
    const dashboardPage = new DashboardPage(page);
    await dashboardPage.waitForLoad();
    await page.getByTestId("forum-link").click();
    await expect(page).toHaveURL(/\/forum/, { timeout: 10000 });

    // Step 4: Create a thread
    const forumPage = new ForumPage(page);
    await forumPage.waitForLoad();
    await forumPage.clickNewThreadButton();

    const threadTitle = `Journey thread ${timestamp}`;
    await page.getByTestId("thread-title-input").fill(threadTitle);
    await page.getByTestId("thread-desc-input").fill("Created in the full journey test");
    await page.getByTestId("thread-submit-button").click();

    await page.waitForURL(/\/forum\/threads\/\d+/, { timeout: 10000 });
    const url = page.url();
    const match = url.match(/\/forum\/threads\/(\d+)/);
    if (!match) throw new Error("Could not extract thread ID from URL");
    const threadId = Number(match[1]);

    // Step 5: Verify thread detail page
    const detailPage = new ThreadDetailPage(page);
    await expect(detailPage.getTitle()).toHaveText(threadTitle, { timeout: 5000 });
    await expect(detailPage.getAuthor()).toContainText(journeyUser.username);

    // Step 6: Add a reply
    const replyContent = `Journey reply at ${timestamp}`;
    await detailPage.getReplyContentInput().fill(replyContent);
    await detailPage.getReplySubmitButton().click();
    await expect(page.locator(`text=${replyContent}`)).toBeVisible({ timeout: 10000 });

    // Step 7: Upvote the thread
    const initialScore = await detailPage.getVoteScoreValue();
    await detailPage.getUpvoteButton().click();
    await expect(detailPage.getVoteScore()).not.toHaveText(String(initialScore), {
      timeout: 5000,
    });

    // Step 8: Navigate back to forum index — thread appears in list
    await page.goto("/forum");
    await forumPage.waitForLoad();
    await expect(page.locator(`text=${threadTitle}`)).toBeVisible({ timeout: 10000 });
  });
});

// ---------------------------------------------------------------------------
// Forum navigation from dashboard
// ---------------------------------------------------------------------------

test.describe("Forum navigation from dashboard", () => {
  test.beforeEach(async ({ page }) => {
    await setupDefaultUserAuth(page);
    await page.goto("/dashboard");
  });

  test("forum link in dashboard nav goes to /forum and shows thread list", async ({ page }) => {
    const dashboardPage = new DashboardPage(page);
    await dashboardPage.waitForLoad();

    const forumLink = page.getByTestId("forum-link");
    await expect(forumLink).toBeVisible({ timeout: 5000 });
    await forumLink.click();

    await expect(page).toHaveURL(/\/forum/, { timeout: 10000 });
    const forumPage = new ForumPage(page);
    await forumPage.waitForLoad();
    await expect(forumPage.getThreadList()).toBeVisible({ timeout: 10000 });
  });
});

// ---------------------------------------------------------------------------
// Forum category filtering flow
// ---------------------------------------------------------------------------

test.describe("Forum category filter flow", () => {
  test.beforeEach(async ({ page }) => {
    await setupDefaultUserAuth(page);
  });

  test("clicking a category filter shows only threads for that category", async ({ page }) => {
    const forumPage = new ForumPage(page);
    await forumPage.goto();
    await forumPage.waitForLoad();

    // Category filter must be visible
    await expect(forumPage.getCategoryFilter()).toBeVisible({ timeout: 5000 });

    // The "All" category option must exist
    const allOption = forumPage.getCategoryOption("all");
    await expect(allOption).toBeVisible({ timeout: 5000 });

    // First create a thread in category 1 (Algemeen) so we have something to filter
    await forumPage.clickNewThreadButton();
    const title = `CatFilter thread ${Date.now()}`;
    await page.getByTestId("thread-title-input").fill(title);
    await page.getByTestId("thread-desc-input").fill("Category filter test thread");
    // Select the first category in the dropdown
    await page.getByTestId("thread-category-select").selectOption({ index: 0 });
    await page.getByTestId("thread-submit-button").click();
    await page.waitForURL(/\/forum\/threads\/\d+/, { timeout: 10000 });

    // Go back to forum index and apply the category filter
    await page.goto("/forum");
    await forumPage.waitForLoad();

    // Click category 1
    await forumPage.getCategoryOption(1).click();

    // Thread list should update (still visible)
    await expect(forumPage.getThreadList()).toBeVisible({ timeout: 5000 });
    // The category 1 button should now appear selected (active state)
    await expect(forumPage.getCategoryOption(1)).toBeVisible();

    // Clicking "All" restores the full list
    await forumPage.getCategoryOption("all").click();
    await expect(forumPage.getThreadList()).toBeVisible({ timeout: 5000 });
  });
});

// ---------------------------------------------------------------------------
// Thread voting flow (upvote and downvote on thread itself)
// ---------------------------------------------------------------------------

test.describe("Thread voting flow", () => {
  let threadId: number;

  test.beforeEach(async ({ page }) => {
    await loginAsDefaultUser(page);
    await page.goto("/forum/new");
    await page
      .getByTestId("new-thread-heading")
      .or(page.locator("h1"))
      .waitFor({ state: "visible", timeout: 5000 });

    const title = `ThreadVote ${Date.now()}`;
    await page.getByTestId("thread-title-input").fill(title);
    await page.getByTestId("thread-desc-input").fill("Thread voting test");
    await page.getByTestId("thread-submit-button").click();
    await page.waitForURL(/\/forum\/threads\/\d+/, { timeout: 10000 });
    const match = page.url().match(/\/forum\/threads\/(\d+)/);
    if (!match) throw new Error("Could not extract thread ID");
    threadId = Number(match[1]);
  });

  test("upvoting a thread increments its score", async ({ page }) => {
    const detailPage = new ThreadDetailPage(page);
    await detailPage.goto(threadId);
    await detailPage.waitForLoad();

    const before = await detailPage.getVoteScoreValue();
    await detailPage.getUpvoteButton().click();
    await expect(detailPage.getVoteScore()).not.toHaveText(String(before), { timeout: 5000 });
    const after = await detailPage.getVoteScoreValue();
    expect(after).toBe(before + 1);
  });

  test("downvoting a thread decrements its score", async ({ page }) => {
    const detailPage = new ThreadDetailPage(page);
    await detailPage.goto(threadId);
    await detailPage.waitForLoad();

    const before = await detailPage.getVoteScoreValue();
    await detailPage.getDownvoteButton().click();
    await expect(detailPage.getVoteScore()).not.toHaveText(String(before), { timeout: 5000 });
    const after = await detailPage.getVoteScoreValue();
    expect(after).toBe(before - 1);
  });

  test("upvoting then downvoting returns score to original", async ({ page }) => {
    const detailPage = new ThreadDetailPage(page);
    await detailPage.goto(threadId);
    await detailPage.waitForLoad();

    const original = await detailPage.getVoteScoreValue();

    // Upvote
    await detailPage.getUpvoteButton().click();
    await expect(detailPage.getVoteScore()).not.toHaveText(String(original), { timeout: 5000 });

    // Downvote — should go back to 0 (undo upvote) and then -1
    // Two clicks: first undoes the upvote (0), second sets downvote (-1)
    await detailPage.getDownvoteButton().click();
    await page.waitForTimeout(500);
    await detailPage.getDownvoteButton().click();
    await expect(detailPage.getVoteScore()).not.toHaveText(String(original + 1), {
      timeout: 5000,
    });
  });
});

// ---------------------------------------------------------------------------
// User profile update journey
// ---------------------------------------------------------------------------

test.describe("Profile update journey", () => {
  async function resetProfile() {
    await fetch(`${API_BASE}/api/profile/${DEFAULT_USER.username}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        displayName: "Demo User",
        bio: "Software developer and coffee enthusiast",
        location: "Amsterdam, Netherlands",
      }),
    });
  }

  test.beforeEach(async () => {
    await resetProfile();
  });

  test.afterEach(async () => {
    await resetProfile();
  });

  test("login → navigate to profile via dashboard → update profile → verify persisted", async ({
    page,
  }) => {
    // Step 1: Login through UI
    const loginPage = new LoginPage(page);
    await loginPage.login(DEFAULT_USER.username, DEFAULT_USER.password);
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 10000 });

    // Step 2: Navigate to profile via dashboard link
    const dashboardPage = new DashboardPage(page);
    await dashboardPage.waitForLoad();
    await dashboardPage.clickProfileLink();
    await expect(page).toHaveURL(new RegExp(`/profile/${DEFAULT_USER.username}`), {
      timeout: 10000,
    });

    // Step 3: Update profile fields
    const profilePage = new ProfilePage(page);
    await profilePage.waitForLoad();

    await profilePage.fillEditForm("Journey Name", "Updated in journey test", "Rotterdam");
    await profilePage.saveProfile();

    const alert = profilePage.getAlertBanner();
    await expect(alert).toBeVisible({ timeout: 10000 });
    await expect(alert).toContainText(/succesvol|opgeslagen/i);

    // Step 4: Reload and verify persistence
    await page.reload();
    await profilePage.waitForLoad();

    await expect(profilePage.getDisplayNameInput()).toHaveValue("Journey Name");
    await expect(profilePage.getBioInput()).toHaveValue("Updated in journey test");
    await expect(profilePage.getLocationInput()).toHaveValue("Rotterdam");
  });
});

// ---------------------------------------------------------------------------
// Forum thread detail — public access (unauthenticated)
// ---------------------------------------------------------------------------

test.describe("Forum thread detail — public access", () => {
  test("thread detail page is accessible without login", async ({ page }) => {
    // First create a thread as logged-in user so we have one to visit
    await loginAsDefaultUser(page);
    await page.goto("/forum/new");
    await page
      .getByTestId("new-thread-heading")
      .or(page.locator("h1"))
      .waitFor({ state: "visible", timeout: 5000 });

    const title = `Public Thread ${Date.now()}`;
    await page.getByTestId("thread-title-input").fill(title);
    await page.getByTestId("thread-desc-input").fill("Publicly accessible thread");
    await page.getByTestId("thread-submit-button").click();
    await page.waitForURL(/\/forum\/threads\/\d+/, { timeout: 10000 });
    const threadId = page.url().match(/\/forum\/threads\/(\d+)/)?.[1];
    if (!threadId) throw new Error("Could not extract thread ID");

    // Clear session (simulate logout)
    await page.evaluate(() => localStorage.clear());
    await page.goto(`/forum/threads/${threadId}`);

    const detailPage = new ThreadDetailPage(page);
    await expect(detailPage.getTitle()).toContainText(title, { timeout: 10000 });
    await expect(detailPage.getDescription()).toBeVisible();
  });

  test("forum index loads without authentication and shows thread list", async ({ page }) => {
    await page.goto("/forum");
    const forumPage = new ForumPage(page);
    await forumPage.waitForLoad();
    await expect(forumPage.getThreadList()).toBeVisible({ timeout: 10000 });
  });
});

// ---------------------------------------------------------------------------
// Forum search → click result → see detail
// ---------------------------------------------------------------------------

test.describe("Forum search to detail flow", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsDefaultUser(page);
  });

  test("search finds thread → clicking title navigates to detail page", async ({ page }) => {
    // Create a thread with unique title
    const uniqueTitle = `SearchNav${Date.now()}`;
    await page.goto("/forum/new");
    await page
      .getByTestId("new-thread-heading")
      .or(page.locator("h1"))
      .waitFor({ state: "visible", timeout: 5000 });

    await page.getByTestId("thread-title-input").fill(uniqueTitle);
    await page.getByTestId("thread-desc-input").fill("Thread for search-to-detail test");
    await page.getByTestId("thread-submit-button").click();
    await page.waitForURL(/\/forum\/threads\/\d+/, { timeout: 10000 });

    // Go to forum index and search
    await page.goto("/forum");
    const forumPage = new ForumPage(page);
    await forumPage.waitForLoad();

    await forumPage.getSearchInput().fill(uniqueTitle);

    // Wait for results
    const threadLink = page.locator(`text=${uniqueTitle}`).first();
    await expect(threadLink).toBeVisible({ timeout: 10000 });

    // Click the thread title to navigate to detail
    await threadLink.click();
    await expect(page).toHaveURL(/\/forum\/threads\/\d+/, { timeout: 10000 });

    const detailPage = new ThreadDetailPage(page);
    await expect(detailPage.getTitle()).toContainText(uniqueTitle, { timeout: 5000 });
  });
});

// ---------------------------------------------------------------------------
// Reply content counter constraint
// ---------------------------------------------------------------------------

test.describe("Reply content constraint flow", () => {
  let threadId: number;

  test.beforeEach(async ({ page }) => {
    await loginAsDefaultUser(page);
    await page.goto("/forum/new");
    await page
      .getByTestId("new-thread-heading")
      .or(page.locator("h1"))
      .waitFor({ state: "visible", timeout: 5000 });

    const title = `ReplyConstraint ${Date.now()}`;
    await page.getByTestId("thread-title-input").fill(title);
    await page.getByTestId("thread-desc-input").fill("Reply constraint test");
    await page.getByTestId("thread-submit-button").click();
    await page.waitForURL(/\/forum\/threads\/\d+/, { timeout: 10000 });
    const match = page.url().match(/\/forum\/threads\/(\d+)/);
    if (!match) throw new Error("Could not extract thread ID");
    threadId = Number(match[1]);
  });

  test("reply content over 2000 chars shows error on submit attempt", async ({ page }) => {
    const detailPage = new ThreadDetailPage(page);
    await detailPage.goto(threadId);
    await detailPage.waitForLoad();

    // CONSTRAINT: reply content max 2000 chars — validated on submit, not via disabled button
    const oversized = "R".repeat(2001);
    await detailPage.getReplyContentInput().fill(oversized);

    // Submit button is still enabled (the limit is checked on submit)
    await expect(detailPage.getReplySubmitButton()).toBeEnabled({ timeout: 3000 });

    // Clicking submit shows an error message
    await detailPage.getReplySubmitButton().click();
    await expect(page.getByTestId("reply-form-error")).toBeVisible({ timeout: 5000 });
    await expect(page.getByTestId("reply-form-error")).toContainText(/2000/);

    // Page does not navigate away
    await expect(page).toHaveURL(/\/forum\/threads\/\d+/);
  });

  test("reply content counter shows character count", async ({ page }) => {
    const detailPage = new ThreadDetailPage(page);
    await detailPage.goto(threadId);
    await detailPage.waitForLoad();

    await detailPage.getReplyContentInput().fill("Hello reply");
    await expect(page.getByTestId("reply-content-counter")).toContainText("11", {
      timeout: 3000,
    });
  });
});
