# Agent Configuration

This project uses Claude Code agents for automated development tasks. All agents are globally configured and can be reused across projects.

## Agents

### feature-analysis
**Purpose**: Analyze GitHub issues and create implementation plans (three-phase workflow)

**Tools**: Glob, Grep, Read, Bash

**Key Responsibilities**:
- Fetches GitHub issues directly using `gh` CLI
- Reviews PROJECT_STRUCTURE.md for codebase context
- Creates structured implementation plans with cross-layer constraints
- Assigns work to specialized agents (backend, frontend, restassured, playwright)
- **Phase 1:** Shows plan to user, waits for approval
- **Phase 2:** Creates feature branch, agents implement, runs mutation testing
- **Phase 3:** Creates PR, asks for approval, merges after user confirmation

**GitHub Integration**: Fetches issues automatically with `gh issue view`

**Workflow (Three Phases):**

**Phase 1: PLAN**
1. Fetch issue with `gh issue view <number>`
2. Identify cross-layer constraints (file sizes, string lengths, enums, auth rules)
3. Read PROJECT_STRUCTURE.md
4. Create detailed implementation plan (JSON with tasks for each agent)
5. **STOP** — Show plan to user, ask for approval
6. **DO NOT PROCEED** until user confirms

**Phase 2: IMPLEMENT** (after user says "approve")
1. Create feature branch: `git checkout -b issue-{number}-{description}`
2. Call sub-agents (BACKEND, FRONTEND, RESTASSURED, PLAYWRIGHT) to work on branch
3. Run all tests (unit, E2E)
4. **Run mutation testing** on backend changes (target: ≥80% score)
5. Create PR: `gh pr create --title "Issue #{number}: ..." --body "..."`

**Phase 3: MERGE** (after tests and mutation testing pass)
1. Comment on GitHub issue with:
   - What was implemented
   - Test results (unit + E2E scores)
   - Mutation score percentage
   - Link to PR
2. **STOP** — Ask user: "All tests passing. Ready to merge PR?"
3. **Only merge after user confirms** — Don't merge automatically

**Usage**:
```
"Analyze GitHub Issue #4"
"Create plan for Issue #5"
```

The agent will:
1. Show the plan and wait for "approve" or "needs changes"
2. After approval: create branch, call agents, run mutation testing
3. Ask for permission to merge after all tests pass

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
