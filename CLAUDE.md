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
1. **Feature-analysis:** Read PROJECT_STRUCTURE.md for codebase overview
2. **Implement agents:** Backend/Frontend/Test agents make changes
3. **Update INDEX:** ALL agents MUST update PROJECT_STRUCTURE.md when adding files
4. **Create MRs:** Each agent creates their own merge request

**IMPORTANT:** Agents must update PROJECT_STRUCTURE.md with new files/components added. This keeps the index current and reduces token usage for future features.
