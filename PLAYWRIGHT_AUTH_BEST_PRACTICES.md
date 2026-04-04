# Playwright Auth Strategy: Best Practices & Code Patterns

## Overview
This document shows the best practices for using the new auth strategy in Playwright E2E tests.

## Core Principle
**Separate Setup (API) from Testing (UI)**

- Use API calls for auth token setup (fast)
- Use API calls for test fixture data creation (fast)
- Use UI for testing actual features (real user experience)
- Never use API shortcuts for feature testing

## Pattern 1: Simple Auth Setup

### When to Use
When you need a logged-in user to test a feature (not the auth itself).

### Code Pattern
```typescript
import { test, expect } from "@playwright/test";
import { setupDefaultUserAuth, DEFAULT_USER } from "./fixtures/auth";
import { ForumPage } from "./pages/ForumPage";

test.describe("Forum Navigation", () => {
  test("user can navigate to forum when logged in", async ({ page }) => {
    // Setup: Auth via API (fast, no UI clicks)
    await setupDefaultUserAuth(page);

    // Setup: Navigate to page
    await page.goto("/forum");

    // Test: Feature via UI
    const forumPage = new ForumPage(page);
    await forumPage.waitForLoad();
    await expect(forumPage.getThreadList()).toBeVisible();
  });
});
```

### What It Does
1. Calls `POST /api/login` with Basic Auth
2. Sets auth token in localStorage
3. Sets auth token in sessionStorage
4. Test can now access protected pages

### Why This Is Better
- No UI login flow (90% faster)
- Still tests UI rendering correctly
- Failure in auth is clear error message
- Real token validation happens

## Pattern 2: Auth Setup in beforeEach

### When to Use
When multiple tests in a suite need the same authenticated user.

### Code Pattern
```typescript
test.describe("Profile Tests", () => {
  test.beforeEach(async ({ page }) => {
    // Setup once for all tests in this suite
    await setupDefaultUserAuth(page);
  });

  test("profile page displays user info", async ({ page }) => {
    // Auth already set up, go directly to feature
    await page.goto("/profile/user");
    // ... test the feature
  });

  test("profile page allows editing bio", async ({ page }) => {
    // Auth already set up, go directly to feature
    await page.goto("/profile/user");
    // ... test the feature
  });
});
```

### Benefit
- Auth setup happens once per test suite
- All tests start with clean auth state
- Faster than setting up auth in each test

## Pattern 3: Create Test Data via API

### When to Use
When you need to set up test fixtures (threads, replies, etc.) quickly.

### Code Pattern
```typescript
import { createThreadViaApi, createReplyViaApi } from "./fixtures/forum";
import { DEFAULT_USER } from "./fixtures/auth";

test("user can reply to an existing thread", async ({ page }) => {
  // Setup: Auth
  await setupDefaultUserAuth(page);

  // Setup: Create thread via API (fast, no UI navigation)
  const threadId = await createThreadViaApi(
    "Test Thread Title",
    "Test thread description",
    DEFAULT_USER
  );

  // Setup: Create parent reply via API (fast)
  const parentReplyId = await createReplyViaApi(
    threadId,
    "Parent reply content",
    DEFAULT_USER
  );

  // Test: Create nested reply via UI (the actual feature)
  const detailPage = new ThreadDetailPage(page);
  await detailPage.goto(threadId);
  await detailPage.waitForLoad();

  const replyToggle = detailPage.getReplyToggle(parentReplyId);
  await replyToggle.click();

  const nestedInput = page.getByTestId(`reply-item-${parentReplyId}`)
    .getByTestId("reply-content-input");
  await nestedInput.fill("Nested reply content");
  await nestedInput.parent().getByTestId("reply-submit-button").click();

  await expect(
    page.locator("text=Nested reply content")
  ).toBeVisible({ timeout: 10000 });
});
```

### Benefit
- Test fixtures created instantly via API
- No slow UI navigation to create test data
- Test focus stays on the feature being tested
- Much faster test execution

## Pattern 4: Testing Auth Features (UI Only)

