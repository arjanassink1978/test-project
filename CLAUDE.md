# test-project

Multi-module Maven project with a Spring Boot backend, Next.js frontend, and separate test modules.

## Structure
- `backend/` — Spring Boot 3.x, Java 21, package root `dev.multiagent`, port 8080
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
- Test builders in `restassured-tests/src/test/java/dev/multiagent/builder/`
- Test classes use suffix `IT`
