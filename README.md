# Full-Stack Login Application

A full-stack login application with a Spring Boot backend, a Next.js frontend, and a dedicated RestAssured integration test module.

---

## Project Overview

This project demonstrates a simple but complete authentication flow:

- The **backend** exposes a REST API with a login endpoint secured by Spring Security.
- The **frontend** provides a login page and a protected dashboard, communicating with the backend API.
- The **restassured-tests** module contains integration tests that verify the backend API independently.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Backend | Java 21, Spring Boot 3.x, Spring Security, Maven |
| Database | PostgreSQL 15, Liquibase migrations (Docker), H2 (local dev) |
| API Docs | Springdoc OpenAPI (Swagger UI) |
| Frontend | Next.js 14, TypeScript, Tailwind CSS, npm |
| Integration Tests | Java, RestAssured 5.x, Testcontainers, Maven |
| E2E Tests | Playwright (Chromium) |
| Containerization | Docker, Docker Compose |
| CI/CD | GitHub Actions |

---

## Project Structure

```
.
├── pom.xml                  # Maven root (multi-module)
├── backend/                 # Spring Boot REST API
│   └── pom.xml
├── frontend/                # Next.js application
│   └── package.json
└── restassured-tests/       # RestAssured integration tests
    └── pom.xml
```

---

## Getting Started

### Prerequisites

#### Docker Setup (Recommended)
- **Docker** and **Docker Compose** — for containerized development

#### Local Setup (Alternative)
- **Java 21** and **Maven 3.8+** — for backend and test modules
- **Node.js 20+** and **npm** — for frontend
- **PostgreSQL 15** (optional, for production-like testing)

### Running the Application

#### Option 1: Docker Compose (Recommended)

Start all services (PostgreSQL, Backend, Frontend) with a single command:

```bash
./start.sh
```

Services will be available at:
- **Frontend:** http://localhost:3000
- **Backend:** http://localhost:8080
- **Swagger UI:** http://localhost:8080/swagger-ui/index.html
- **pgAdmin:** http://localhost:5050

Docker Compose handles database initialization automatically with Liquibase migrations.

**Database Access via pgAdmin:**
- Login: `admin@example.com` / `admin`
- PostgreSQL server is automatically configured as `test-project`
- No additional setup needed — just login and start browsing!

**Database Reset:**
When you run `./start.sh` again, the database is automatically reset to a fresh state (no persistent data between restarts).

#### Option 2: Local Development (Manual)

**1. Start the backend**

```bash
cd backend && mvn spring-boot:run
```

The API will be available at `http://localhost:8080` with an in-memory H2 database.

**2. Start the frontend** (in another terminal)

```bash
cd frontend && npm run dev
```

The app will be available at `http://localhost:3000`.

---

## Database & Migrations

### Local Development (H2 In-Memory)

When running locally with `mvn spring-boot:run`, the backend uses an in-memory H2 database with automatic schema generation via Hibernate.

### Docker (PostgreSQL + Liquibase)

When running with Docker Compose (`./start.sh`), the backend uses PostgreSQL 15 with Liquibase for schema management:

- **Migrations:** Located in `backend/src/main/resources/db/migration/`
  - `V001__create_users_table.sql` — User and profile tables
  - `V002__create_forum_tables.sql` — Forum categories, threads, replies, votes
  - `V003__seed_test_data.sql` — Placeholder for schema completion

- **Master Changelog:** `backend/src/main/resources/db/changelog/db.changelog-master.yaml`

Liquibase automatically runs migrations when the backend starts in Docker with the `docker` Spring profile.

**Database Persistence:**
The PostgreSQL database in Docker is **ephemeral** — data is NOT persisted between restarts. This is intentional for clean development and testing. Each time you run `./start.sh`, you get a fresh database with migrations applied automatically.

---

## Docker Configuration

### Environment Variables

The `docker-compose.yml` configures:
- **PostgreSQL:** Database on `postgres:5432`, credentials: `test`/`test`
- **pgAdmin:** Web-based database admin at `http://localhost:5050`, credentials: `admin@example.com` / `admin`
- **Backend:** Runs with `SPRING_PROFILES_ACTIVE=docker` (enables Liquibase)
- **Frontend:** Connects to backend at `http://backend:8080`

### Health Checks

All Docker services include health checks:
- **PostgreSQL:** `pg_isready` query
- **Backend:** HTTP GET `/actuator/health`
- **Frontend:** HTTP GET `http://localhost:3000`

Services depend on health checks to prevent race conditions.

---

## API Reference

### POST /api/auth/login

Authenticates a user and returns a response indicating success or failure.

**Request body**

```json
{
  "username": "user",
  "password": "user1234"
}
```

**Default in-memory credentials**

| Field | Value |
|---|---|
| username | `user` |
| password | `user1234` |

### Swagger UI

Interactive API documentation is available while the backend is running:

```
http://localhost:8080/swagger-ui/index.html
```

The Swagger UI lets you:
- Browse all available endpoints grouped by tag
- Inspect request and response schemas with example values
- Execute requests directly from the browser — no external tool needed

The raw OpenAPI spec (JSON) is available at:

```
http://localhost:8080/v3/api-docs
```

---

## Testing

### Unit & Integration Tests

**Run all tests** (backend, RestAssured integration, frontend):

```bash
mvn test
```

RestAssured integration tests automatically spin up a **Testcontainers PostgreSQL** instance for production-like testing — no manual database setup needed.

**Run specific test suites:**

```bash
# Backend unit tests
mvn test -pl backend

# RestAssured integration tests (with Testcontainers PostgreSQL)
mvn test -pl restassured-tests

# Frontend unit tests
cd frontend && npm test
```

### E2E Tests with Docker Compose

Run Playwright E2E tests against the containerized stack:

```bash
./start-test.sh
```

This script will:
1. Start PostgreSQL, Backend, and Frontend with Docker Compose
2. Wait for all services to be healthy
3. Run Playwright E2E tests
4. Collect HTML reports and traces
5. Clean up containers

Playwright reports are generated in `playwright-tests/playwright-report/`.

### CI/CD Pipeline

GitHub Actions automatically runs all tests on every push to `main` and pull requests:

- **Unit Tests:** Backend and Frontend unit tests run in parallel
- **Integration Tests:** RestAssured tests with Testcontainers PostgreSQL
- **E2E Tests:** Playwright tests against containerized stack
- **Mutation Testing:** PIT mutation tests (target: ≥80% score)
- **Reports:** Combined test report generated on successful test runs

See `.github/workflows/ci.yml` for pipeline configuration.

### Build the backend only

```bash
mvn install -pl backend
```
