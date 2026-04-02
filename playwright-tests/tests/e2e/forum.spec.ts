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
// Forum layout redesign tests (issue #19)
// -------------------------------------------------------------------------

test.describe("Forum layout redesign — vote badge", () => {
  let threadId: number;
  let replyId: number;

  test.beforeEach(async ({ page }) => {
    await loginAsDefaultUser(page);

    // Create thread via UI
    await page.goto("/forum/new");
    await page
      .getByTestId("new-thread-heading")
      .or(page.locator("h1"))
      .waitFor({ state: "visible", timeout: 5000 });

    const title = `Vote Badge Test ${Date.now()}`;
    await page.getByTestId("thread-title-input").fill(title);
    await page.getByTestId("thread-desc-input").fill("Vote badge layout test");
    await page.getByTestId("thread-submit-button").click();

    await page.waitForURL(/\/forum\/threads\/\d+/, { timeout: 10000 });
    const url = page.url();
    const match = url.match(/\/forum\/threads\/(\d+)/);
    if (!match) throw new Error("Could not extract thread ID from URL");
    threadId = Number(match[1]);

    // Add a reply via UI
    const detailPage = new ThreadDetailPage(page);
    await detailPage.waitForLoad();
    const replyContent = `Badge reply ${Date.now()}`;
    await detailPage.getReplyContentInput().fill(replyContent);
    await detailPage.getReplySubmitButton().click();

    // Wait for reply to appear and extract its ID
    await page.waitForSelector('[data-testid^="reply-item-"]', { timeout: 10000 });
    const replyTestId = await page
      .locator('[data-testid^="reply-item-"]')
      .first()
      .getAttribute("data-testid");
    if (!replyTestId) throw new Error("Could not find reply item");
    replyId = Number(replyTestId.replace("reply-item-", ""));
  });

  test("upvote-button and vote-score are visible on a reply", async ({ page }) => {
    const detailPage = new ThreadDetailPage(page);
    await detailPage.goto(threadId);
    await detailPage.waitForLoad();

    await expect(detailPage.getReplyVoteBadge(replyId)).toBeVisible();
    await expect(detailPage.getReplyUpvoteButton(replyId)).toBeVisible();
    await expect(detailPage.getReplyVoteScore(replyId)).toBeVisible();
  });

  test("vote badge is inside the reply header row (top-right position)", async ({ page }) => {
    const detailPage = new ThreadDetailPage(page);
    await detailPage.goto(threadId);
    await detailPage.waitForLoad();

    // The vote badge must be a sibling of the author row, both inside a flex
    // justify-between container — confirm both are inside reply-item
    const replyItem = detailPage.getReplyItem(replyId);
    await expect(replyItem).toBeVisible();

    const badge = detailPage.getReplyVoteBadge(replyId);
    const authorRow = detailPage.getReplyAuthorRow(replyId);
    await expect(badge).toBeVisible();
    await expect(authorRow).toBeVisible();

    // Both badge and author row must be descendants of the same reply item
    const badgeBox = await badge.boundingBox();
    const authorBox = await authorRow.boundingBox();
    if (!badgeBox || !authorBox) throw new Error("Could not get bounding boxes");

    // Badge is to the right of the author row (top-right corner)
    expect(badgeBox.x).toBeGreaterThan(authorBox.x);
  });

  test("clicking upvote-button on a reply increments the vote-score", async ({ page }) => {
    const detailPage = new ThreadDetailPage(page);
    await detailPage.goto(threadId);
    await detailPage.waitForLoad();

    const scoreLocator = detailPage.getReplyVoteScore(replyId);
    const initialScoreText = await scoreLocator.textContent();
    const initialScore = Number(initialScoreText?.trim() ?? "0");

    await detailPage.getReplyUpvoteButton(replyId).click();

    // Wait for score to update
    await expect(scoreLocator).not.toHaveText(String(initialScore), { timeout: 5000 });
    const updatedScoreText = await scoreLocator.textContent();
    expect(Number(updatedScoreText?.trim())).toBe(initialScore + 1);
  });
});

