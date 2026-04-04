/**
 * Forum fixture helpers for API-based setup
 * Use these to create test data (threads, replies) via API instead of UI
 */

import { API_BASE } from "../config";

export interface ThreadData {
  title: string;
  description: string;
  categoryId?: number;
}

export interface ReplyData {
  content: string;
  parentReplyId?: number | null;
}

async function fetchBearerToken(credentials: { username: string; password: string }): Promise<string> {
  const res = await fetch(`${API_BASE}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username: credentials.username, password: credentials.password }),
  });
  if (!res.ok) throw new Error(`Failed to authenticate: ${res.status}`);
  const data = await res.json() as { token?: string };
  if (!data.token) throw new Error("No token returned from auth API");
  return data.token;
}

/**
 * Creates a forum thread via API using JWT Bearer auth.
 * Returns the thread ID.
 */
export async function createThreadViaApi(
  title: string,
  description: string,
  credentials: { username: string; password: string }
): Promise<number> {
  const token = await fetchBearerToken(credentials);
  const res = await fetch(`${API_BASE}/api/forum/threads`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`,
    },
    body: JSON.stringify({ title, description }),
  });
  if (!res.ok) throw new Error(`Failed to create thread: ${res.status}`);
  const data = await res.json() as { id: number };
  return data.id;
}

/**
 * Creates a forum reply (top-level or nested) via API using JWT Bearer auth.
 * Returns the reply ID.
 */
export async function createReplyViaApi(
  threadId: number,
  content: string,
  credentials: { username: string; password: string },
  parentReplyId?: number
): Promise<number> {
  const token = await fetchBearerToken(credentials);
  const body: Record<string, unknown> = { content };
  if (parentReplyId !== undefined && parentReplyId !== null) {
    body.parentReplyId = parentReplyId;
  }

  const res = await fetch(`${API_BASE}/api/forum/threads/${threadId}/replies`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`Failed to create reply: ${res.status}`);
  const data = await res.json() as { id: number };
  return data.id;
}

/**
 * Closes a forum thread via API (admin/moderator only).
 */
export async function closeThreadViaApi(
  threadId: number,
  credentials: { username: string; password: string }
): Promise<void> {
  const token = await fetchBearerToken(credentials);
  const res = await fetch(`${API_BASE}/api/forum/threads/${threadId}/close?closed=true`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${token}`,
    },
  });
  if (!res.ok) throw new Error(`Failed to close thread: ${res.status}`);
}

/**
 * Deletes a forum thread via API.
 */
export async function deleteThreadViaApi(
  threadId: number,
  credentials: { username: string; password: string }
): Promise<void> {
  const token = await fetchBearerToken(credentials);
  const res = await fetch(`${API_BASE}/api/forum/threads/${threadId}`, {
    method: "DELETE",
    headers: {
      "Authorization": `Bearer ${token}`,
    },
  });
  if (!res.ok) throw new Error(`Failed to delete thread: ${res.status}`);
}
