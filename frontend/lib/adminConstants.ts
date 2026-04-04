/**
 * Admin panel cross-layer constraints.
 *
 * These values MUST stay in sync with backend validation annotations.
 * When changing any value here, update the corresponding @Size/@Min/@Max
 * annotation in the backend DTO.
 */

// CONSTRAINT: max 50 — must match backend @Size(max=50) on ForumCategory.name
export const CATEGORY_NAME_MAX = 50;

// CONSTRAINT: max 200 — must match backend @Size(max=200) on ForumCategory.description
export const CATEGORY_DESCRIPTION_MAX = 200;
