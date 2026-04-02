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
  formData.append("avatar", file);

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