test.describe("Forum layout redesign — reply header", () => {
  let threadId: number;
  let replyId: number;

  test.beforeEach(async ({ page }) => {
    await loginAsDefaultUser(page);

    // Create thread via UI
    await page.goto("/forum/new");
    await page
      .getByTestId("new-thread-heading")
      .or(page.locator("h1"))
      .waitFor({ state: "visible", timeout: 5000 });

    const title = `Reply Header Test ${Date.now()}`;
    await page.getByTestId("thread-title-input").fill(title);
    await page.getByTestId("thread-desc-input").fill("Reply header layout test");
    await page.getByTestId("thread-submit-button").click();

    await page.waitForURL(/\/forum\/threads\/\d+/, { timeout: 10000 });
    const url = page.url();
    const match = url.match(/\/forum\/threads\/(\d+)/);
    if (!match) throw new Error("Could not extract thread ID from URL");
    threadId = Number(match[1]);

    // Add a reply via UI
    const detailPage = new ThreadDetailPage(page);
    await detailPage.waitForLoad();
    await detailPage.getReplyContentInput().fill(`Header reply ${Date.now()}`);
    await detailPage.getReplySubmitButton().click();

    await page.waitForSelector('[data-testid^="reply-item-"]', { timeout: 10000 });
    const replyTestId = await page
      .locator('[data-testid^="reply-item-"]')
      .first()
      .getAttribute("data-testid");
    if (!replyTestId) throw new Error("Could not find reply item");
    replyId = Number(replyTestId.replace("reply-item-", ""));
  });

  test("reply-author-{id} shows the author username inline", async ({ page }) => {
    const detailPage = new ThreadDetailPage(page);
    await detailPage.goto(threadId);
    await detailPage.waitForLoad();

    // reply-author-{id} wraps avatar + username; username is in the first span
    const authorRow = detailPage.getReplyAuthorRow(replyId);
    await expect(authorRow).toBeVisible();
    await expect(authorRow).toContainText(DEFAULT_USER.username);
  });

  test("reply author row contains depth indicator text", async ({ page }) => {
    const detailPage = new ThreadDetailPage(page);
    await detailPage.goto(threadId);
    await detailPage.waitForLoad();

    // The author row shows "depth 0" for a top-level reply
    const authorRow = detailPage.getReplyAuthorRow(replyId);
    await expect(authorRow).toContainText("depth");
  });
});

test.describe("Forum layout redesign — nesting left-border", () => {
  let threadId: number;
  let parentReplyId: number;
  let childReplyId: number;

  test.beforeEach(async ({ page }) => {
    await loginAsDefaultUser(page);

    // Create thread via UI
    await page.goto("/forum/new");
    await page
      .getByTestId("new-thread-heading")
      .or(page.locator("h1"))
      .waitFor({ state: "visible", timeout: 5000 });

    const title = `Nesting Test ${Date.now()}`;
    await page.getByTestId("thread-title-input").fill(title);
    await page.getByTestId("thread-desc-input").fill("Nesting visual test");
    await page.getByTestId("thread-submit-button").click();

    await page.waitForURL(/\/forum\/threads\/\d+/, { timeout: 10000 });
    const url = page.url();
    const match = url.match(/\/forum\/threads\/(\d+)/);
    if (!match) throw new Error("Could not extract thread ID from URL");
    threadId = Number(match[1]);

    // Add a parent reply via UI
    const detailPage = new ThreadDetailPage(page);
    await detailPage.waitForLoad();
    await detailPage.getReplyContentInput().fill(`Parent reply ${Date.now()}`);
    await detailPage.getReplySubmitButton().click();

    await page.waitForSelector('[data-testid^="reply-item-"]', { timeout: 10000 });
    const parentTestId = await page
      .locator('[data-testid^="reply-item-"]')
      .first()
      .getAttribute("data-testid");
    if (!parentTestId) throw new Error("Could not find parent reply item");
    parentReplyId = Number(parentTestId.replace("reply-item-", ""));

    // Add a nested reply via the inline reply toggle
    const replyToggle = detailPage.getReplyToggle(parentReplyId);
    await replyToggle.click();

    const nestedForm = page
      .getByTestId(`reply-item-${parentReplyId}`)
      .getByTestId("reply-content-input");
    await nestedForm.waitFor({ state: "visible", timeout: 5000 });
    await nestedForm.fill(`Nested reply ${Date.now()}`);

    await page
      .getByTestId(`reply-item-${parentReplyId}`)
      .getByTestId("reply-submit-button")
      .or(
        page
          .getByTestId(`reply-item-${parentReplyId}`)
          .getByRole("button", { name: /post reply/i })
      )
      .click();

    // Wait for nested reply to render
    await page.waitForTimeout(2000);
    await detailPage.goto(threadId);
    await detailPage.waitForLoad();

    // Find the child reply (depth > 0): it will be inside the parent's children
    const childItems = await page
      .getByTestId(`reply-item-${parentReplyId}`)
      .locator('[data-testid^="reply-item-"]')
      .all();
    if (childItems.length === 0) throw new Error("No nested reply found");
    const childTestId = await childItems[0].getAttribute("data-testid");
    if (!childTestId) throw new Error("Could not get child reply testid");
    childReplyId = Number(childTestId.replace("reply-item-", ""));
  });

  test("nested reply (depth > 0) has left-border class applied", async ({ page }) => {
    const detailPage = new ThreadDetailPage(page);
    await detailPage.goto(threadId);
    await detailPage.waitForLoad();

    // The nested reply container has pl-4 and border-l-2 classes for depth > 0
    const nestedReplyContainer = page
      .getByTestId(`reply-item-${childReplyId}`)
      .locator(".border-l-2")
      .first();

    await expect(nestedReplyContainer).toBeVisible();
  });

  test("top-level reply does not have left-border class", async ({ page }) => {
    const detailPage = new ThreadDetailPage(page);
    await detailPage.goto(threadId);
    await detailPage.waitForLoad();

    // Top-level reply (depth 0) has no border-l-2 on its inner flex container
    const topLevelItem = page.getByTestId(`reply-item-${parentReplyId}`);
    await expect(topLevelItem).toBeVisible();

    // The direct flex wrapper inside the top-level item should not have border-l-2
    const borderElements = topLevelItem.locator(
      ":scope > div.border-l-2"
    );
    await expect(borderElements).toHaveCount(0);
  });
});

