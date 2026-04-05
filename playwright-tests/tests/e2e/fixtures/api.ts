import { API_BASE } from "../config";

export interface CreateThreadPayload {
  title: string;
  description: string;
  categoryId: number;
}

export interface CreateReplyPayload {
  content: string;
  parentReplyId?: number | null;
}

export async function createThreadViaApi(
  token: string,
  payload: CreateThreadPayload
): Promise<{ id: number }> {
  const response = await fetch(`${API_BASE}/api/forum/threads`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(`Failed to create thread: ${response.status}`);
  }

  const data = (await response.json()) as { id?: number };
  if (!data.id) {
    throw new Error("No thread ID in response");
  }

  return { id: data.id };
}

export async function createReplyViaApi(
  token: string,
  threadId: number,
  payload: CreateReplyPayload
): Promise<{ id: number }> {
  const response = await fetch(`${API_BASE}/api/forum/threads/${threadId}/replies`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(`Failed to create reply: ${response.status}`);
  }

  const data = (await response.json()) as { id?: number };
  if (!data.id) {
    throw new Error("No reply ID in response");
  }

  return { id: data.id };
}

export async function closeThreadViaApi(
  token: string,
  threadId: number,
  closed: boolean
): Promise<void> {
  const response = await fetch(`${API_BASE}/api/forum/threads/${threadId}/close?closed=${closed}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to close thread: ${response.status}`);
  }
}

export async function deleteThreadViaApi(token: string, threadId: number): Promise<void> {
  const response = await fetch(`${API_BASE}/api/forum/threads/${threadId}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to delete thread: ${response.status}`);
  }
}

export async function deleteReplyViaApi(token: string, replyId: number): Promise<void> {
  const response = await fetch(`${API_BASE}/api/forum/replies/${replyId}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to delete reply: ${response.status}`);
  }
}

export async function updateProfileViaApi(
  token: string,
  username: string,
  data: {
    displayName?: string;
    bio?: string;
    location?: string;
  }
): Promise<void> {
  const response = await fetch(`${API_BASE}/api/profile/${username}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error(`Failed to update profile: ${response.status}`);
  }
}

export async function deleteAvatarViaApi(token: string, username: string): Promise<void> {
  const response = await fetch(`${API_BASE}/api/profile/${username}/avatar`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to delete avatar: ${response.status}`);
  }
}

export async function getProfileViaApi(username: string): Promise<{
  username: string;
  email: string;
  displayName?: string;
  bio?: string;
  location?: string;
  avatarUrl?: string;
}> {
  const response = await fetch(`${API_BASE}/api/profile/${username}`);

  if (!response.ok) {
    throw new Error(`Failed to fetch profile: ${response.status}`);
  }

  return response.json();
}

export async function updateUserRoleViaApi(
  token: string,
  userId: number,
  role: string
): Promise<void> {
  const response = await fetch(`${API_BASE}/api/admin/users/${userId}/role`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ role }),
  });

  if (!response.ok) {
    throw new Error(`Failed to update user role: ${response.status}`);
  }
}

export async function searchUsersViaApi(
  token: string,
  query: string,
  page: number = 0,
  size: number = 20
): Promise<{
  content: Array<{ id: number; username: string; email: string; role: string }>;
  hasMore: boolean;
}> {
  const response = await fetch(
    `${API_BASE}/api/admin/users?query=${encodeURIComponent(query)}&page=${page}&size=${size}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  if (!response.ok) {
    throw new Error(`Failed to search users: ${response.status}`);
  }

  return response.json();
}

export async function createCategoryViaApi(
  token: string,
  data: {
    name: string;
    description?: string;
    icon?: string;
  }
): Promise<{ id: number; name: string }> {
  const response = await fetch(`${API_BASE}/api/admin/categories`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error(`Failed to create category: ${response.status}`);
  }

  return response.json();
}

export async function updateCategoryViaApi(
  token: string,
  categoryId: number,
  data: {
    name: string;
    description?: string;
    icon?: string;
  }
): Promise<void> {
  const response = await fetch(`${API_BASE}/api/admin/categories/${categoryId}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error(`Failed to update category: ${response.status}`);
  }
}

export async function deleteCategoryViaApi(token: string, categoryId: number): Promise<void> {
  const response = await fetch(`${API_BASE}/api/admin/categories/${categoryId}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to delete category: ${response.status}`);
  }
}
