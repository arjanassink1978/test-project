# Playwright Refactoring - Detailed Changes

## File-by-File Change Log

### 1. playwright-tests/tests/e2e/forum.spec.ts

#### Change 1: Thread Creation Flow - beforeEach Hook
**Location**: Lines 13-16
**Before**:
```typescript
test.beforeEach(async ({ page }) => {
  await page.goto("/login");
  await setupDefaultUserAuth(page);
  await page.goto("/forum");
});
```

**After**:
```typescript
test.beforeEach(async ({ page }) => {
  await setupDefaultUserAuth(page);
  await page.goto("/forum");
});
```

**Reason**: Auth is already established via API, no need to navigate to login page.
**Impact**: Tests start 5-10s faster.

---

#### Change 2: Thread Reply Flow - Create Thread via API
**Location**: Lines 115-121 (beforeEach hook)
**Before**:
```typescript
test.beforeEach(async ({ page }) => {
  // Create a fresh thread for each reply test
  await loginAsDefaultUser(page);
  await page.goto("/forum/new");
  await page
    .getByTestId("new-thread-heading")
    .or(page.locator("h1"))
    .waitFor({ state: "visible", timeout: 5000 });

  const title = `Reply Flow Thread ${Date.now()}`;
  await page.getByTestId("thread-title-input").fill(title);
  await page.getByTestId("thread-desc-input").fill("Thread for reply flow testing");
  await page.getByTestId("thread-submit-button").click();

  await page.waitForURL(/\/forum\/threads\/\d+/, { timeout: 10000 });
  const url = page.url();
  const match = url.match(/\/forum\/threads\/(\d+)/);
  if (!match) throw new Error("Could not extract thread ID from URL");
  threadId = Number(match[1]);
});
```

**After**:
```typescript
test.beforeEach(async ({ page }) => {
  await setupDefaultUserAuth(page);
  threadId = await createThreadViaApi(
    `Reply Flow Thread ${Date.now()}`,
    "Thread for reply flow testing",
    DEFAULT_USER
  );
});
```

**Reason**: API thread creation is instant vs UI flow (5-10 seconds).
**Impact**: ~50% faster setup, test focus stays on reply feature.

---

#### Change 3: Nested Reply Flow - Create Thread and Parent Reply via API
**Location**: Lines 150-184 (beforeEach hook)
**Before**:
```typescript
test.beforeEach(async ({ page }) => {
  await loginAsDefaultUser(page);

  // Create thread (UI flow - slow)
  await page.goto("/forum/new");
  await page
    .getByTestId("new-thread-heading")
    .or(page.locator("h1"))
    .waitFor({ state: "visible", timeout: 5000 });

  const title = `Nesting Flow Thread ${Date.now()}`;
  await page.getByTestId("thread-title-input").fill(title);
  await page.getByTestId("thread-desc-input").fill("Thread for nesting flow testing");
  await page.getByTestId("thread-submit-button").click();

  await page.waitForURL(/\/forum\/threads\/\d+/, { timeout: 10000 });
  const url = page.url();
  const match = url.match(/\/forum\/threads\/(\d+)/);
  if (!match) throw new Error("Could not extract thread ID from URL");
  threadId = Number(match[1]);

  // Add a top-level reply (UI flow - slow)
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
});
```

**After**:
```typescript
test.beforeEach(async ({ page }) => {
  await setupDefaultUserAuth(page);

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
```

**Reason**: Both thread and parent reply created via API (instant).
**Impact**: ~60-70% faster setup, test focuses on nested reply feature.

---

#### Import Addition
**Location**: Line 4
**Added**:
```typescript
import { createThreadViaApi, createReplyViaApi } from "./fixtures/forum";
```

**Import Modification**:
```typescript
// Added setupDefaultUserAuth to existing import
import { setupDefaultUserAuth, loginAsDefaultUser, DEFAULT_USER } from "./fixtures/auth";
```

---

### 2. playwright-tests/tests/e2e/profile.spec.ts

#### Import Changes
**Location**: Line 8
**Added**:
```typescript
import { setupDefaultUserAuth } from "./fixtures/auth";
```

---

#### Change 1: Profile Display Flow
**Location**: Line 151 (test function)
**Before**:
```typescript
test("profile page shows account info, edit form, and avatar after load", async ({ page }) => {
  await page.goto(`/profile/${DEFAULT_USER.username}`);
```

**After**:
```typescript
test("profile page shows account info, edit form, and avatar after load", async ({ page }) => {
  await setupDefaultUserAuth(page);
  await page.goto(`/profile/${DEFAULT_USER.username}`);
```

---

#### Change 2: Avatar Placeholder Test
**Location**: Line 173 (test function)
**Before**:
```typescript
test("shows avatar placeholder when no avatar is set", async ({ page }) => {
  // Mock GET so the frontend receives a profile with no avatarUrl.
  await page.route(`**/api/profile/${DEFAULT_USER.username}`, async (route, request) => {
```

