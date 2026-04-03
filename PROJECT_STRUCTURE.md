# Project Structure Index

**Last Updated:** 2026-04-03 (Role-based access control: USER, MODERATOR, ADMIN roles; close thread, delete reply, list users endpoints)
**Important:** When agents add new files/components, they MUST update this file.

---

## Backend (Spring Boot 3.x, Java 21)

**Package Root:** `techchamps.io`
**Location:** `backend/src/main/java/techchamps/io/`

### Controllers
- `AuthController.java` - Login (`POST /api/auth/login`) and Register (`POST /api/auth/register`) endpoints
- `ForumController.java` - Forum endpoints:
  - `GET /api/forum/categories` — list all categories (public)
  - `GET /api/forum/threads?category=&sort=newest&page=0&search=` — paginated threads (public)
  - `GET /api/forum/threads/{id}` — thread detail with replies (public)
  - `POST /api/forum/threads` — create thread (auth required, HTTP Basic)
  - `POST /api/forum/threads/{threadId}/replies` — create reply (auth)
  - `POST /api/forum/replies/{replyId}/replies` — create nested reply (auth, max depth 3)
  - `POST /api/forum/posts/{postId}/vote?postType=thread` — vote (auth)
  - `DELETE /api/forum/threads/{id}` — delete own thread or admin (auth)
  - `POST /api/forum/threads/{id}/close?closed=true` — close/reopen thread (MODERATOR/ADMIN)
  - `DELETE /api/forum/replies/{id}` — delete reply (MODERATOR/ADMIN)
- `UserController.java` - Admin user management:
  - `GET /api/users` — list all users (ADMIN only)
- `ProfileController.java` - User profile management:
  - `GET /api/profile/{username}` - Get profile (200 / 404)
  - `PUT /api/profile/{username}` - Update profile fields (200 / 404)
  - `POST /api/profile/{username}/avatar` - Upload avatar as multipart file (200 / 404)
  - `DELETE /api/profile/{username}/avatar` - Remove avatar (200 / 404)

### Services
- `service/ProfileService.java` - Business logic for profile CRUD and avatar upload/delete
- `service/ForumService.java` - Forum business logic: threads, replies (max depth 3), voting (upsert), categories

### DTOs
- **Request:**
  - `dto/request/LoginRequest.java` - username, password
  - `dto/request/RegisterRequest.java` - email, username, password (with Bean Validation)
  - `dto/request/UpdateProfileRequest.java` - displayName, bio, location (optional, with @Size validation)
  - `dto/request/CreateThreadRequest.java` - title (max 200), description (max 5000), categoryId
  - `dto/request/CreateReplyRequest.java` - content (max 2000), parentReplyId (nullable)
  - `dto/request/VoteRequest.java` - voteValue (-1, 0, or 1)
  - *(Add new request DTOs here)*
- **Response:**
  - `dto/response/LoginResponse.java` - success, message, username (nullable; populated on successful login)
  - `dto/response/RegisterResponse.java` - id, email, username, success, message
  - `dto/response/ProfileResponse.java` - id, email, username, displayName, bio, location, avatarUrl
  - `dto/response/AvatarUploadResponse.java` - avatarUrl, message
  - `dto/response/ForumCategoryResponse.java` - id, name, description, icon
  - `dto/response/ForumThreadResponse.java` - id, title, description, score, createdAt, updatedAt, authorUsername, categoryId, categoryName, replyCount
  - `dto/response/ForumThreadDetailResponse.java` - extends ForumThreadResponse + replies list
  - `dto/response/ForumReplyResponse.java` - id, content, score, createdAt, authorUsername, depth, parentReplyId, replies (nested)
  - `dto/response/PagedThreadsResponse.java` - threads, page, size, hasMore
  - `dto/response/VoteResponse.java` - postId, postType, newScore, userVote
  - `dto/response/UserSummaryResponse.java` - id, username, email, role (admin user listing)
  - `dto/response/LoginResponse.java` now includes `role` field (USER/MODERATOR/ADMIN)
  - *(Add new response DTOs here)*

### Models (JPA Entities)
- `model/AppUser.java` - User entity with id, email (unique), username (unique), password, role, displayName, bio, location, avatarUrl
- `model/ForumCategory.java` - id, name (unique), description, icon
- `model/ForumThread.java` - id, author (AppUser), title (max 200), description (max 5000), category (ForumCategory), createdAt, updatedAt, score
- `model/ForumReply.java` - id, thread, parentReply (nullable), author, content (max 2000), createdAt, score, depth
- `model/Role.java` - Role enum: USER, MODERATOR, ADMIN
- `model/ForumVote.java` - id, voter (AppUser), postId, postType, voteValue; unique on (voter, postId, postType)

