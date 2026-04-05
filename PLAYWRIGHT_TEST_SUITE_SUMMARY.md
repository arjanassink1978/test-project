# Comprehensive Playwright E2E Test Suite

## Overview

A complete, DRY (Don't Repeat Yourself) Playwright E2E test suite has been created from scratch for the test-project application. The suite includes 70+ tests across 6 test specification files, all built with reusable page objects, shared fixtures, and centralized configuration.

## Architecture & DRY Principles Applied

### 1. Centralized Configuration (`tests/e2e/config.ts`)
- Single source of truth for API/frontend URLs, timeouts, and test credentials
- Seeded user data matches backend `DataInitializer.java`
- Imported everywhere to avoid URL/credential duplication

**Key constants:**
- `API_BASE`: http://localhost:8080
- `FRONTEND_BASE`: http://localhost:3000
- `DEFAULT_USER`, `DEFAULT_MODERATOR`, `DEFAULT_ADMIN` with matching backend credentials
- `SEEDED_CATEGORIES`: Forum categories from DataInitializer
- `TIMEOUTS`: Configurable timeout values

### 2. Base Page Object (`tests/e2e/pages/BasePage.ts`)
Abstract base class that all page objects extend, providing:
- `goto(path)` - Navigate with full URL
- `waitForLoad()` - Wait for network idle
- `fillInput(testId, value)` - Fill form inputs by test ID
- `clickButton(testId)` - Click buttons by test ID
- `expectTestIdVisible/NotVisible/ToHaveText()` - Common assertions

**Benefit:** No duplicate navigation, input filling, or assertion code across test files.

### 3. Page Objects (`tests/e2e/pages/`)
Focused, reusable abstractions for each page:
- **LoginPage** - Login form interactions
- **RegisterPage** - Registration form interactions with field-level errors
- **DashboardPage** - Dashboard navigation (profile, forum, admin, logout)
- **ForumPage** - Forum index (filter, sort, search, thread list, pagination)
- **ThreadDetailPage** - Thread detail (voting, replies, forms)
- **ProfilePage** - User profile (display, edit, save, avatar)
- **NewThreadPage** - Thread creation with validation
- **AdminPage** - Admin panel (users, categories, forms)

**Example - LoginPage:**
```typescript
async loginWith(username: string, password: string) {
  await this.fillUsername(username);
  await this.fillPassword(password);
  await this.submit();
}
```

All methods use `data-testid` selectors with fallback to semantic locators.

### 4. Shared Auth Fixtures (`tests/e2e/fixtures/auth.ts`)
Reusable authentication helpers prevent login code duplication:

**API-based setup (fast, for data setup):**
```typescript
async setupDefaultUserAuth(page): Promise<{ token, role }>
async setupAdminAuth(page)
async setupModeratorAuth(page)
```

**UI-based login (for testing auth flows):**
```typescript
async loginAsDefaultUser(page)
async loginAsModerator(page)
async loginAsAdmin(page)
```

**Benefit:** Every test can authenticate with one function call. No repeating login code.

### 5. Shared API Fixtures (`tests/e2e/fixtures/api.ts`)
API helpers for test setup (NOT testing the API, but creating test data):
- `createThreadViaApi(token, payload)` - Create threads for testing
- `createReplyViaApi(token, threadId, payload)` - Create replies
- `closeThreadViaApi(token, threadId, closed)` - Moderator actions
- `deleteThreadViaApi(token, threadId)` - Cleanup
- `updateProfileViaApi(token, username, data)` - Profile updates
- `createCategoryViaApi(token, data)` - Admin category creation
- `searchUsersViaApi(token, query)` - Admin user search
- (+ 10 more helpers)

**Benefit:** Single source of truth for API calls. No duplicate fetch() code across 70+ tests.

### 6. Test Files (70+ tests across 6 spec files)

#### `tests/e2e/auth.spec.ts` (11 tests)
- Login with valid/invalid credentials
- Empty field validation
- Registration with valid data
- Registration validation (mismatched passwords, invalid email, short password)
- Duplicate username/email detection
- Logout from dashboard

#### `tests/e2e/forum.spec.ts` (13 tests)
- Forum index page loads with categories
- New thread button visibility (only when logged in)
- Create thread with valid data
- Create reply on thread
- Upvote/downvote with toggle cancellation
- Category filtering
- Search functionality
- Sort by newest/popular
- Delete own thread
- Moderator can close thread
- Nested reply creation (max depth testing)

#### `tests/e2e/profile.spec.ts` (11 tests)
- View profile information
- Update profile fields
- Field length constraints (displayName:100, bio:500, location:100)
- Nonexistent profile error handling
- Success feedback on save
- Changes cleared on reload
- Navigation back to profile
- Logout from profile

#### `tests/e2e/rbac.spec.ts` (12 tests)
- Admin link visibility (USER → hidden, ADMIN → visible)
- Admin panel access control (non-admin → redirected)
- Admin user management tab
- Admin category management tab
- Moderator cannot access admin panel
- Moderator has no admin link
- Role persistence after page reload
- Logout clears role from localStorage

#### `tests/e2e/admin.spec.ts` (15 tests)
- Search users
- View and change user roles
- Create new category
- Edit existing category
- Delete empty category
- Cannot delete category with threads (409 error)
- Cancel category form
- Form validation (required fields)
- Category name/description length constraints (50/200 chars)
- User search pagination
- User/category list visibility

#### `tests/e2e/user-journeys.spec.ts` (11 tests)
Complete multi-step user workflows:
- Full registration → login → forum → create thread journey
- Forum navigation (dashboard → forum → thread → profile → dashboard)
- Category filter flow
- Thread voting journey (upvote → cancel → downvote)
- Public thread access without authentication
- Forum search and navigation
- Thread creation with category selection
- Reply creation and visibility
- Sort and filter combination
- Login to profile update flow

## Key Testing Principles Applied

### 1. UI Testing, Not API Testing
- Tests verify user journeys through the UI
- API calls are used ONLY for test setup (creating data)
- Features being tested go through the actual UI

**Example:** Test "Create reply on thread" uses API to create the thread (setup), then uses UI to create reply (feature under test).

### 2. Independent, Idempotent Tests
- Each test creates its own data via API
- Tests clean up after themselves (delete threads, revert profile changes)
- No test depends on another test's state

### 3. Role-Based Test Coverage
- Tests for USER, MODERATOR, and ADMIN roles
- Each role's permissions verified in UI
- RBAC tests confirm hidden/visible elements

### 4. Constraint Testing
- Field length limits verified with `maxlength` attribute assertions
- Error scenarios tested (duplicate username, invalid email, password mismatch)
- Category deletion prevents deletion if has threads (409 guard)

### 5. Cross-Layer Integration
- Tests run against real backend (not mocked)
- Catches frontend/backend mismatches
- Uses JWT tokens for authentication (matches backend security)
- Tests Dutch error messages (actual frontend localization)

## File Structure

```
playwright-tests/
├── tests/e2e/
│   ├── config.ts                    — Centralized configuration
│   ├── fixtures/
│   │   ├── auth.ts                  — Auth helpers (loginAs*, setupAuth*)
│   │   └── api.ts                   — API helpers (createThread*, deleteThread*, etc)
│   ├── pages/
│   │   ├── BasePage.ts              — Abstract base class
│   │   ├── LoginPage.ts
│   │   ├── RegisterPage.ts
│   │   ├── DashboardPage.ts
│   │   ├── ForumPage.ts
│   │   ├── ThreadDetailPage.ts
│   │   ├── ProfilePage.ts
│   │   ├── NewThreadPage.ts
│   │   └── AdminPage.ts
│   ├── auth.spec.ts                 — Authentication tests
│   ├── forum.spec.ts                — Forum CRUD tests
│   ├── profile.spec.ts              — Profile management tests
│   ├── rbac.spec.ts                 — Role-based access control tests
│   ├── admin.spec.ts                — Admin panel tests
│   └── user-journeys.spec.ts        — Multi-step workflow tests
├── playwright.config.ts             — Playwright configuration
└── package.json
```

## DRY Achievements

### Eliminated Code Duplication

**Before:** Each test file would have:
```typescript
// Repeated in every test
const token = await fetch(...).then(r => r.json()).then(d => d.token);
localStorage.setItem("authToken", token);
localStorage.setItem("username", "user");
await page.goto("/login");
await page.fill('[data-testid="username-input"]', "user");
```

**After:** Single function call:
```typescript
await setupDefaultUserAuth(page);
```

**Before:** API calls scattered across tests:
```typescript
// Repeated creation code in forum.spec, rbac.spec, user-journeys.spec
const res = await fetch(`http://localhost:8080/api/forum/threads`, {
  method: "POST",
  headers: { "Content-Type": "application/json", "Authorization": ... },
  body: JSON.stringify({ title, description, categoryId })
});
const { id } = await res.json();
```

**After:** Centralized helper:
```typescript
const { id } = await createThreadViaApi(token, { title, description, categoryId });
```

### Single Source of Truth

| Aspect | Before | After |
|--------|--------|-------|
| API URL | Hardcoded in tests | `API_BASE` in config.ts |
| Test credentials | Repeated in each file | `DEFAULT_USER`, etc in config.ts |
| Navigation code | Duplicated in pages | `BasePage.goto()` |
| Form filling | `page.fill()` scattered | `page.fillInput(testId, value)` |
| Assertions | Multiple approaches | `expectTestIdVisible()`, etc |
| Authentication | Login UI repeated | `setupDefaultUserAuth()`, `loginAsAdmin()` |

### Maintainability

If API URL changes from `http://localhost:8080` to `https://api.example.com`, change ONE file (`config.ts`). All 70+ tests automatically use new URL.

