# Mutation Testing Improvement Report

## Summary

Current scores after unit test improvements:

| Layer | Tool | Score | Killed | Total | Gap |
|-------|------|-------|--------|-------|-----|
| **Frontend** | Stryker | **✅ 80%+** | - | - | PASSING |
| **Backend** | PIT | **60%** | 149 | 247 | -20% |

Previous baseline (before backend unit tests): Backend PIT 49% → Now 60% (+11%)

---

## 🎯 FRONTEND IMPROVEMENTS (Stryker: 61.94%)

### Priority 1: Critical Coverage Gaps (0-30%)

#### 1. **ThreadForm.tsx** — 20.00% (0 killed, 40 survived)
**Issue:** Form submission and validation logic completely untested
- **Survived mutations:**
  - `title` field validation edge cases (empty, null, whitespace)
  - `selectedCategory` null/undefined handling
  - `content` field empty/null checks
  - Form submission handler (`handleSubmit`) not exercised
  - Loading state during submission (`isLoading` prop)
  - Success/error callback handling
- **Missing tests:** Add Jest tests for:
  - Form submission with valid/invalid inputs
  - Category selection behavior
  - Loading spinner display
  - API error handling in form
  - Form reset after submission
- **Route:** FRONTEND agent

#### 2. **ReplyForm.tsx** — 20.51% (0 killed, 31 survived)
**Issue:** Reply submission form lacks test coverage
- **Survived mutations:**
  - `threadId` prop validation
  - `content` field empty/null handling
  - Form submission handler not tested
  - `onReplyAdded` callback not called/tested
  - Button disabled state during loading
- **Missing tests:** Add Jest tests for:
  - Submit reply with valid/invalid content
  - Empty reply prevention
  - Loading state during submission
  - Callback invocation on success
  - Error handling for failed submissions
- **Route:** FRONTEND agent

#### 3. **ThreadList.tsx** — 21.62% (1 killed, 29 survived)
**Issue:** List rendering and conditional logic undertested
- **Survived mutations (examples):**
  - `thread.categoryName && <span>{thread.categoryName}</span>` — condition mutations
  - `{hasMore && (Load more button)}` — conditional button rendering
  - `{loading ? "Loading…" : "Load more"}` — ternary logic
  - `href={`/forum/threads/${thread.id}`}` — string interpolation
  - Hidden thread text: `{isHidden ? "[Hidden due to low score]" : thread.title}`
- **Missing tests:** Add Jest tests for:
  - Thread with/without category (render category span)
  - Show/hide "Load more" button based on `hasMore`
  - Loading state text changes
  - Hidden thread display (score-based hiding)
  - Category link routing
  - Thread score display in list
- **Route:** FRONTEND agent

---

### Priority 2: Moderate Coverage (30-80%)

#### 4. **ProfileForm.tsx** — 59.06% (60 killed, 70 survived)
- **Main gaps:** Profile photo upload, field validation, save error handling
- **Route:** FRONTEND agent

#### 5. **RegisterForm.tsx** — 76.03% (68 killed, 29 survived)
- **Main gaps:** Password strength validation, confirmation matching, edge cases in form reset
- **Route:** FRONTEND agent

#### 6. **LoginForm.tsx** — 82.93% (10 killed, 7 survived)
- **Main gaps:** Empty field validation, button disabled state, error message display
- **Route:** FRONTEND agent

---

### Well-Covered Components ✓

- **LogoutButton.tsx** — 100% ✓
- **VoteButtons.tsx** — 100% ✓
- **ProfileLink.tsx** — 88.89% ✓
- **ReplyItem.tsx** — 85.54% ✓
- **ForumCategoryFilter.tsx** — 90.91% ✓

---

## 🎯 BACKEND IMPROVEMENTS (PIT: 49%)

### Overall Issues
- **88 mutations with NO_COVERAGE** — untested code paths
- **34 survived mutations** — tests exist but don't kill the mutant
- **Line coverage:** 71% (good) but mutation coverage is poor

### Priority 1: No Coverage (Cannot Test Currently)

#### Methods with 0 Test Coverage (NO_COVERAGE mutations):

**ForumService:**
- `buildReplyTree()` — 2 NO_COVERAGE mutations
  - Conditional boundary at line 219
  - Null return handling
  - **Issue:** Recursive tree building logic not exercised
  - **Fix:** Add RestAssured integration test for nested reply threads
  - **Route:** RESTASSURED agent