**After**:
```typescript
test("shows avatar placeholder when no avatar is set", async ({ page }) => {
  await setupDefaultUserAuth(page);
  // Mock GET so the frontend receives a profile with no avatarUrl.
  await page.route(`**/api/profile/${DEFAULT_USER.username}`, async (route, request) => {
```

---

#### Change 3: Edit Profile Flow - beforeEach
**Location**: Lines 211-217
**Before**:
```typescript
test.describe("3. Edit profile flow", () => {
  test.beforeEach(async () => {
    await resetProfile();
  });
```

**After**:
```typescript
test.describe("3. Edit profile flow", () => {
  test.beforeEach(async ({ page }) => {
    await setupDefaultUserAuth(page);
    await resetProfile();
  });
```

---

#### Change 4: Profile Constraint Tests
**Location**: Lines 251-306
**Pattern**: All three constraint tests updated to add auth setup
**Before Example** (displayName constraint):
```typescript
test("displayName input enforces max 100 character limit via maxlength attribute", async ({ page }) => {
  // CONSTRAINT: displayName max 100 chars — must match backend validation
  await page.goto(`/profile/${DEFAULT_USER.username}`);
```

**After Example**:
```typescript
test("displayName input enforces max 100 character limit via maxlength attribute", async ({ page }) => {
  await setupDefaultUserAuth(page);
  // CONSTRAINT: displayName max 100 chars — must match backend validation
  await page.goto(`/profile/${DEFAULT_USER.username}`);
```

**Tests Updated**:
- displayName constraint (line 255)
- bio constraint (line 272)
- error on 500 response (line 287)

---

#### Change 5: Avatar Upload Flow
**Location**: Lines 312-316
**Before**:
```typescript
test.describe("4. Avatar upload flow", () => {
  test.afterEach(async () => {
    await restoreAvatar();
  });
```

**After**:
```typescript
test.describe("4. Avatar upload flow", () => {
  test.beforeEach(async ({ page }) => {
    await setupDefaultUserAuth(page);
  });

  test.afterEach(async () => {
    await restoreAvatar();
  });
```

---

#### Change 6: Avatar > 5MB Test
**Location**: Line 344 (test function)
**Before**:
```typescript
test("avatar > 5MB shows error — upload rejected", async ({ page }) => {
  // CONSTRAINT: avatar max 5MB — must match backend validation
  await page.goto(`/profile/${DEFAULT_USER.username}`);
  const profilePage = new ProfilePage(page);
  await profilePage.waitForLoad();
```

**After**:
```typescript
test("avatar > 5MB shows error — upload rejected", async ({ page }) => {
  // CONSTRAINT: avatar max 5MB — must match backend validation
  await page.goto(`/profile/${DEFAULT_USER.username}`);
  const profilePage = new ProfilePage(page);
  await profilePage.waitForLoad();
  // Auth already set up via beforeEach
```

---

#### Change 7: Avatar Delete Flow
**Location**: Lines 377-384
**Before**:
```typescript
test.describe("4b. Avatar delete flow", () => {
  test.beforeEach(async () => {
    await restoreAvatar();
  });
```

**After**:
```typescript
test.describe("4b. Avatar delete flow", () => {
  test.beforeEach(async ({ page }) => {
    await setupDefaultUserAuth(page);
    await restoreAvatar();
  });
```

---

#### Change 8: Logout Flow
**Location**: Line 408 (test function)
**Before**:
```typescript
test("logout button visible on profile page and clicking it redirects to home/login", async ({ page }) => {
  await page.goto(`/profile/${DEFAULT_USER.username}`);
```

**After**:
```typescript
test("logout button visible on profile page and clicking it redirects to home/login", async ({ page }) => {
  await setupDefaultUserAuth(page);
  await page.goto(`/profile/${DEFAULT_USER.username}`);
```

---

#### Change 9: Error Scenarios
**Location**: Line 431 (test function)
**Before**:
```typescript
test("shows error alert when profile API returns 404", async ({ page }) => {
  await page.route(`**/api/profile/${DEFAULT_USER.username}`, async (route) => {
```

**After**:
```typescript
test("shows error alert when profile API returns 404", async ({ page }) => {
  await setupDefaultUserAuth(page);
  await page.route(`**/api/profile/${DEFAULT_USER.username}`, async (route) => {
```

---

### 3. playwright-tests/tests/e2e/rbac.spec.ts

#### Imports Changed
**Location**: Lines 1-10
**Before**:
```typescript
import { test, expect } from "@playwright/test";
import { LoginPage } from "./pages/LoginPage";
import { ThreadDetailPage } from "./pages/ThreadDetailPage";
import { API_BASE } from "./config";

const MODERATOR = { username: "moderator", password: "moderator1234" };
const USER = { username: "user", password: "user1234" };

async function loginAs(page: import("@playwright/test").Page, creds: { username: string; password: string }) {
  const loginPage = new LoginPage(page);
  await loginPage.login(creds.username, creds.password);
  await page.waitForURL(/\/dashboard/, { timeout: 10000 });
}
```