### When to Use
When testing the actual login/register/logout features.

### Code Pattern
```typescript
import { LoginPage } from "./pages/LoginPage";

test.describe("Login Feature", () => {
  test("login with wrong password shows error", async ({ page }) => {
    // NO API SETUP - testing the auth feature itself

    const loginPage = new LoginPage(page);
    await loginPage.login("user", "wrongpassword");

    const error = page.getByTestId("login-error");
    await expect(error).toBeVisible({ timeout: 5000 });
    await expect(error).toContainText(/invalid|wrong/i);

    // Verify form stays usable to retry
    await loginPage.fillPassword("correctpassword");
    await loginPage.submit();
    await expect(page).toHaveURL(/\/dashboard/);
  });
});
```

### Why UI Only
- Testing actual login flow is the point
- Must verify UI error messages
- Must verify form behavior
- API shortcuts would skip the feature

## Pattern 5: Different User Roles

### When to Use
When testing role-based access (moderator, admin, regular user).

### Code Pattern
```typescript
import { setupAuthViaAPI } from "./fixtures/auth";

const MODERATOR = { username: "moderator", password: "moderator1234" };
const USER = { username: "user", password: "user1234" };

test.describe("RBAC Tests", () => {
  test("moderator can close threads", async ({ page }) => {
    // Setup: Auth as moderator
    await setupAuthViaAPI(page, MODERATOR);

    // Test: Moderator feature via UI
    const detailPage = new ThreadDetailPage(page);
    await detailPage.goto(threadId);
    await expect(detailPage.getCloseThreadButton()).toBeVisible();
    await detailPage.getCloseThreadButton().click();
    await expect(detailPage.getClosedBadge()).toBeVisible();
  });

  test("regular user cannot close threads", async ({ page }) => {
    // Setup: Auth as regular user
    await setupAuthViaAPI(page, USER);

    // Test: Verify button not visible via UI
    const detailPage = new ThreadDetailPage(page);
    await detailPage.goto(threadId);
    await expect(detailPage.getCloseThreadButton()).not.toBeVisible();
  });
});
```

### Benefit
- Test role-based features cleanly
- Each test gets correct role without UI login
- Failures are clear (feature not visible or error)

## Pattern 6: Mock API for Error Scenarios

### When to Use
When testing error handling for unusual 4xx/5xx responses.

### Code Pattern
```typescript
test("profile update shows error when API returns 500", async ({ page }) => {
  // Setup: Auth
  await setupDefaultUserAuth(page);

  // Setup: Mock the profile update endpoint to return error
  await page.route("**/api/profile/**", async (route, request) => {
    if (request.method() === "PUT") {
      await route.fulfill({
        status: 500,
        contentType: "application/json",
        body: JSON.stringify({ message: "Server error" }),
      });
    } else {
      await route.continue();
    }
  });

  // Test: Feature handling of error
  await page.goto("/profile/user");
  const profilePage = new ProfilePage(page);
  await profilePage.fillEditForm("New Name", "New bio", "New city");
  await profilePage.saveProfile();

  const alert = profilePage.getAlertBanner();
  await expect(alert).toBeVisible({ timeout: 10000 });
  await expect(alert).not.toContainText(/success/i);
});
```

### Why This Is Good
- Tests real error handling paths
- Mocks only unusual scenarios
- Normal happy path uses real API
- Cleaner than trying to trigger real 500 errors

## Common Pitfalls to Avoid

### ❌ DON'T: Use API shortcuts for feature testing
```typescript
// BAD: Tests nothing about the UI
test("user can like a post", async ({ page }) => {
  const likeResponse = await fetch(
    `${API_BASE}/api/posts/${postId}/like`,
    { headers: { "Authorization": `Bearer ${token}` } }
  );
  expect(likeResponse.ok).toBe(true);
});
```

