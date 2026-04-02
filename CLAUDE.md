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
- File size limits (e.g., avatar max 5MB)
- String length constraints (e.g., username max 20 chars)
- Enum values (e.g., roles: [ADMIN, USER])
- Rate limits, pagination size, timeouts
- Authentication/authorization rules

**Feature-analysis creates a "CONSTRAINT" section in the issue:**
```
## Cross-Layer Constraints
- Avatar file: max 5MB (frontend AND backend)
- Locations: field must exist in backend, displayed on frontend
- Auth: token expires in 1 hour (backend sends, frontend must refresh)
```

Backend and frontend agents read constraints from issue and implement them. See their agent prompts for details.

### Standard Agent Steps (Three-Phase Workflow)

**PHASE 1: Planning**
1. **Feature-analysis:**
   - Fetch GitHub issue
   - Identify all cross-layer constraints
   - Read PROJECT_STRUCTURE.md
   - Create implementation plan
   - **SHOW PLAN AND WAIT FOR USER APPROVAL**

**PHASE 2: Implementation** (after user approves)
1. **Feature-analysis:** Create feature branch `issue-{number}-{description}`
2. **Backend agent:** Implement changes + tests (on feature branch)
   - Check constraints from issue
   - Implement server-side validation
3. **Frontend agent:** Implement changes (on feature branch)
   - Check constraints from issue
   - Implement client-side validation
4. **RestAssured/Playwright agents:** Add integration/E2E tests
   - Write boundary tests for constraints
5. **Mutation testing:** Run PIT mutation tests (target: ≥80% score)
6. **ALL agents:** Update PROJECT_STRUCTURE.md when adding files

**PHASE 3: Review & Merge** (after all tests pass)
1. **Feature-analysis:** Create PR to main
2. Comment on GitHub issue with test results + mutation score
3. **ASK USER FOR APPROVAL** before merging PR
4. **Only merge after user confirms**

**IMPORTANT:**
- Never commit directly to main — always use feature branches
- A passing build ≠ working feature — constraints must be tested across layers
- Mutation score ≥80% required before merging