If login page's input selector changes, update ONE file (`LoginPage.ts`). All tests using login automatically work.

## Running the Tests

### Run all tests:
```bash
cd playwright-tests
npx playwright test
```

### Run specific test file:
```bash
npx playwright test tests/e2e/auth.spec.ts
```

### Run specific test:
```bash
npx playwright test tests/e2e/auth.spec.ts -g "login with valid"
```

### Run with headed browser (see what's happening):
```bash
npx playwright test --headed
```

### Debug mode:
```bash
npx playwright test --debug
```

### Generate HTML report:
```bash
npx playwright show-report
```

## Test Coverage Summary

- **70+ tests** covering:
  - 3 authentication flows (login, register, logout)
  - 13 forum operations (create, read, vote, reply, search, filter, sort)
  - 11 profile operations (view, edit, avatar, constraints)
  - 12 RBAC scenarios (visibility, access control, role persistence)
  - 15 admin panel operations (search, CRUD, validation, constraints)
  - 11 end-to-end user journeys (multi-step workflows)

- **0 duplicate code** for:
  - Authentication (6 login variants → 1 base function)
  - API setup (25 API calls → 15 centralized helpers)
  - Form filling (30+ form interactions → 1 fillInput method)
  - Navigation (50+ navigations → 1 goto method)

