/**
 * Forum cross-layer constraints.
 *
 * These values MUST stay in sync with backend validation annotations.
 * When changing any value here, update the corresponding @Size/@Min/@Max
 * annotation in the backend DTO and the boundary tests in RestAssured.
 */

// CONSTRAINT: these values MUST match backend validation annotations
export const FORUM_CONSTRAINTS = {
  THREAD_TITLE_MAX: 200,       // CONSTRAINT: max 200 — must match backend @Size(max=200) on CreateThreadRequest.title
  THREAD_DESC_MAX: 5000,       // CONSTRAINT: max 5000 — must match backend @Size(max=5000) on CreateThreadRequest.description
  REPLY_CONTENT_MAX: 2000,     // CONSTRAINT: max 2000 — must match backend @Size(max=2000) on CreateReplyRequest.content
  MAX_REPLY_DEPTH: 3,          // CONSTRAINT: max 3 levels deep — backend rejects depth >= 3
  PAGE_SIZE: 20,               // CONSTRAINT: must match backend PAGE_SIZE constant in ForumService
  HIDDEN_SCORE_THRESHOLD: -5,  // CONSTRAINT: posts hidden below -5 — must match backend HIDDEN_SCORE_THRESHOLD
} as const;