### Repositories
- `repository/AppUserRepository.java` - JPA repository for AppUser
- `repository/ForumCategoryRepository.java` - JPA repository for ForumCategory
- `repository/ForumThreadRepository.java` - includes findByCategoryId, search by title/description, countRepliesByThreadId
- `repository/ForumReplyRepository.java` - includes findByThreadIdAndParentReplyIsNull, findByParentReplyId
- `repository/ForumVoteRepository.java` - includes findByVoterUsernameAndPostIdAndPostType

### Security
- `security/DatabaseUserDetailsService.java` - Spring Security user details loader
- `config/SecurityConfig.java` - Security config: HTTP Basic auth enabled, GET /api/forum/** is public, POST/DELETE require auth
- `config/CorsConfig.java` - CORS configuration

### Config
- `config/DataInitializer.java` - Initial data setup
- `BackendApplication.java` - Spring Boot main class

### Testing
- `src/test/java/techchamps/io/` - Unit tests
  - `controller/AuthControllerTest.java` - Auth controller tests
  - `controller/ProfileControllerTest.java` - Profile controller tests (12 tests)
  - `service/ProfileServiceTest.java` - Profile service tests (10 tests)
  - `config/DataInitializerTest.java` - Data initializer tests
  - `config/CorsConfigTest.java` - CORS config tests
  - `security/DatabaseUserDetailsServiceTest.java` - User details service tests
  - `model/AppUserTest.java` - AppUser model tests

---

## Frontend (Next.js 14, TypeScript)

**Location:** `frontend/`

### Pages (App Router)
- `app/page.tsx` - Home page
- `app/layout.tsx` - Root layout
- `app/login/page.tsx` - Login page; `data-testid`: `login-heading`
- `app/register/page.tsx` - Register page; `data-testid`: `register-heading`
- `app/dashboard/page.tsx` - Dashboard: top nav bar with ProfileLink + ForumLink + LogoutButton, centered "Welkom op deze site" heading; `data-testid`: `welcome-heading`, `forum-link`
- `app/profile/[username]/page.tsx` - Profile page; delegates to `ProfileForm`
- `app/forum/page.tsx` - Forum index: thread list with category filter, sort, search; New Thread button; `data-testid`: `forum-page`, `forum-heading`, `new-thread-button`, `sort-select`, `search-input`
- `app/forum/new/page.tsx` - Create thread page (requires login); `data-testid`: `new-thread-page`, `new-thread-heading`
- `app/forum/threads/[id]/page.tsx` - Thread detail with replies and voting; `data-testid`: `thread-detail-page`, `thread-detail-title`, `thread-detail-desc`, `thread-detail-score`, `thread-detail-author`, `replies-section`
- *(Add new pages here)*

### Components
- `components/LoginForm.tsx` - Login form component; `data-testid`: `login-form`, `username-input`, `password-input`, `login-button`, `login-error`, `register-link`
- `components/RegisterForm.tsx` - Registration form component; `data-testid`: `register-form`, `email-input`, `username-input`, `password-input`, `confirm-password-input`, `register-button`, `register-error`, `login-link`
- `components/LogoutButton.tsx` - Logout button; clears `localStorage["username"]` and navigates to `/`; `data-testid`: `logout-button`
- `components/ProfileLink.tsx` - Link to `/profile/{username}`, reads username from localStorage; `data-testid`: `profile-link`
- `components/ProfileForm.tsx` - Full profile edit form (avatar, account info, editable fields); `data-testid`: `profile-heading`, `profile-alert`, `avatar-section`, `avatar-image`, `avatar-placeholder`, `avatar-upload-input`, `avatar-upload-label`, `delete-avatar-button`, `account-info-section`, `profile-username`, `profile-email`, `edit-profile-section`, `edit-profile-form`, `display-name-input`, `bio-input`, `location-input`, `save-button`
- `components/ForumCategoryFilter.tsx` - Category filter buttons; `data-testid`: `category-filter`, `category-option-{id}`, `category-option-all`
- `components/VoteButtons.tsx` - Upvote/downvote with score display; `data-testid`: `vote-buttons`, `upvote-button`, `downvote-button`, `vote-score`
- `components/ThreadList.tsx` - Paginated thread list (score <-5 shown collapsed); `data-testid`: `thread-list`, `thread-item-{id}`, `thread-title-{id}`, `thread-score-{id}`, `load-more-button`
- `components/ThreadForm.tsx` - Thread creation form with char counters; `data-testid`: `thread-form`, `thread-title-input`, `thread-desc-input`, `thread-category-select`, `thread-submit-button`, `thread-form-error`, `thread-title-counter`, `thread-desc-counter`
- `components/ReplyForm.tsx` - Reply composer (disabled at max depth 3); `data-testid`: `reply-form`, `reply-content-input`, `reply-submit-button`, `reply-form-error`, `reply-content-counter`
- `components/ReplyItem.tsx` - Recursive reply renderer with nested voting and reply; `data-testid`: `reply-item-{id}`, `reply-content-{id}`, `reply-author-{id}`, `reply-toggle-{id}`
- *(Add new components here)*

### Component Unit Tests
- `components/LoginForm.test.tsx` - 22 tests: render, data-testid, onChange handlers, fetch URL/method/body, localStorage, redirect, error states, loading state
- `components/RegisterForm.test.tsx` - 9 tests: render, data-testid, validation, error states, loading state
- `components/LogoutButton.test.tsx` - 5 tests: render, data-testid, navigation, localStorage
- `components/ProfileLink.test.tsx` - 4 tests: render, data-testid, href construction
- `components/ProfileForm.test.tsx` - 40 tests: loading, profile data, onChange handlers, boundary validation, save/delete/upload avatar flows, error paths, alert styling
- `components/ForumCategoryFilter.test.tsx` - 15 tests: render, All button, category buttons, onChange with exact values, className for selected/unselected, rerender
- `components/VoteButtons.test.tsx` - 9 tests: render, data-testid, score colors, click handlers, disabled state, badge layout
- `components/ReplyItem.test.tsx` - 19 tests: render, data-testid, author header, avatar initials, vote badge, reply toggle, collapse/expand, nesting border, hidden score threshold

### Libraries
- `lib/api.ts` - All API calls (auth, profile, avatar, forum: getForumCategories, getForumThreads, getForumThread, createForumThread, createForumReply, voteOnPost)
- `lib/forumConstants.ts` - Cross-layer forum constraints: THREAD_TITLE_MAX=200, THREAD_DESC_MAX=5000, REPLY_CONTENT_MAX=2000, MAX_REPLY_DEPTH=3, PAGE_SIZE=20, HIDDEN_SCORE_THRESHOLD=-5
- `lib/theme.ts` - Centralized design tokens: colors, typography, spacing, borders, shadows, and composite className patterns (alert, card, input, button, nav, avatar, link, profileLink). Import named exports (`alert`, `button`, `card`, `input`, `typography`, `nav`, `avatar`, `link`, `profileLink`, `colors`, `spacing`, `borders`, `shadows`, `states`) in components instead of writing Tailwind strings inline.

### Configuration
- `next.config.ts` - Next.js config
- `tsconfig.json` - TypeScript config
- `tailwind.config.js` - Tailwind CSS config
- `postcss.config.mjs` - PostCSS config

---

## Integration Tests (RestAssured)

**Package Root:** `techchamps.io`
**Location:** `restassured-tests/src/test/java/techchamps/io/`

### Test Files
- `AuthControllerIT.java` - Tests for login endpoint
- `CorsIT.java` - CORS tests
- `SecurityConfigIT.java` - Security tests
- `controller/AuthControllerIntegrationTest.java` - Extended auth tests
- `RegistrationIT.java` - Integration tests for registration endpoint
- `RoleBasedAccessControlIT.java` - 14 integration tests for RBAC: close thread (user=403, mod=200, admin=200), closed thread rejects replies, delete reply (user=403, mod=204), list users (user=403, mod=403, admin=200)
- `ForumThreadIT.java` - 21 integration tests for forum: categories, threads CRUD, boundary tests (title 200/201, desc 5000/5001, reply 2000/2001), depth boundary (depth 2 passes, depth 3 rejected), voting, delete 204/403

### Test Builders
- `builder/LoginRequestBuilder.java` - Builder for LoginRequest
- `builder/RegisterRequestBuilder.java` - Builder for RegisterRequest
- `builder/CreateThreadRequestBuilder.java` - Builder for CreateThreadRequest
- `builder/CreateReplyRequestBuilder.java` - Builder for CreateReplyRequest

### Testing
- Uses `@SpringBootTest(webEnvironment = RANDOM_PORT)`
- RestAssured 5.x for HTTP testing
- JUnit 5, AssertJ for assertions
- H2 in-memory database

---

## E2E Tests (Playwright)

**Location:** `playwright-tests/`
**Config:** `playwright-tests/playwright.config.ts` — baseURL: http://localhost:3000, headless Chromium, retries enabled in CI, HTML + JUnit reporters
**Run:** `cd playwright-tests && npm test`
**Reports:** Generated in `playwright-tests/playwright-report/` (HTML) and `playwright-tests/test-results/junit.xml` (JUnit)

### Test Files
- `tests/e2e/profile.spec.ts` - User Profile Page Flow (23 tests); happy-path tests use real API calls (no mocks); mocks kept only for error scenarios (404, 500) and the no-avatar edge case
- `tests/e2e/forum.spec.ts` - Forum E2E tests: index page (public + auth), thread detail, create thread flow, reply flow, search; all happy-path tests use real API calls via backend on port 8080
- `tests/e2e/auth.spec.ts` - Auth E2E tests (11 tests): login wrong credentials, nonexistent user, empty fields, register-to-login link, full registration happy path, mismatched passwords, invalid email, duplicate username, short password, login link, logout from dashboard
- `tests/e2e/rbac.spec.ts` - RBAC E2E tests: moderator close thread flow, delete reply visibility, closed thread UI
- `tests/e2e/user-journey.spec.ts` - End-to-end user journeys (12 tests): full register→login→forum→create thread→reply→vote journey, forum navigation from dashboard, category filter flow, thread upvote/downvote/toggle, profile update journey, public thread access, forum search→detail navigation, reply constraint (content > 2000 chars errors on submit, counter)
- `tests/e2e/forumThreadDetail.spec.ts` - Forum thread detail page UI fixes (issue #28, 18 tests): forum link visibility for logged-in and anonymous users, forum link navigation to /forum, forum link indigo styling, close thread button visibility by role (MODERATOR/ADMIN only), close thread button red danger styling, close/reopen thread button text updates, navigation bar integration with profile link, styling consistency between dashboard and thread detail

### Test Strategy
- **Happy path tests** — real GET/PUT/POST/DELETE calls to backend on port 8080; catches integration mismatches (e.g. multipart field names)
- **Error scenarios** — `page.route()` mocks used for 404/500 responses and unreachable edge cases
- **Setup helpers** — `resetProfile()`, `restoreAvatar()`, `deleteAvatarViaApi()` call the backend directly in `beforeEach`/`afterEach` to keep test state deterministic
- **Seeded data constant** — `SEEDED_PROFILE` mirrors `DataInitializer.java` so assertions match the real DB state

### Page Objects (`tests/e2e/pages/`)
All page objects use `getByTestId("…")` as the **primary** locator, with `.or()` semantic fallbacks (role, text, CSS).
- `LoginPage.ts` - Login form navigation; locators: `username-input`, `password-input`, `login-button`, `login-error`
- `RegisterPage.ts` - Registration form navigation; locators: `register-heading`, `email-input`, `username-input`, `password-input`, `confirm-password-input`, `register-button`, `register-error`, `login-link`
- `DashboardPage.ts` - Dashboard heading, profile link, logout button; locators: `welcome-heading`, `profile-link`, `logout-button`
- `ProfilePage.ts` - Profile display fields, edit form inputs, alert banner, avatar upload, logout; locators: `profile-heading`, `profile-username`, `profile-email`, `display-name-input`, `bio-input`, `location-input`, `save-button`, `profile-alert`, `avatar-image`, `avatar-upload-input`, `logout-button`
- `ForumPage.ts` - Forum index page; locators: `forum-heading`, `forum-link`, `new-thread-button`, `category-filter`, `category-option-{id}`, `sort-select`, `search-input`, `thread-list`, `thread-item-{id}`, `thread-title-{id}`, `thread-score-{id}`, `load-more-button`
- `ThreadDetailPage.ts` - Thread detail page; locators: `thread-detail-title`, `thread-detail-desc`, `thread-detail-score`, `thread-detail-author`, `replies-section`, `upvote-button`, `downvote-button`, `vote-score`, `reply-form`, `reply-content-input`, `reply-submit-button`, `reply-item-{id}`, `reply-content-{id}`, `reply-toggle-{id}`

### Fixtures (`tests/e2e/fixtures/`)
- `auth.ts` - `loginAsDefaultUser(page)` helper, `DEFAULT_USER` constant; delegates to `LoginPage` for data-testid-first login

---

## Configuration Files

- `pom.xml` (root) - Parent POM, groupId: `techchamps.io`
- `backend/pom.xml` - Backend module (includes Spring Boot, Spring Security, Liquibase, PostgreSQL, Actuator)
- `restassured-tests/pom.xml` - Integration tests module (includes Testcontainers PostgreSQL)
- `.claude/settings.json` - Claude Code project settings
- `CLAUDE.md` - Project instructions and conventions
- `PROJECT_STRUCTURE.md` - **This file** (update when adding files)

---

## Docker & CI/CD Configuration

### Docker Files
- `backend/Dockerfile` - Multi-stage build for backend: Maven JDK 21 builder → JRE 21-alpine runtime; health check on /actuator/health
- `frontend/Dockerfile` - Multi-stage build for frontend: Node 20 builder → Node 20-alpine runtime; health check on http://localhost:3000
- `backend/.dockerignore` - Excludes unnecessary files from backend Docker image
- `frontend/.dockerignore` - Excludes unnecessary files from frontend Docker image
- `docker-compose.yml` - Local development: PostgreSQL 15, Backend (port 8080), Frontend (port 3000) with health checks and volumes for hot reload

### Database Configuration
- `backend/src/main/resources/application.properties` - H2 in-memory database for local dev; Liquibase disabled
- `backend/src/main/resources/application-docker.properties` - PostgreSQL configuration for Docker; Liquibase enabled
- `backend/src/main/resources/db/changelog/db.changelog-master.yaml` - Liquibase master changelog
- `backend/src/main/resources/db/migration/V001__create_users_table.sql` - Create app_users and user_profiles tables
- `backend/src/main/resources/db/migration/V002__create_forum_tables.sql` - Create forum_categories, forum_threads, forum_replies, forum_votes tables
- `backend/src/main/resources/db/migration/V003__seed_test_data.sql` - Placeholder for schema completion

### CI/CD Pipeline
- `.github/workflows/ci.yml` - GitHub Actions pipeline:
  - `build-backend` - Build backend with Maven
  - `build-backend-docker` - Build and save backend Docker image
  - `build-frontend` - Build frontend with Node
  - `build-frontend-docker` - Build and save frontend Docker image
  - `test-backend` - Run backend unit tests
  - `test-restassured` - Run RestAssured integration tests with Testcontainers PostgreSQL
  - `test-frontend` - Run frontend tests
  - `test-e2e-docker` - Run Playwright E2E tests against containerized stack
  - `mutation-testing` - Run PIT mutation tests on backend and RestAssured
  - `generate-report` - Generate combined test report (requires all tests to pass)
  - `test-summary` - Summary of all test results

### Scripts
- `start.sh` - Start all services with `docker-compose up --build` (PostgreSQL, Backend, Frontend)
- `start-test.sh` - Start containerized stack with docker-compose, run Playwright E2E tests, collect reports, and cleanup

### Configuration Profiles
- **Local Development (H2):** `application.properties` - No profile, H2 in-memory, Hibernate DDL auto
- **Docker/Production (PostgreSQL):** `application-docker.properties` - Activated by `SPRING_PROFILES_ACTIVE=docker`, PostgreSQL, Liquibase migrations

---

## Important Locations

| Purpose | Path |
|---------|------|
| API Endpoints | `backend/.../controller/*.java` |
| Database Models | `backend/.../model/` |
| API Contracts | `backend/.../dto/` |
| Authentication | `backend/.../security/` |
| UI Components | `frontend/components/` |
| Pages | `frontend/app/` |
| Integration Tests | `restassured-tests/.../` |
| Build Config | `pom.xml` files |

---

## 📌 Agent Instructions

**When you add a new file or feature, UPDATE THIS FILE:**

- New controller? Add to Controllers section
- New component? Add to Components section
- New endpoint? Document in the relevant section
- New test? Add to Tests section
- New page? Add to Pages section

Example format:
```markdown
- `NewComponent.tsx` - Brief description of what it does
```

This keeps the index current and helps future agents scan efficiently instead of reading all files.

---

## Quick Reference

**To implement a feature:**
1. Check PROJECT_STRUCTURE.md for existing related files
2. Read CLAUDE.md for conventions
3. Make your changes
4. UPDATE PROJECT_STRUCTURE.md
5. Create commit and MR

**Never skip step 4** - keeping this file updated saves tokens for future features!
