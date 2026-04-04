# test-project

Multi-module Maven project with a Spring Boot backend, Next.js frontend, and separate test modules.

## 📋 Project Documentation
- **PROJECT_STRUCTURE.md** — Index of all files, controllers, components, tests (READ THIS FIRST)
- **CLAUDE.md** — This file, project conventions and commands

## Structure
- `backend/` — Spring Boot 3.x, Java 21, package root `techchamps.io`, port 8080
- `frontend/` — Next.js 14, TypeScript, Tailwind CSS, port 3000
- `restassured-tests/` — RestAssured integration tests (separate Maven module)

## Commands

### Development & Services
- Start everything: `./start.sh` (backend + frontend + PostgreSQL via docker-compose)
- Run all tests: `mvn test` (unit tests, requires services NOT running)
- Build backend: `mvn install -pl backend`

### Running E2E Tests (IMPORTANT for agents)
**Playwright E2E tests MUST have services running.** Use these scripts:
- **Headless mode** (CI/auto): `./start-test.sh` — Starts services, runs tests headless, cleans up
- **Debug mode** (local): `./start-test-headed.sh` — Starts services, runs tests with visible browser, keeps report open

Do NOT run `npm test` directly in `playwright-tests/` without services — tests will fail with 404s.

### Integration Tests
- Run RestAssured integration tests: `mvn test -pl restassured-tests` (requires services running)

## Conventions
- DTOs in `dto/request/` (suffix: Request) and `dto/response/` (suffix: Response)
- All endpoints documented with `@Operation`, `@ApiResponses`, `@Schema`
- Swagger UI: http://localhost:8080/swagger-ui/index.html
- Test builders in `restassured-tests/src/test/java/techchamps/io/builder/`
- Test classes use suffix `IT`

## 🔄 Agent Workflow

This project uses **global Claude agents** for automated development:

**Global Agents** (location: `~/.claude/agents/`)
- `feature-analysis.md` — Plan features, identify cross-layer constraints
- `backend.md` — Build Spring Boot REST API with unit tests
- `frontend.md` — Build Next.js components with Jest tests
- `restassured.md` — Write RestAssured integration tests
- `playwright.md` — Write Playwright E2E tests
- `mutation-testing.md` — Run PIT (backend) + Stryker (frontend) mutation tests

**Three-Phase Workflow:**
1. **PLAN** — Feature-analysis shows plan, wait for approval
2. **IMPLEMENT** — All agents work on feature branch (never main)
3. **MERGE** — Ask user before merging PR

**Quality Gates:**
- Backend mutation score (PIT): ≥80%
- Frontend mutation score (Stryker): ≥80%
- **Both layers required** before merge

**Important:**
- Never commit directly to main — always use feature branches
- All agents automatically update PROJECT_STRUCTURE.md
- Cross-layer constraints documented in issue before implementation

## 🧪 Testing Strategy (For Agents)

### Unit Tests (Backend)
- Command: `mvn test -pl backend`
- **Services NOT required** — use in-memory H2 database
- Run independently when testing backend logic

### Integration Tests (RestAssured)
- Command: `mvn test -pl restassured-tests`
- **Services REQUIRED** — uses Testcontainers for PostgreSQL
- Tests actual API endpoints with real database

### E2E Tests (Playwright)
- **CRITICAL: Services MUST be running** — use `./start-test.sh`
- Do NOT run `npm test` directly in `playwright-tests/` directory
- `start-test.sh` handles: docker-compose up → health checks → tests → cleanup
- Authentication: Tests use API setup (`setupDefaultUserAuth()`) which calls `/api/auth/login`
- Tests that use API setup can run faster than UI login
- Some tests may need UI login for testing auth flows themselves
