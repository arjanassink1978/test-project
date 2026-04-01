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
| Backend | Java, Spring Boot 3.x, Spring Security, Maven |
| API Docs | Springdoc OpenAPI (Swagger UI) |
| Frontend | Next.js 14, TypeScript, Tailwind CSS, npm |
| Integration Tests | Java, RestAssured, Maven |

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

- **Java 17+** and **Maven 3.8+** — required for the backend and test modules
- **Node.js 18+** and **npm** — required for the frontend

### Running the Application

**1. Start the backend**

```bash
cd backend && mvn spring-boot:run
```

The API will be available at `http://localhost:8080`.

**2. Start the frontend**

```bash
cd frontend && npm run dev
```

The app will be available at `http://localhost:3000`.

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

### Run all tests

From the project root:

```bash
mvn test
```

### Run integration tests only

```bash
mvn test -pl restassured-tests
```

> The backend must be running on `http://localhost:8080` before executing the integration tests.

### Build the backend only

```bash
mvn install -pl backend
```
