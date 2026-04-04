# Cross-Agent Constraints & Known Blockers (Project-Specific)

Dit bestand is project-specific. Voor het generieke template zie: `~/.claude/agents/AGENT_CONSTRAINTS.md`

Helpt agents elkaar context door te geven en tijd/tokens te sparen door bekend blockers en constraints te documenteren.

## 🚫 Known Architectural Blockers

### RestAssured + PIT (Separate Module)
- **Status:** ❌ Unsolved (requires Maven refactor)
- **Issue:** PIT cannot find production code in separate test modules
- **Root Cause:** PIT looks for `target/classes/` in current module; restassured-tests only has `target/test-classes/`
- **Why It's Hard:** Backend code is in JAR dependency, PIT's classpath scanning doesn't automatically pick it up
- **Last Attempt:** Tried `mutableCodePaths`, `scanDependencies` — neither worked out of box
- **Decision:** Defer to follow-up PR; not critical since backend unit tests already at 98%

### RestAssured Plugin Modifications
- **Status:** 🔴 DO NOT DO
- **Issue:** Agents keep adding `maven-dependency-plugin` and `build-helper-maven-plugin`
- **Why:** Causes "Artifact has not been packaged yet" error
- **Solution:** Leave pom.xml alone. If PIT fails, it's config elsewhere, not missing plugins

## 📋 Frontend Constraints

### Avatar Upload
- **Max File Size:** 5MB
- **Frontend:** Enforces via validation before upload
- **Backend:** Must reject files > 5MB with 413 error
- **Test:** Boundary tests needed (5MB OK, 5.1MB rejected)

### Forum Thread Title
- **Max Length:** 200 characters
- **Frontend:** Input field limited to 200
- **Backend:** Must validate and return 400 if exceeded
- **Test:** Boundary tests (199 OK, 200 OK, 201 rejected)

### Forum Reply Depth
- **Max Depth:** 5 levels deep
- **Business Rule:** Prevent reply chains from exceeding depth limit
- **Test:** Create nested replies up to depth 5 (OK), attempt depth 6 (400)

## 🔄 Cross-Agent Context (Who Needs What)

### Backend Agent Outputs → Frontend Agent Reads
- New endpoint added? → Frontend needs to know the URL, request/response format
- New validation rule? → Frontend should enforce same rule before submit (UX)
- New error codes? → Frontend should handle 400, 404, 413, etc.

### Frontend Agent Outputs → Backend Agent Reads
- New form validation added? → Backend must enforce same rules
- New component added? → Backend might need new endpoints or DTOs
- UI limits (max 200 chars)? → Backend must validate boundaries

### Mutation Testing Findings
- Backend: 98% achieved ✅
- Frontend: (pending Stryker run)
- Integration: (blocked on PIT config, deferred)

## 📊 Token Budget Notes

- Fail-fast rule: Stop after 2 failed attempts on same error
- If debugging loop forms → report blocker instead of continuing
- Prefer "I can't solve this" over 10 more iterations

---

**Last Updated:** 2026-04-03
**Next Steps:** Resolve RestAssured PIT in future PR with Maven configuration expert
**Generic Template:** ~/.claude/agents/AGENT_CONSTRAINTS.md (for use across projects)

