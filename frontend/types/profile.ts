export interface UserProfile {
  username: string;
  email: string;
  displayName: string | null;
  bio: string | null;
  location: string | null;
  avatarUrl: string | null;
}

export interface UpdateProfileRequest {
  displayName: string;
  bio: string;
  location: string;
}

export interface ProfileUpdateResponse {
  success: boolean;
  message: string;
}
