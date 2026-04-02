# Project Structure Index

**Last Updated:** 2026-04-02
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
  - `dto/response/LoginResponse.java` - success, message
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
- `app/[login]/page.tsx` - Login page
- `app/[dashboard]/page.tsx` - Dashboard (authenticated)
- *(Add new pages here)*

### Components
- `components/LoginForm.tsx` - Login form component
- `components/LogoutButton.tsx` - Logout button
- *(Add new components here)*

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
- `tests/e2e/profile.spec.ts` - Issue #4: User Profile Page Flow (19 tests)

### Page Objects (`tests/e2e/pages/`)
- `LoginPage.ts` - Login form navigation, credential entry, error message accessor
- `DashboardPage.ts` - Dashboard heading, profile link, logout button
- `ProfilePage.ts` - Profile display fields, edit form inputs, alert banner, avatar upload, logout

### Fixtures (`tests/e2e/fixtures/`)
- `auth.ts` - `loginAsDefaultUser(page)` helper, `DEFAULT_USER` constant

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