### ✅ DO: Test through UI
```typescript
// GOOD: Tests actual UI interaction
test("user can like a post via UI", async ({ page }) => {
  await setupDefaultUserAuth(page);
  await page.goto(`/posts/${postId}`);
  const likeButton = page.getByTestId("like-button");
  await likeButton.click();
  await expect(likeButton).toHaveClass(/liked/);
});
```

### ❌ DON'T: Set up auth via UI for every test
```typescript
// SLOW: Each test repeats login
test("forum shows threads", async ({ page }) => {
  const loginPage = new LoginPage(page);
  await loginPage.login(USER.username, USER.password);
  // ... now test forum
});

test("forum has search", async ({ page }) => {
  const loginPage = new LoginPage(page);
  await loginPage.login(USER.username, USER.password);
  // ... now test search
});
```

### ✅ DO: Set up auth via API
```typescript
// FAST: Auth via API once
test.beforeEach(async ({ page }) => {
  await setupDefaultUserAuth(page);
});

test("forum shows threads", async ({ page }) => {
  await page.goto("/forum");
  // ... test forum
});

test("forum has search", async ({ page }) => {
  await page.goto("/forum");
  // ... test search
});
```

### ❌ DON'T: Forget to await async setup
```typescript
// WRONG: Auth not complete before test runs
test("profile displays", async ({ page }) => {
  setupDefaultUserAuth(page);  // Missing await!
  await page.goto("/profile/user");
  // May fail because auth not set yet
});
```

### ✅ DO: Always await setup
```typescript
// CORRECT: Auth complete before navigation
test("profile displays", async ({ page }) => {
  await setupDefaultUserAuth(page);  // Await!
  await page.goto("/profile/user");
  // Auth definitely complete
});
```

## Available Test Fixtures

### Auth Fixtures (fixtures/auth.ts)

```typescript
// Set up auth via API using Basic Auth
await setupAuthViaAPI(page, { username: "user", password: "pass" });

// Convenience wrapper for default test user
await setupDefaultUserAuth(page);

// UI login (for testing auth feature itself)
await loginAsDefaultUser(page);

// Default test user credentials
const user = DEFAULT_USER;  // { username: "user", password: "user1234" }
```

### Forum Fixtures (fixtures/forum.ts)

```typescript
// Create thread via API
const threadId = await createThreadViaApi(
  "Thread Title",
  "Thread description",
  { username: "user", password: "pass" }
);

// Create reply via API
const replyId = await createReplyViaApi(
  threadId,
  "Reply content",
  { username: "user", password: "pass" },
  parentReplyId  // Optional, for nested replies
);

// Close thread via API (admin only)
await closeThreadViaApi(threadId, { username: "admin", password: "pass" });

// Delete thread via API
await deleteThreadViaApi(threadId, { username: "user", password: "pass" });
```

## Test Execution Timeline Comparison

### Old Way (UI Login in Every Test)
```
Test 1: Navigate /login → fill form → wait redirect → test feature (5-10s)
Test 2: Navigate /login → fill form → wait redirect → test feature (5-10s)
Test 3: Navigate /login → fill form → wait redirect → test feature (5-10s)
Total: 15-30s just for logging in × N tests
```

### New Way (API Auth Setup)
```
Test 1: API /login call (0.1s) → test feature (2-5s)
Test 2: API /login call (0.1s) → test feature (2-5s)
Test 3: API /login call (0.1s) → test feature (2-5s)
Total: 0.3s setup × N tests vs 15-30s
Savings: 20-25% faster
```

## Summary

### Use API for:
- ✅ Auth token setup (fast)
- ✅ Creating test fixtures (threads, replies, users)
- ✅ Admin/moderator actions for test setup
- ✅ Cleanup/teardown
- ✅ Mocking error scenarios

### Use UI for:
- ✅ Testing login/register features
- ✅ Testing profile editing
- ✅ Testing forum features (create, reply, vote)
- ✅ Testing any user-facing feature
- ✅ Verifying UI error messages
- ✅ Checking accessibility and layout

### Result
- Faster tests (20-25% improvement)
- Cleaner test code
- Better separation of concerns
- Catches real user issues via UI
- Still validates auth via API