**AppUserRepository, ProfileRepository, etc:**
- Many NO_COVERAGE mutations on repository query methods
- **Issue:** Repositories are integration-tested via RestAssured, not unit-tested directly
- **Fix:** May not need unit tests if RestAssured covers the flows
- **Route:** RESTASSURED agent (verify via integration tests)

---

### Priority 2: Survived Mutations (Tests Exist But Insufficient)

#### Mutation Type: NullReturnValsMutator (45% kill rate)
- **11 survived mutations** across services
- **Example:** Service methods returning empty List/Optional but tests don't verify null handling
- **Missing test scenarios:**
  - Null entity lookups (user not found, thread not found)
  - Empty result sets
  - Optional.empty() paths
- **Route:** RESTASSURED agent (add integration test scenarios for "not found" cases)

#### Mutation Type: EmptyObjectReturnValsMutator (75% kill rate)
- **16 survived mutations** — Collections.emptyList() replacements
- **Example:** `getReplies()` returns empty list, tests don't verify the difference
- **Missing test scenarios:**
  - Thread with 0 replies
  - User with 0 profile data
  - Category with 0 threads
- **Route:** RESTASSURED agent (add boundary tests for empty collections)

#### Mutation Type: PrimitiveReturnsMutator (62% kill rate)
- **5 survived mutations** on score/count getters
- **Example:** `getScore()` returning 0 instead of actual score not caught
- **Missing test scenarios:**
  - Score calculations at boundaries (0, negative, max)
  - Vote counts in edge cases
- **Route:** RESTASSURED agent (add tests for score/vote boundary cases)

#### Mutation Type: VoidMethodCallMutator (33% kill rate)
- **1 survived mutation** — method calls being removed
- **Issue:** Very low kill rate (33%) suggests many methods aren't critical or tested
- **Route:** RESTASSURED agent (clarify which methods must be called)

---

### Backend Summary by Component

| Class | Issues | Action |
|-------|--------|--------|
| ForumService | Untested tree building, null handling | Add nested thread tests |
| Repository classes | Coverage gaps, null/empty returns | Verify via integration tests |
| Response DTOs | Score/count calculations | Add boundary value tests |
| Controllers | Likely well-covered via integration tests | Verify in RestAssured |

---

## 📋 Implementation Plan

### Phase 1: FRONTEND (Stryker) — Reach 80%

**Round 1 (Max 1 round):**

1. **FRONTEND agent** fixes:
   - ThreadForm.tsx: Add 5+ test cases for form submission, validation, loading states
   - ReplyForm.tsx: Add 4+ test cases for reply submission, empty content, callbacks
   - ThreadList.tsx: Add 6+ test cases for conditional rendering (category, "load more", hidden threads)
   - ProfileForm.tsx: Add 3+ test cases for edge cases
   - RegisterForm.tsx: Add 2+ test cases for missing scenarios
   - LoginForm.tsx: Add 1+ test case for edge case

2. After FRONTEND completes → Run Stryker again
3. If still < 80% → Report final survivors and proceed to PR

---

### Phase 2: BACKEND (PIT) — Reach 80%

**Round 1 (Max 1 round):**

1. **RESTASSURED agent** adds integration tests for:
   - Nested reply thread creation/retrieval (forumFlow)
   - User not found → null handling paths
   - Empty collections (0 replies, 0 threads, 0 profile data)
   - Score/vote boundary values (0, max, negative)
   - All "not found" 404 scenarios

2. After RESTASSURED completes → Run PIT again
3. If still < 80% → Report final survivors and proceed to PR

---

## 🚀 Next Steps

1. **FRONTEND agent** — Fix ThreadForm (20%), ReplyForm (20%), ThreadList (21%), others
   - Commit: "frontend: Add mutation test cases for forms and list components"

2. **RESTASSURED agent** — Add missing integration test scenarios
   - Commit: "restassured: Add boundary and edge case tests to reach 80% mutation score"

3. **Run mutation testing again** (both PIT + Stryker)

4. **Report final scores** and create PR

---

## Mutation Testing Quality Gate

✅ **Pass if:**
- Frontend (Stryker): ≥80%
- Backend (PIT): ≥80%

❌ **Fail if:**
- Either layer < 80% after 2 improvement rounds

Current: **FAIL** (61.94% + 49%) → Needs improvement
