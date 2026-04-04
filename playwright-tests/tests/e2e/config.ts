/**
 * Playwright E2E Test Configuration
 * Centralized constants and configuration for all E2E tests
 */

// Backend API base URL
export const API_BASE = "http://localhost:8080";

// Frontend base URL
export const FRONTEND_BASE = "http://localhost:3000";

// Timeouts (in milliseconds)
export const TIMEOUTS = {
  DEFAULT: 5000,
  LONG: 10000,
  NAVIGATION: 10000,
} as const;

// Test user credentials (from auth fixture defaults)
export const DEFAULT_USER = {
  username: "testuser",
  password: "testpass123",
  email: "testuser@example.com",
} as const;
