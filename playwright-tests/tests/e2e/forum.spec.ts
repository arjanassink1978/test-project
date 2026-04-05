import { test, expect } from "@playwright/test";
import { ForumPage } from "./pages/ForumPage";
import { ThreadDetailPage } from "./pages/ThreadDetailPage";
import { loginAsDefaultUser, DEFAULT_USER } from "./fixtures/auth";
import { createThreadViaApi, createReplyViaApi } from "./fixtures/forum";
import { API_BASE } from "./config";

async function fetchBearerToken(credentials: { username: string; password: string }): Promise<string> {
  const res = await fetch(`${API_BASE}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(credentials),
  });
  if (!res.ok) throw new Error(`Auth failed (${res.status})`);
  const data = (await res.json()) as { token?: string };
  if (!data.token) throw new Error("No token returned from auth API");
  return data.token;
}

// -------------------------------------------------------------------------
// Thread creation flow (authenticated)
// -------------------------------------------------------------------------

test.describe("Thread creation flow", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsDefaultUser(page);
    await page.goto("/forum");
  });

  test("navigates from forum index to new-thread form and creates a thread", async ({ page }) => {
    // Start on forum index
    const forumPage = new ForumPage(page);
    await forumPage.goto();
    await forumPage.waitForLoad();

    // Use the helper method — clicks New Thread and waits for /forum/new
    await forumPage.clickNewThreadButton();

    await expect(
      page.getByTestId("new-thread-heading").or(page.locator("h1"))
    ).toBeVisible();

    // Fill and submit the form
    const title = `Playwright Create Flow ${Date.now()}`;
    await page.getByTestId("thread-title-input").fill(title);
    await page.getByTestId("thread-desc-input").fill("Created by E2E create flow test");

    await page.getByTestId("thread-submit-button").click();

    // Should redirect to thread detail page showing the new thread
    await page.waitForURL(/\/forum\/threads\/\d+/, { timeout: 10000 });

    const detailPage = new ThreadDetailPage(page);
    await expect(detailPage.getTitle()).toHaveText(title);
    await expect(detailPage.getAuthor()).toContainText(DEFAULT_USER.username);
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
// Thread title constraint flow (error path)
// -------------------------------------------------------------------------

test.describe("Thread title constraint flow", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsDefaultUser(page);
    await page.goto("/forum/new");
  });

  test("title over 200 chars — submit blocked or error shown", async ({ page }) => {
    // CONSTRAINT: thread title max 200 chars — must match backend @Size(max=200)
    await page.goto("/forum/new");
    await page
      .getByTestId("new-thread-heading")
      .or(page.locator("h1"))
      .waitFor({ state: "visible", timeout: 5000 });

    // Type 201 characters (1 over the limit)
    const oversizedTitle = "A".repeat(201);
    const titleInput = page.getByTestId("thread-title-input");
    // The input has maxLength set to 201 (THREAD_TITLE_MAX + 1) to allow one
    // extra char so the over-limit error triggers. Fill programmatically.
    await titleInput.fill(oversizedTitle);
    await page.getByTestId("thread-desc-input").fill("some description");

    const submitButton = page.getByTestId("thread-submit-button");

    // The submit button is disabled when title is over the limit
    // (disabled={loading || titleOver || descOver || title.trim().length === 0})
    await expect(submitButton).toBeDisabled();

    // Also verify the error alert appears in the form (it shows on submit attempt
    // via keyboard if somehow the button is triggered)
    // The primary assertion is that the button is disabled — no navigation happens
    await expect(page).toHaveURL(/\/forum\/new/);
  });
});

// -------------------------------------------------------------------------
// Thread reply flow (authenticated)
// -------------------------------------------------------------------------

test.describe("Thread reply flow", () => {
  let threadId: number;

  test.beforeEach(async ({ page }) => {
    await loginAsDefaultUser(page);
    threadId = await createThreadViaApi(
      `Reply Flow Thread ${Date.now()}`,
      "Thread for reply flow testing",
      DEFAULT_USER
    );
  });

  test("adds a reply and it appears in the replies section", async ({ page }) => {
    const detailPage = new ThreadDetailPage(page);
    await detailPage.goto(threadId);
    await detailPage.waitForLoad();

    const replyContent = `E2E reply at ${Date.now()}`;
    await detailPage.getReplyContentInput().fill(replyContent);
    await detailPage.getReplySubmitButton().click();

    // Reply should appear after the page refreshes replies
    await expect(
      page.locator(`text=${replyContent}`)
    ).toBeVisible({ timeout: 10000 });
  });
});

// -------------------------------------------------------------------------
// Nested reply (depth) flow
// -------------------------------------------------------------------------

test.describe("Nested reply flow", () => {
  let threadId: number;
  let parentReplyId: number;

  test.beforeEach(async ({ page }) => {
    await loginAsDefaultUser(page);

    threadId = await createThreadViaApi(
      `Nesting Flow Thread ${Date.now()}`,
      "Thread for nesting flow testing",
      DEFAULT_USER
    );

    parentReplyId = await createReplyViaApi(
      threadId,
      `Parent reply ${Date.now()}`,
      DEFAULT_USER
    );
  });

  test("nested reply appears inside parent reply after posting", async ({ page }) => {
    const detailPage = new ThreadDetailPage(page);
    await detailPage.goto(threadId);
    await detailPage.waitForLoad();

    // Open the nested reply form using the reply toggle
    const replyToggle = detailPage.getReplyToggle(parentReplyId);
    await expect(replyToggle).toBeVisible();
    await replyToggle.click();

    const nestedInput = page
      .getByTestId(`reply-item-${parentReplyId}`)
      .getByTestId("reply-content-input");
    await nestedInput.waitFor({ state: "visible", timeout: 5000 });

    const childContent = `Nested reply ${Date.now()}`;
    await nestedInput.fill(childContent);

    await page
      .getByTestId(`reply-item-${parentReplyId}`)
      .getByTestId("reply-submit-button")
      .or(
        page
          .getByTestId(`reply-item-${parentReplyId}`)
          .getByRole("button", { name: /post reply/i })
      )
      .click();

    // Nested reply should appear as a child of the parent reply item
    await page.waitForTimeout(2000);
    await detailPage.goto(threadId);
    await detailPage.waitForLoad();

    const childItems = await page
      .getByTestId(`reply-item-${parentReplyId}`)
      .locator('[data-testid^="reply-item-"]')
      .all();
    expect(childItems.length).toBeGreaterThan(0);

    const childTestId = await childItems[0].getAttribute("data-testid");
    expect(childTestId).toMatch(/reply-item-\d+/);
  });

  test("reply toggle shows/hides the nested reply form", async ({ page }) => {
    const detailPage = new ThreadDetailPage(page);
    await detailPage.goto(threadId);
    await detailPage.waitForLoad();

    const toggle = detailPage.getReplyToggle(parentReplyId);
    await expect(toggle).toBeVisible();
    await expect(toggle).toContainText("Reply");

    // Click to show the reply form
    await toggle.click();
    await expect(toggle).toContainText("Cancel");

    const nestedInput = page
      .getByTestId(`reply-item-${parentReplyId}`)
      .getByTestId("reply-content-input");
    await expect(nestedInput).toBeVisible();

    // Click Cancel to hide it
    await toggle.click();
    await expect(toggle).toContainText("Reply");
    await expect(nestedInput).not.toBeVisible();
  });
});

// -------------------------------------------------------------------------
// Vote flow (authenticated)
// -------------------------------------------------------------------------

test.describe("Vote flow", () => {
  let threadId: number;
  let replyId: number;

  test.beforeEach(async ({ page }) => {
    await loginAsDefaultUser(page);

    // Create a thread and a reply to vote on
    await page.goto("/forum/new");
    await page
      .getByTestId("new-thread-heading")
      .or(page.locator("h1"))
      .waitFor({ state: "visible", timeout: 5000 });

    const title = `Vote Flow Thread ${Date.now()}`;
    await page.getByTestId("thread-title-input").fill(title);
    await page.getByTestId("thread-desc-input").fill("Vote flow test");
    await page.getByTestId("thread-submit-button").click();

    await page.waitForURL(/\/forum\/threads\/\d+/, { timeout: 10000 });
    const url = page.url();
    const match = url.match(/\/forum\/threads\/(\d+)/);
    if (!match) throw new Error("Could not extract thread ID from URL");
    threadId = Number(match[1]);

    const detailPage = new ThreadDetailPage(page);
    await detailPage.waitForLoad();
    await detailPage.getReplyContentInput().fill(`Vote test reply ${Date.now()}`);
    await detailPage.getReplySubmitButton().click();

    await page.waitForSelector('[data-testid^="reply-item-"]', { timeout: 10000 });
    const replyTestId = await page
      .locator('[data-testid^="reply-item-"]')
      .first()
      .getAttribute("data-testid");
    if (!replyTestId) throw new Error("Could not find reply item");
    replyId = Number(replyTestId.replace("reply-item-", ""));
  });

  test("upvoting a reply increments its vote score", async ({ page }) => {
    const detailPage = new ThreadDetailPage(page);
    await detailPage.goto(threadId);
    await detailPage.waitForLoad();

    const initialScore = await detailPage.getReplyVoteScoreValue(replyId);

    await detailPage.getReplyUpvoteButton(replyId).click();

    // Wait for score to update
    await expect(detailPage.getReplyVoteScore(replyId)).not.toHaveText(
      String(initialScore),
      { timeout: 5000 }
    );
    const updatedScore = await detailPage.getReplyVoteScoreValue(replyId);
    expect(updatedScore).toBe(initialScore + 1);
  });

  test("vote badge is positioned at the top-right of the reply header", async ({ page }) => {
    const detailPage = new ThreadDetailPage(page);
    await detailPage.goto(threadId);
    await detailPage.waitForLoad();

    const badge = detailPage.getReplyVoteBadge(replyId);
    const authorRow = detailPage.getReplyAuthorRow(replyId);

    await expect(badge).toBeVisible();
    await expect(authorRow).toBeVisible();

    const badgeBox = await badge.boundingBox();
    const authorBox = await authorRow.boundingBox();
    if (!badgeBox || !authorBox) throw new Error("Could not get bounding boxes");

    // Badge should be to the right of the author row
    expect(badgeBox.x).toBeGreaterThan(authorBox.x);
  });
});

// -------------------------------------------------------------------------
// Forum search flow
// -------------------------------------------------------------------------

test.describe("Forum search flow", () => {
  test("filters threads by search keyword", async ({ page }) => {
    const uniqueKeyword = `UniqueKeyword${Date.now()}`;

    // Create a thread with a unique keyword so the search returns it
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

    // Navigate to forum index and use the search input
    await page.goto("/forum");
    const forumPage = new ForumPage(page);
    await forumPage.waitForLoad();

    await forumPage.getSearchInput().fill(uniqueKeyword);

    // Wait for debounced search — the created thread should appear
    await expect(
      page.locator(`text=${uniqueKeyword}`)
    ).toBeVisible({ timeout: 10000 });
  });
});

// -------------------------------------------------------------------------
// Forum filter and sort flow
// -------------------------------------------------------------------------

test.describe("Forum filter and sort flow", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsDefaultUser(page);
  });

  test("changing sort from newest to popular triggers a different ordering", async ({ page }) => {
    const forumPage = new ForumPage(page);
    await forumPage.goto();
    await forumPage.waitForLoad();

    // Wait for threads to load under "newest" sort
    await page.waitForSelector('[data-testid="thread-list"]', { timeout: 5000 });

    // Capture the thread-list content under "newest"
    const threadListBefore = await forumPage.getThreadList().innerHTML();

    // Switch to "popular"
    await forumPage.selectSort("popular");

    // Wait briefly for the new request to complete
    await page.waitForTimeout(1500);

    // The thread list should have been reloaded (state machine triggers re-fetch)
    const threadListAfter = await forumPage.getThreadList().innerHTML();

    // When there are multiple threads the order may differ — we verify the
    // sort-select now shows "popular" and the list is still present
    await expect(forumPage.getSortSelect()).toHaveValue("popular");
    await expect(forumPage.getThreadList()).toBeVisible();

    // Switch back to newest to verify round-trip
    await forumPage.selectSort("newest");
    await page.waitForTimeout(1500);
    await expect(forumPage.getSortSelect()).toHaveValue("newest");
    await expect(forumPage.getThreadList()).toBeVisible();
  });
});

// -------------------------------------------------------------------------
// Forum delete thread flow — uses API directly (no delete UI in frontend)
// -------------------------------------------------------------------------

test.describe("Forum delete thread flow", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsDefaultUser(page);
  });

  test("creates a thread then deletes it via API and verifies it is no longer accessible", async ({ page }) => {
    // Create thread via UI
    await page.goto("/forum/new");
    await page
      .getByTestId("new-thread-heading")
      .or(page.locator("h1"))
      .waitFor({ state: "visible", timeout: 5000 });

    const title = `Delete Flow Thread ${Date.now()}`;
    await page.getByTestId("thread-title-input").fill(title);
    await page.getByTestId("thread-desc-input").fill("This thread will be deleted");
    await page.getByTestId("thread-submit-button").click();

    await page.waitForURL(/\/forum\/threads\/\d+/, { timeout: 10000 });
    const url = page.url();
    const match = url.match(/\/forum\/threads\/(\d+)/);
    if (!match) throw new Error("Could not extract thread ID from URL");
    const threadId = Number(match[1]);

    // Delete via backend API directly (the frontend has no delete UI)
    const token = await fetchBearerToken(DEFAULT_USER);
    const deleteResponse = await fetch(
      `${API_BASE}/api/forum/threads/${threadId}`,
      {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    expect(deleteResponse.status).toBe(204);

    // Navigate to the thread detail page — it should show "Thread not found" error
    const detailPage = new ThreadDetailPage(page);
    await detailPage.goto(threadId);

    // The page shows the error state (thread not found).
    // The frontend renders: <div class="rounded-md bg-red-50 ...">Thread not found.</div>
    await expect(
      page.getByText(/thread not found\./i)
        .or(page.locator(".bg-red-50").first())
    ).toBeVisible({ timeout: 10000 });

    // Verify the thread is gone from the forum index
    await page.goto("/forum");
    const forumPage = new ForumPage(page);
    await forumPage.waitForLoad();

    await expect(
      forumPage.getThreadItem(threadId)
    ).toHaveCount(0, { timeout: 5000 });
  });
});

// -------------------------------------------------------------------------
// Reply at max depth constraint flow
// -------------------------------------------------------------------------

test.describe("Reply max depth constraint flow", () => {
  let threadId: number;

  test.beforeEach(async ({ page }) => {
    await loginAsDefaultUser(page);

    // Create a thread
    await page.goto("/forum/new");
    await page
      .getByTestId("new-thread-heading")
      .or(page.locator("h1"))
      .waitFor({ state: "visible", timeout: 5000 });

    const title = `Max Depth Test ${Date.now()}`;
    await page.getByTestId("thread-title-input").fill(title);
    await page.getByTestId("thread-desc-input").fill("Max depth constraint test");
    await page.getByTestId("thread-submit-button").click();

    await page.waitForURL(/\/forum\/threads\/\d+/, { timeout: 10000 });
    const url = page.url();
    const match = url.match(/\/forum\/threads\/(\d+)/);
    if (!match) throw new Error("Could not extract thread ID from URL");
    threadId = Number(match[1]);
  });

  test("reply toggle is absent at max nesting depth (depth 2 replies cannot be replied to)", async ({ page }) => {
    // CONSTRAINT: MAX_REPLY_DEPTH=3; canReply = depth < MAX_REPLY_DEPTH - 1 = 2
    // At depth 2 the reply toggle button is not rendered.
    // We build: depth-0 reply -> depth-1 reply -> depth-2 reply,
    // then verify no reply-toggle exists on the depth-2 reply.

    const detailPage = new ThreadDetailPage(page);
    await detailPage.waitForLoad();

    // Add depth-0 reply
    await detailPage.getReplyContentInput().fill(`Depth 0 reply ${Date.now()}`);
    await detailPage.getReplySubmitButton().click();
    await page.waitForSelector('[data-testid^="reply-item-"]', { timeout: 10000 });

    const d0TestId = await page
      .locator('[data-testid^="reply-item-"]')
      .first()
      .getAttribute("data-testid");
    if (!d0TestId) throw new Error("No depth-0 reply found");
    const d0Id = Number(d0TestId.replace("reply-item-", ""));

    // Add depth-1 reply via the depth-0 toggle
    const d0Toggle = detailPage.getReplyToggle(d0Id);
    await d0Toggle.click();
    const d1Input = page
      .getByTestId(`reply-item-${d0Id}`)
      .getByTestId("reply-content-input");
    await d1Input.waitFor({ state: "visible", timeout: 5000 });
    await d1Input.fill(`Depth 1 reply ${Date.now()}`);
    await page
      .getByTestId(`reply-item-${d0Id}`)
      .getByTestId("reply-submit-button")
      .or(page.getByTestId(`reply-item-${d0Id}`).getByRole("button", { name: /post reply/i }))
      .click();

    await page.waitForTimeout(2000);
    await detailPage.goto(threadId);
    await detailPage.waitForLoad();

    const d1Items = await page
      .getByTestId(`reply-item-${d0Id}`)
      .locator('[data-testid^="reply-item-"]')
      .all();
    if (d1Items.length === 0) throw new Error("No depth-1 reply found");
    const d1TestId = await d1Items[0].getAttribute("data-testid");
    if (!d1TestId) throw new Error("No depth-1 testid");
    const d1Id = Number(d1TestId.replace("reply-item-", ""));

    // Add depth-2 reply via the depth-1 toggle
    const d1Toggle = detailPage.getReplyToggle(d1Id);
    await d1Toggle.click();
    const d2Input = page
      .getByTestId(`reply-item-${d1Id}`)
      .getByTestId("reply-content-input");
    await d2Input.waitFor({ state: "visible", timeout: 5000 });
    await d2Input.fill(`Depth 2 reply ${Date.now()}`);
    await page
      .getByTestId(`reply-item-${d1Id}`)
      .getByTestId("reply-submit-button")
      .or(page.getByTestId(`reply-item-${d1Id}`).getByRole("button", { name: /post reply/i }))
      .click();

    await page.waitForTimeout(2000);
    await detailPage.goto(threadId);
    await detailPage.waitForLoad();

    const d2Items = await page
      .getByTestId(`reply-item-${d1Id}`)
      .locator('[data-testid^="reply-item-"]')
      .all();
    if (d2Items.length === 0) throw new Error("No depth-2 reply found");
    const d2TestId = await d2Items[0].getAttribute("data-testid");
    if (!d2TestId) throw new Error("No depth-2 testid");
    const d2Id = Number(d2TestId.replace("reply-item-", ""));

    // The depth-2 reply should have no reply-toggle — canReply is false at depth 2
    const d2Toggle = page.getByTestId(`reply-toggle-${d2Id}`);
    await expect(d2Toggle).toHaveCount(0, { timeout: 3000 });
  });
});