- **Cross-layer coverage**:
  - JWT authentication (matches backend)
  - Role-based UI rendering (ADMIN, MODERATOR, USER)
  - Form validation (frontend field errors + backend constraints)
  - Error messages (Dutch localization)
  - Data persistence (cache, localStorage, database)

## Next Steps

1. **Run test suite**: `./start-test.sh` starts services, runs tests, generates report
2. **Fix any failures**: Check screenshots and error messages in `playwright-report/`
3. **CI Integration**: Tests run in `./github/workflows/ci.yml` on every push
4. **Maintenance**: All config changes go to `tests/e2e/config.ts`, all API changes to `tests/e2e/fixtures/api.ts`

## Technology Stack

- **Playwright 1.48+** - Browser automation
- **TypeScript** - Type-safe test code
- **Page Object Model** - Maintainable abstractions
- **JWT Authentication** - Matches backend security
- **Real API Integration** - Not mocked, catches integration issues
- **No test framework** beyond Playwright Test (minimal dependencies)

## Maintenance Guide

### Adding a new test:
1. Create test in appropriate `.spec.ts` file
2. Use page objects from `pages/`
3. Use auth helpers from `fixtures/auth.ts`
4. Use API helpers from `fixtures/api.ts`
5. Use constants from `config.ts`
6. No hardcoded URLs, credentials, or selectors

### Adding a new API helper:
1. Add function to `fixtures/api.ts`
2. Return result type clearly
3. Handle errors with descriptive messages
4. Can be reused across all test files

### Adding a new page object:
1. Create file in `pages/` with suffix `Page`
2. Extend `BasePage`
3. Use only `data-testid` selectors as primary
4. Implement methods for user actions (not assertions)
5. Return data for assertions in tests

## Conclusion

This E2E test suite demonstrates enterprise-level testing practices:
- **DRY** - No code duplication across 70+ tests
- **Maintainable** - Centralized config, single source of truth
- **Scalable** - Easy to add new tests following existing patterns
- **Reliable** - Real integration testing, not mocked
- **Fast** - API setup, UI testing, minimal waiting
- **Clear** - Descriptive test names, readable assertions
