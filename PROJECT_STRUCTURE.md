# Project Structure Index

**Last Updated:** 2026-04-02 (real API integration for happy-path E2E tests)
**Important:** When agents add new files/components, they MUST update this file.

---

## Backend (Spring Boot 3.x, Java 21)

**Package Root:** `techchamps.io`
**Location:** `backend/src/main/java/techchamps/io/`

### Controllers
- `AuthController.java` - Login (`POST /api/auth/login`) and Register (`POST /api/auth/register`) endpoints
- `ProfileController.java` - User profile management:
  - `GET /api/profile/{username}` - Get profile (200 / 404)
  - `PUT /api/profile/{username}` - Update profile fields (200 / 404)
  - `POST /api/profile/{username}/avatar` - Upload avatar as multipart file (200 / 404)
  - `DELETE /api/profile/{username}/avatar` - Remove avatar (200 / 404)

### Services
- `service/ProfileService.java` - Business logic for profile CRUD and avatar upload/delete

### DTOs
- **Request:**
  - `dto/request/LoginRequest.java` - username, password
  - `dto/request/RegisterRequest.java` - email, username, password (with Bean Validation)
  - `dto/request/UpdateProfileRequest.java` - displayName, bio, location (optional, with @Size validation)
  - *(Add new request DTOs here)*
- **Response:**
  - `dto/response/LoginResponse.java` - success, message, username (nullable; populated on successful login)
  - `dto/response/RegisterResponse.java` - id, email, username, success, message
  - `dto/response/ProfileResponse.java` - id, email, username, displayName, bio, location, avatarUrl
  - `dto/response/AvatarUploadResponse.java` - avatarUrl, message
  - *(Add new response DTOs here)*

### Models (JPA Entities)
- `model/AppUser.java` - User entity with id, email (unique), username (unique), password, role, displayName, bio, location, avatarUrl

### Repositories
- `repository/AppUserRepository.java` - JPA repository for AppUser

### Security
- `security/DatabaseUserDetailsService.java` - Spring Security user details loader
- `config/SecurityConfig.java` - Security configuration, JWT setup
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
- `app/dashboard/page.tsx` - Dashboard: top nav bar with ProfileLink + LogoutButton, centered "Welkom op deze site" heading; `data-testid`: `welcome-heading`
- `app/profile/[username]/page.tsx` - Profile page; delegates to `ProfileForm`
- *(Add new pages here)*

### Components
- `components/LoginForm.tsx` - Login form component; `data-testid`: `login-form`, `username-input`, `password-input`, `login-button`, `login-error`, `register-link`
- `components/RegisterForm.tsx` - Registration form component; `data-testid`: `register-form`, `email-input`, `username-input`, `password-input`, `confirm-password-input`, `register-button`, `register-error`, `login-link`
- `components/LogoutButton.tsx` - Logout button; clears `localStorage["username"]` and navigates to `/`; `data-testid`: `logout-button`
- `components/ProfileLink.tsx` - Link to `/profile/{username}`, reads username from localStorage; `data-testid`: `profile-link`
- `components/ProfileForm.tsx` - Full profile edit form (avatar, account info, editable fields); `data-testid`: `profile-heading`, `profile-alert`, `avatar-section`, `avatar-image`, `avatar-placeholder`, `avatar-upload-input`, `avatar-upload-label`, `delete-avatar-button`, `account-info-section`, `profile-username`, `profile-email`, `edit-profile-section`, `edit-profile-form`, `display-name-input`, `bio-input`, `location-input`, `save-button`
- *(Add new components here)*

### Component Unit Tests
- `components/LoginForm.test.tsx` - 8 tests: render, data-testid, interactions, error states, loading state
- `components/RegisterForm.test.tsx` - 9 tests: render, data-testid, validation, error states, loading state
- `components/LogoutButton.test.tsx` - 5 tests: render, data-testid, navigation, localStorage
- `components/ProfileLink.test.tsx` - 4 tests: render, data-testid, href construction
- `components/ProfileForm.test.tsx` - 13 tests: loading, profile data, data-testid, save/delete/upload avatar flows

### Libraries
- `lib/api.ts` - All API calls (auth, profile, avatar)
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

### Test Builders
- `builder/LoginRequestBuilder.java` - Builder for LoginRequest
- `builder/RegisterRequestBuilder.java` - Builder for RegisterRequest

### Testing
- Uses `@SpringBootTest(webEnvironment = RANDOM_PORT)`
- RestAssured 5.x for HTTP testing
- JUnit 5, AssertJ for assertions
- H2 in-memory database

---

## E2E Tests (Playwright)

**Location:** `playwright-tests/`
**Config:** `playwright-tests/playwright.config.ts` — baseURL: http://localhost:3000, headless Chromium
**Run:** `cd playwright-tests && npm test`

### Test Files
- `tests/e2e/profile.spec.ts` - User Profile Page Flow (23 tests); happy-path tests use real API calls (no mocks); mocks kept only for error scenarios (404, 500) and the no-avatar edge case

### Test Strategy
- **Happy path tests** — real GET/PUT/POST/DELETE calls to backend on port 8080; catches integration mismatches (e.g. multipart field names)
- **Error scenarios** — `page.route()` mocks used for 404/500 responses and unreachable edge cases
- **Setup helpers** — `resetProfile()`, `restoreAvatar()`, `deleteAvatarViaApi()` call the backend directly in `beforeEach`/`afterEach` to keep test state deterministic
- **Seeded data constant** — `SEEDED_PROFILE` mirrors `DataInitializer.java` so assertions match the real DB state

### Page Objects (`tests/e2e/pages/`)
All page objects use `getByTestId("…")` as the **primary** locator, with `.or()` semantic fallbacks (role, text, CSS).
- `LoginPage.ts` - Login form navigation; locators: `username-input`, `password-input`, `login-button`, `login-error`
- `DashboardPage.ts` - Dashboard heading, profile link, logout button; locators: `welcome-heading`, `profile-link`, `logout-button`
- `ProfilePage.ts` - Profile display fields, edit form inputs, alert banner, avatar upload, logout; locators: `profile-heading`, `profile-username`, `profile-email`, `display-name-input`, `bio-input`, `location-input`, `save-button`, `profile-alert`, `avatar-image`, `avatar-upload-input`, `logout-button`

### Fixtures (`tests/e2e/fixtures/`)
- `auth.ts` - `loginAsDefaultUser(page)` helper, `DEFAULT_USER` constant; delegates to `LoginPage` for data-testid-first login

---

## Configuration Files

- `pom.xml` (root) - Parent POM, groupId: `techchamps.io`
- `backend/pom.xml` - Backend module
- `restassured-tests/pom.xml` - Integration tests module
- `.claude/settings.json` - Claude Code project settings
- `CLAUDE.md` - Project instructions and conventions
- `PROJECT_STRUCTURE.md` - **This file** (update when adding files)

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