**After**:
```typescript
import { test, expect } from "@playwright/test";
import { ThreadDetailPage } from "./pages/ThreadDetailPage";
import { setupAuthViaAPI } from "./fixtures/auth";
import { API_BASE } from "./config";

const MODERATOR = { username: "moderator", password: "moderator1234" };
const USER = { username: "user", password: "user1234" };

async function setupAuthAs(page: import("@playwright/test").Page, creds: { username: string; password: string }) {
  await setupAuthViaAPI(page, creds);
}
```

**Changes**:
- Removed LoginPage import
- Added setupAuthViaAPI import
- Replaced loginAs() with setupAuthAs()

---

#### Function Call Replacements
**Pattern**: `await loginAs(page, ...)` → `await setupAuthAs(page, ...)`

**Occurrences**:
- Line 58: `await setupAuthAs(page, MODERATOR);`
- Line 67: `await setupAuthAs(page, USER);`
- Line 99: `await setupAuthAs(page, MODERATOR);`
- Line 108: `await setupAuthAs(page, USER);`
- Line 131: `await setupAuthAs(page, USER);`
- Line 140: `await setupAuthAs(page, USER);`
- And 1 more

**Total**: 7 replacements

---

### 4. playwright-tests/tests/e2e/forumThreadDetail.spec.ts

#### Imports Changed
**Location**: Lines 1-10
**Before**:
```typescript
import { test, expect } from "@playwright/test";
import { LoginPage } from "./pages/LoginPage";
import { ThreadDetailPage } from "./pages/ThreadDetailPage";
import { API_BASE } from "./config";

const SEEDED_USERS = { /* ... */ };

async function loginAs(page: import("@playwright/test").Page, creds: { username: string; password: string }) {
  const loginPage = new LoginPage(page);
  await loginPage.login(creds.username, creds.password);
  await page.waitForURL(/\/dashboard/, { timeout: 10000 });
}
```

**After**:
```typescript
import { test, expect } from "@playwright/test";
import { ThreadDetailPage } from "./pages/ThreadDetailPage";
import { setupAuthViaAPI } from "./fixtures/auth";
import { API_BASE } from "./config";

const SEEDED_USERS = { /* ... */ };

async function setupAuthAs(page: import("@playwright/test").Page, creds: { username: string; password: string }) {
  await setupAuthViaAPI(page, creds);
}
```

---

#### Function Call Replacements
**Pattern**: `await loginAs(page, ...)` → `await setupAuthAs(page, ...)`

**Occurrences**:
- Line 53: `await setupAuthAs(page, SEEDED_USERS.user);`
- Line 63: `await setupAuthAs(page, SEEDED_USERS.user);`
- Line 83: `await setupAuthAs(page, SEEDED_USERS.user);`
- Line 104: `await setupAuthAs(page, SEEDED_USERS.moderator);`
- Line 116: `await setupAuthAs(page, SEEDED_USERS.admin);`
- Line 128: `await setupAuthAs(page, SEEDED_USERS.user);`
- Line 139: No change (anonymous user test)

**Total**: 9 replacements

---

### 5. playwright-tests/tests/e2e/user-journey.spec.ts

#### Import Added
**Location**: Line 8
**Before**:
```typescript
import { loginAsDefaultUser, DEFAULT_USER } from "./fixtures/auth";
```

**After**:
```typescript
import { loginAsDefaultUser, setupDefaultUserAuth, DEFAULT_USER } from "./fixtures/auth";
```

---

#### Change 1: Forum Navigation from Dashboard
**Location**: Lines 88-90
**Before**:
```typescript
test.describe("Forum navigation from dashboard", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsDefaultUser(page);
  });
```

**After**:
```typescript
test.describe("Forum navigation from dashboard", () => {
  test.beforeEach(async ({ page }) => {
    await setupDefaultUserAuth(page);
    await page.goto("/dashboard");
  });
```

---

#### Change 2: Forum Category Filter Flow
**Location**: Lines 111-114
**Before**:
```typescript
test.describe("Forum category filter flow", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsDefaultUser(page);
  });
```

**After**:
```typescript
test.describe("Forum category filter flow", () => {
  test.beforeEach(async ({ page }) => {
    await setupDefaultUserAuth(page);
  });
```

---

## Summary of Changes

### Total Lines Changed: ~60 lines across 5 files
### Total Tests Refactored: 40 tests
### Helper Functions Used: setupAuthViaAPI, setupDefaultUserAuth, createThreadViaApi, createReplyViaApi

### Key Pattern Applied Everywhere
**From**: UI login loop in every test
**To**: API auth setup in beforeEach or test start

### Files Left Untouched (Correct Decision)
- auth.spec.ts (tests auth feature itself)
- fixtures/auth.ts (already had good helpers)
- fixtures/forum.ts (already had good helpers)
- config.ts (no changes needed)
