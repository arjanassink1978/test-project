# Agent Configuration

This project uses Claude Code agents for automated development tasks. All agents are globally configured and can be reused across projects.

## Agents

### feature-analysis
**Purpose**: Analyze GitHub issues and create implementation plans

**Tools**: Glob, Grep, Read

**Key Responsibilities**:
- Reads GitHub issues from the repository
- Reviews PROJECT_STRUCTURE.md for context
- Creates structured implementation plans
- Assigns work to specialized agents (backend, frontend, restassured, playwright)

**GitHub Integration**: Uses `gh` CLI to fetch issues

### backend
**Purpose**: Build and modify Spring Boot REST API modules

**Tools**: Glob, Grep, Read, Write, Edit, Bash

**Responsibilities**:
- Implements REST endpoints
- Creates/updates JPA entities and DTOs
- Configures security and Swagger documentation
- Updates Maven configuration

### frontend
**Purpose**: Build and modify Next.js frontend modules

**Tools**: Glob, Grep, Read, Write, Edit, Bash

**Responsibilities**:
- Implements React components with TypeScript
- Configures Tailwind CSS styling
- Uses shadcn/ui component library
- Manages Next.js routing and pages

### restassured
**Purpose**: Write and update RestAssured integration tests

**Tools**: Glob, Grep, Read, Write, Edit, Bash

**Responsibilities**:
- Creates REST API integration test suites
- Uses builder pattern for test data
- Implements functional flow testing
- Maintains test quality metrics

### mutation-testing
**Purpose**: Run PIT mutation tests and improve coverage

**Tools**: Glob, Grep, Read, Write, Edit, Bash

**Responsibilities**:
- Executes mutation testing on backend code
- Coordinates with restassured agent to improve coverage
- Validates mutation score against 80% target
- Generates mutation test reports

### playwright
**Purpose**: Write and update Playwright e2e tests

**Tools**: Glob, Grep, Read, Write, Edit, Bash

**Responsibilities**:
- Implements end-to-end tests for frontend flows
- Uses Page Object Model pattern
- Tests Next.js frontend functionality
- Creates browser screenshots and logs

## GitHub Integration

All agents use the GitHub CLI (`gh`) for repository operations:

```bash
# Fetch issues
gh issue view <number>

# List issues
gh issue list

# Create issues
gh issue create --title "..." --body "..."

# Create pull requests
gh pr create --title "..." --body "..."
```

**Required scopes**: `repo`, `read:org`, `workflow`

To refresh GitHub authentication:
```bash
gh auth refresh -s repo read:org workflow
```

## Agent Configuration Location

Global agents are stored in `~/.claude/agents/`:
- `feature-analysis.md`
- `backend.md`
- `frontend.md`
- `restassured.md`
- `playwright.md`
- `mutation-testing.md`

These are shared across all projects and should not be modified per-project.

## Usage

Agents are triggered via the Agent tool:

```
@claude "Use the feature-analysis agent to plan Issue #5"
```

Or directly by specialist:
```
@claude "Use the backend agent to implement the registration endpoint"
```
