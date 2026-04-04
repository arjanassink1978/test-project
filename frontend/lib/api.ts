import type { UserProfile, UpdateProfileRequest, ProfileUpdateResponse } from "@/types/profile";

const API_BASE = "http://localhost:8080";

export async function getProfile(username: string): Promise<UserProfile> {
  const response = await fetch(`${API_BASE}/api/profile/${username}`, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch profile: ${response.status}`);
  }

  return response.json() as Promise<UserProfile>;
}

export async function updateProfile(
  username: string,
  data: UpdateProfileRequest
): Promise<ProfileUpdateResponse> {
  const response = await fetch(`${API_BASE}/api/profile/${username}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const body = (await response.json().catch(() => ({}))) as {
      message?: string;
    };
    throw new Error(body.message ?? `Failed to update profile: ${response.status}`);
  }

  return response.json() as Promise<ProfileUpdateResponse>;
}

export async function uploadAvatar(
  username: string,
  file: File
): Promise<ProfileUpdateResponse> {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch(`${API_BASE}/api/profile/${username}/avatar`, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    const body = (await response.json().catch(() => ({}))) as {
      message?: string;
    };
    throw new Error(body.message ?? `Failed to upload avatar: ${response.status}`);
  }

  return response.json() as Promise<ProfileUpdateResponse>;
}

export async function deleteAvatar(
  username: string
): Promise<ProfileUpdateResponse> {
  const response = await fetch(`${API_BASE}/api/profile/${username}/avatar`, {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
  });

  if (!response.ok) {
    const body = (await response.json().catch(() => ({}))) as {
      message?: string;
    };
    throw new Error(body.message ?? `Failed to delete avatar: ${response.status}`);
  }

  return response.json() as Promise<ProfileUpdateResponse>;
}

// -------------------------------------------------------------------------
// Forum API — types
// -------------------------------------------------------------------------

export interface ForumCategory {
  id: number;
  name: string;
  description: string;
  icon: string;
}

export interface ForumThreadResponse {
  id: number;
  title: string;
  description: string;
  score: number;
  createdAt: string;
  updatedAt: string;
  authorUsername: string;
  categoryId: number;
  categoryName: string;
  replyCount: number;
  closed: boolean;
}

export interface ForumReplyResponse {
  id: number;
  content: string;
  score: number;
  createdAt: string;
  authorUsername: string;
  depth: number;
  parentReplyId: number | null;
  replies: ForumReplyResponse[];
}

export interface ForumThreadDetailResponse extends ForumThreadResponse {
  replies: ForumReplyResponse[];
}

export interface PagedThreadsResponse {
  threads: ForumThreadResponse[];
  page: number;
  size: number;
  hasMore: boolean;
}

export interface VoteResponse {
  postId: number;
  postType: string;
  newScore: number;
  userVote: number;
}

// -------------------------------------------------------------------------
// Forum API — functions
// -------------------------------------------------------------------------

export async function getForumCategories(): Promise<ForumCategory[]> {
  const response = await fetch(`${API_BASE}/api/forum/categories`);
  if (!response.ok) {
    throw new Error(`Failed to fetch categories: ${response.status}`);
  }
  return response.json() as Promise<ForumCategory[]>;
}

export async function getForumThreads(params: {
  category?: number;
  sort?: string;
  page?: number;
  search?: string;
}): Promise<PagedThreadsResponse> {
  const query = new URLSearchParams();
  if (params.category != null) query.set("category", String(params.category));
  if (params.sort) query.set("sort", params.sort);
  if (params.page != null) query.set("page", String(params.page));
  if (params.search) query.set("search", params.search);

  const response = await fetch(`${API_BASE}/api/forum/threads?${query}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch threads: ${response.status}`);
  }
  return response.json() as Promise<PagedThreadsResponse>;
}

export async function getForumThread(id: number): Promise<ForumThreadDetailResponse> {
  const response = await fetch(`${API_BASE}/api/forum/threads/${id}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch thread: ${response.status}`);
  }
  return response.json() as Promise<ForumThreadDetailResponse>;
}

function bearerAuth(token: string): string {
  return `Bearer ${token}`;
}

export async function createForumThread(
  data: { title: string; description?: string; categoryId?: number },
  token: string
): Promise<ForumThreadResponse> {
  const response = await fetch(`${API_BASE}/api/forum/threads`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: bearerAuth(token),
    },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const body = (await response.json().catch(() => ({}))) as { message?: string };
    throw new Error(body.message ?? `Failed to create thread: ${response.status}`);
  }
  return response.json() as Promise<ForumThreadResponse>;
}

export async function createForumReply(
  threadId: number,
  data: { content: string; parentReplyId?: number },
  token: string
): Promise<ForumReplyResponse> {
  const response = await fetch(`${API_BASE}/api/forum/threads/${threadId}/replies`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: bearerAuth(token),
    },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const body = (await response.json().catch(() => ({}))) as { message?: string };
    throw new Error(body.message ?? `Failed to create reply: ${response.status}`);
  }
  return response.json() as Promise<ForumReplyResponse>;
}

export async function voteOnPost(
  postId: number,
  postType: "thread" | "reply",
  voteValue: number,
  token: string
): Promise<VoteResponse> {
  const response = await fetch(
    `${API_BASE}/api/forum/posts/${postId}/vote?postType=${postType}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: bearerAuth(token),
      },
      body: JSON.stringify({ voteValue }),
    }
  );
  if (!response.ok) {
    const body = (await response.json().catch(() => ({}))) as { message?: string };
    throw new Error(body.message ?? `Failed to vote: ${response.status}`);
  }
  return response.json() as Promise<VoteResponse>;
}

export async function closeThread(
  threadId: number,
  closed: boolean,
  token: string
): Promise<ForumThreadResponse> {
  const response = await fetch(
    `${API_BASE}/api/forum/threads/${threadId}/close?closed=${closed}`,
    {
      method: "POST",
      headers: {
        Authorization: bearerAuth(token),
      },
    }
  );
  if (!response.ok) {
    const body = (await response.json().catch(() => ({}))) as { message?: string };
    if (response.status === 403) {
      throw new Error("You don't have permission to close threads");
    }
    throw new Error(body.message ?? `Failed to close thread: ${response.status}`);
  }
  return response.json() as Promise<ForumThreadResponse>;
}

export async function deleteReply(
  replyId: number,
  token: string
): Promise<void> {
  const response = await fetch(`${API_BASE}/api/forum/replies/${replyId}`, {
    method: "DELETE",
    headers: {
      Authorization: bearerAuth(token),
    },
  });
  if (!response.ok) {
    if (response.status === 403) {
      throw new Error("You don't have permission to delete replies");
    }
    throw new Error(`Failed to delete reply: ${response.status}`);
  }
}
