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
- Start everything: `./start.sh`
- Run all tests: `mvn test`
- Run integration tests only: `mvn test -pl restassured-tests`
- Build backend: `mvn install -pl backend`

## Conventions
- DTOs in `dto/request/` (suffix: Request) and `dto/response/` (suffix: Response)
- All endpoints documented with `@Operation`, `@ApiResponses`, `@Schema`
- Swagger UI: http://localhost:8080/swagger-ui/index.html
- Test builders in `restassured-tests/src/test/java/techchamps/io/builder/`
- Test classes use suffix `IT`

## 🔄 Agent Workflow

### Cross-Layer Constraints (Critical!)
**Problem:** Frontend and backend must stay in sync. A "green build" (passing tests) doesn't mean the app works.

**Rule: Feature-analysis agent MUST identify and document all cross-layer constraints BEFORE implementation:**

1. **What triggers this rule:**
   - File size limits (e.g., avatar max 5MB)
   - String length constraints (e.g., username max 20 chars)
   - Enum values (e.g., roles: [ADMIN, USER])
   - Rate limits, pagination size, timeouts
   - Authentication/authorization rules

2. **Feature-analysis must create a "CONSTRAINT" section in the issue/PR:**
   ```
   ## Cross-Layer Constraints
   - Avatar file: max 5MB (frontend AND backend)
   - Locations: field must exist in backend, displayed on frontend
   - Auth: token expires in 1 hour (backend sends, frontend must refresh)
   ```

3. **Backend agent checklist:**
   - [ ] Read the constraints section in the issue
   - [ ] Implement server-side validation + tests that VERIFY the constraint
   - [ ] Add comment in code: `// CONSTRAINT: max 5MB — must match frontend validation`

4. **Frontend agent checklist:**
   - [ ] Read the constraints section in the issue
   - [ ] Implement client-side validation matching the backend constraint
   - [ ] Add comment in code: `// CONSTRAINT: max 5MB (5 * 1024 * 1024 bytes) — must match backend`

5. **Test agent checklist (RestAssured):**
   - [ ] Write **boundary tests** that verify constraints
   - [ ] Example: `@Test uploadFile_oversized_returns413()` — test that files > limit fail
   - [ ] Don't just test happy path; test the limit itself

### Standard Agent Steps
1. **Feature-analysis:** Read PROJECT_STRUCTURE.md for codebase overview
   - **NEW:** Identify all cross-layer constraints and document them
2. **Backend agent:** Implement changes + tests
   - **NEW:** Check constraints from issue, implement server-side validation
3. **Frontend agent:** Implement changes
   - **NEW:** Check constraints from issue, implement client-side validation
4. **Test agent:** Add integration/E2E tests
   - **NEW:** Write boundary tests for constraints, not just happy path
5. **Update INDEX:** ALL agents MUST update PROJECT_STRUCTURE.md when adding files
6. **Create MRs:** Each agent creates their own merge request (or link feature-analysis PR)

**IMPORTANT:** Agents must update PROJECT_STRUCTURE.md with new files/components added. This keeps the index current and reduces token usage for future features.

**CRITICAL:** A passing build ≠ working feature. Constraints must be tested across layers.