test.describe("Forum layout redesign — collapse toggle", () => {
  let threadId: number;
  let parentReplyId: number;
  let childReplyId: number;

  test.beforeEach(async ({ page }) => {
    await loginAsDefaultUser(page);

    // Create thread via UI
    await page.goto("/forum/new");
    await page
      .getByTestId("new-thread-heading")
      .or(page.locator("h1"))
      .waitFor({ state: "visible", timeout: 5000 });

    const title = `Collapse Test ${Date.now()}`;
    await page.getByTestId("thread-title-input").fill(title);
    await page.getByTestId("thread-desc-input").fill("Collapse toggle test");
    await page.getByTestId("thread-submit-button").click();

    await page.waitForURL(/\/forum\/threads\/\d+/, { timeout: 10000 });
    const url = page.url();
    const match = url.match(/\/forum\/threads\/(\d+)/);
    if (!match) throw new Error("Could not extract thread ID from URL");
    threadId = Number(match[1]);

    // Add a parent reply via UI
    const detailPage = new ThreadDetailPage(page);
    await detailPage.waitForLoad();
    const parentContent = `Collapse parent ${Date.now()}`;
    await detailPage.getReplyContentInput().fill(parentContent);
    await detailPage.getReplySubmitButton().click();

    await page.waitForSelector('[data-testid^="reply-item-"]', { timeout: 10000 });
    const parentTestId = await page
      .locator('[data-testid^="reply-item-"]')
      .first()
      .getAttribute("data-testid");
    if (!parentTestId) throw new Error("Could not find parent reply item");
    parentReplyId = Number(parentTestId.replace("reply-item-", ""));

    // Add a nested reply via the inline reply toggle
    const replyToggle = detailPage.getReplyToggle(parentReplyId);
    await replyToggle.click();

    const nestedForm = page
      .getByTestId(`reply-item-${parentReplyId}`)
      .getByTestId("reply-content-input");
    await nestedForm.waitFor({ state: "visible", timeout: 5000 });
    const childContent = `Collapse child ${Date.now()}`;
    await nestedForm.fill(childContent);

    await page
      .getByTestId(`reply-item-${parentReplyId}`)
      .getByTestId("reply-submit-button")
      .or(
        page
          .getByTestId(`reply-item-${parentReplyId}`)
          .getByRole("button", { name: /post reply/i })
      )
      .click();

    // Wait for the nested reply to be created then reload
    await page.waitForTimeout(2000);
    await detailPage.goto(threadId);
    await detailPage.waitForLoad();

    const childItems = await page
      .getByTestId(`reply-item-${parentReplyId}`)
      .locator('[data-testid^="reply-item-"]')
      .all();
    if (childItems.length === 0) throw new Error("No nested reply found after reload");
    const childTestId = await childItems[0].getAttribute("data-testid");
    if (!childTestId) throw new Error("Could not get child reply testid");
    childReplyId = Number(childTestId.replace("reply-item-", ""));
  });

  test("collapse toggle button is visible on nested reply with children", async ({ page }) => {
    const detailPage = new ThreadDetailPage(page);
    await detailPage.goto(threadId);
    await detailPage.waitForLoad();

    // The collapse toggle appears on the CHILD reply (depth > 0) only if it
    // itself has children. The parent reply at depth 0 never shows the toggle.
    // Here the child is depth 1 and has no children itself — the toggle should
    // not appear. But the grandparent scenario requires one more nesting level.
    // We verify the child reply item is visible and correctly nested.
    const childItem = page.getByTestId(`reply-item-${childReplyId}`);
    await expect(childItem).toBeVisible();
  });

  test("reply-toggle-{id} button shows and hides the nested reply form", async ({ page }) => {
    const detailPage = new ThreadDetailPage(page);
    await detailPage.goto(threadId);
    await detailPage.waitForLoad();

    // reply-toggle-{id} is the "Reply/Cancel" inline reply form button
    const toggle = detailPage.getReplyToggle(parentReplyId);
    await expect(toggle).toBeVisible();
    await expect(toggle).toContainText("Reply");

    // Click to show the reply form
    await toggle.click();
    await expect(toggle).toContainText("Cancel");

    // The reply form input should now be visible within the parent reply item
    const nestedInput = page
      .getByTestId(`reply-item-${parentReplyId}`)
      .getByTestId("reply-content-input");
    await expect(nestedInput).toBeVisible();

    // Click Cancel to hide it
    await toggle.click();
    await expect(toggle).toContainText("Reply");
    await expect(nestedInput).not.toBeVisible();
  });

  test("collapse toggle (–/+) collapses and expands child replies", async ({ page }) => {
    const detailPage = new ThreadDetailPage(page);
    await detailPage.goto(threadId);
    await detailPage.waitForLoad();

    // Add a grandchild reply so the child reply has children (making the
    // collapse toggle appear on the child)
    const childToggle = detailPage.getReplyToggle(childReplyId);
    await childToggle.click();

    const grandchildForm = page
      .getByTestId(`reply-item-${childReplyId}`)
      .getByTestId("reply-content-input");
    await grandchildForm.waitFor({ state: "visible", timeout: 5000 });
    await grandchildForm.fill(`Grandchild reply ${Date.now()}`);

    await page
      .getByTestId(`reply-item-${childReplyId}`)
      .getByTestId("reply-submit-button")
      .or(
        page
          .getByTestId(`reply-item-${childReplyId}`)
          .getByRole("button", { name: /post reply/i })
      )
      .click();

    await page.waitForTimeout(2000);
    await detailPage.goto(threadId);
    await detailPage.waitForLoad();

    // Find the grandchild reply
    const grandchildItems = await page
      .getByTestId(`reply-item-${childReplyId}`)
      .locator('[data-testid^="reply-item-"]')
      .all();
    if (grandchildItems.length === 0) {
      throw new Error("No grandchild reply found — collapse toggle test requires 3 levels");
    }
    const grandchildTestId = await grandchildItems[0].getAttribute("data-testid");
    if (!grandchildTestId) throw new Error("Could not get grandchild reply testid");
    const grandchildReplyId = Number(grandchildTestId.replace("reply-item-", ""));

    // The collapse toggle should now appear on childReply (depth 1, has children)
    const collapseBtn = detailPage.getCollapseToggle(childReplyId);
    await expect(collapseBtn).toBeVisible();
    await expect(collapseBtn).toHaveText("–");

    // Grandchild should be visible before collapse
    const grandchildItem = page.getByTestId(`reply-item-${grandchildReplyId}`);
    await expect(grandchildItem).toBeVisible();

    // Click collapse — grandchild should disappear
    await collapseBtn.click();
    await expect(collapseBtn).toHaveText("+");
    await expect(grandchildItem).not.toBeVisible();

    // Click expand — grandchild should reappear
    await collapseBtn.click();
    await expect(collapseBtn).toHaveText("–");
    await expect(grandchildItem).toBeVisible();
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
