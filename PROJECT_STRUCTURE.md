# Project Structure Index

**Last Updated:** 2026-04-01
**Important:** When agents add new files/components, they MUST update this file.

---

## Backend (Spring Boot 3.x, Java 21)

**Package Root:** `techchamps.io`
**Location:** `backend/src/main/java/techchamps/io/`

### Controllers
- `AuthController.java` - Login (`POST /api/auth/login`) and Register (`POST /api/auth/register`) endpoints
- *(Add new controllers here)*

### Services
- *(No services yet, add here as needed)*

### DTOs
- **Request:**
  - `dto/request/LoginRequest.java` - username, password
  - `dto/request/RegisterRequest.java` - email, username, password (with Bean Validation)
  - *(Add new request DTOs here)*
- **Response:**
  - `dto/response/LoginResponse.java` - success, message
  - `dto/response/RegisterResponse.java` - id, email, username, success, message
  - *(Add new response DTOs here)*

### Models (JPA Entities)
- `model/AppUser.java` - User entity with id, email (unique), username (unique), password, role

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

### Test Builders
- `builder/LoginRequestBuilder.java` - Builder for LoginRequest

### Testing
- Uses `@SpringBootTest(webEnvironment = RANDOM_PORT)`
- RestAssured 5.x for HTTP testing
- JUnit 5, AssertJ for assertions
- H2 in-memory database

---

## E2E Tests (Playwright - Optional)

**Location:** `playwright-tests/` (if created)

### Test Files
- `tests/e2e/` - End-to-end test files
- `tests/e2e/pages/` - Page Object Model classes
- `tests/e2e/fixtures/` - Shared fixtures

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
