"use client";

import { useState, useEffect, useRef, ChangeEvent } from "react";
import LogoutButton from "@/components/LogoutButton";
import { getProfile, updateProfile, uploadAvatar, deleteAvatar } from "@/lib/api";
import type { UserProfile } from "@/types/profile";
import {
  alert,
  avatar,
  button,
  card,
  input,
  typography,
} from "@/lib/theme";

interface ProfileFormProps {
  username: string;
}

type AlertKind = "success" | "error";

interface Alert {
  kind: AlertKind;
  message: string;
}

function validateForm(
  displayName: string,
  bio: string,
  location: string
): string | null {
  if (displayName.length > 100) {
    return "Weergavenaam mag maximaal 100 tekens bevatten";
  }
  if (bio.length > 500) {
    return "Biografie mag maximaal 500 tekens bevatten";
  }
  if (location.length > 100) {
    return "Locatie mag maximaal 100 tekens bevatten";
  }
  return null;
}

export default function ProfileForm({ username }: ProfileFormProps) {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [location, setLocation] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [deletingAvatar, setDeletingAvatar] = useState(false);
  const [alertState, setAlertState] = useState<Alert | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      try {
        const data = await getProfile(username);
        if (!cancelled) {
          setProfile(data);
          setDisplayName(data.displayName ?? "");
          setBio(data.bio ?? "");
          setLocation(data.location ?? "");
        }
      } catch {
        if (!cancelled) {
          setAlertState({ kind: "error", message: "Profiel kon niet worden geladen." });
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [username]);

  function showAlert(kind: AlertKind, message: string) {
    setAlertState({ kind, message });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function handleSave() {
    const validationError = validateForm(displayName, bio, location);
    if (validationError) {
      showAlert("error", validationError);
      return;
    }

    setSaving(true);
    setAlertState(null);
    try {
      await updateProfile(username, { displayName, bio, location });
      setProfile((prev) =>
        prev ? { ...prev, displayName, bio, location } : prev
      );
      showAlert("success", "Profiel succesvol opgeslagen.");
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Opslaan mislukt. Probeer het later opnieuw.";
      showAlert("error", message);
    } finally {
      setSaving(false);
    }
  }

  async function handleAvatarChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    if (!allowedTypes.includes(file.type)) {
      showAlert("error", "Alleen JPEG, PNG, WebP of GIF bestanden zijn toegestaan.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      showAlert("error", "Bestand mag maximaal 5 MB zijn.");
      return;
    }

    setUploadingAvatar(true);
    setAlertState(null);
    try {
      await uploadAvatar(username, file);
      const updated = await getProfile(username);
      setProfile(updated);
      showAlert("success", "Avatar succesvol geupload.");
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Avatar uploaden mislukt.";
      showAlert("error", message);
    } finally {
      setUploadingAvatar(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  async function handleDeleteAvatar() {
    setDeletingAvatar(true);
    setAlertState(null);
    try {
      await deleteAvatar(username);
      setProfile((prev) => (prev ? { ...prev, avatarUrl: null } : prev));
      showAlert("success", "Avatar succesvol verwijderd.");
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Avatar verwijderen mislukt.";
      showAlert("error", message);
    } finally {
      setDeletingAvatar(false);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="flex items-center gap-3 text-gray-600">
          <svg
            className="h-5 w-5 animate-spin"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
            />
          </svg>
          <span className="text-sm">Profiel laden…</span>
        </div>
      </div>
    );
  }

  return (
    <main className="flex min-h-screen flex-col items-center px-4 py-12">
      <div className="w-full max-w-xl space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between" data-testid="profile-header">
          <h1 className={typography.pageHeading} data-testid="profile-heading">
            Mijn profiel
          </h1>
          <LogoutButton />
        </div>

        {/* Alert */}
        {alertState && (
          <div
            role="alert"
            data-testid="profile-alert"
            className={alertState.kind === "success" ? alert.success : alert.error}
          >
            {alertState.message}
          </div>
        )}

        {/* Avatar section */}
        <div className={card.padded} data-testid="avatar-section">
          <h2 className={`mb-4 ${typography.sectionHeading}`} data-testid="avatar-heading">Avatar</h2>
          <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start">
            <div className="flex-shrink-0">
              {profile?.avatarUrl ? (
                <img
                  src={profile.avatarUrl}
                  alt={`Avatar van ${username}`}
                  data-testid="avatar-image"
                  className={avatar.image}
                />
              ) : (
                <div className={avatar.placeholder} data-testid="avatar-placeholder">
                  <span className={avatar.initial}>
                    {username.charAt(0).toUpperCase()}
                  </span>
                </div>
              )}
            </div>
            <div className="flex flex-col gap-2">
              <input
                ref={fileInputRef}
                id="avatar-upload"
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                className="sr-only"
                onChange={handleAvatarChange}
                disabled={uploadingAvatar || deletingAvatar}
                aria-label="Avatar uploaden"
                data-testid="avatar-upload-input"
              />
              <label
                htmlFor="avatar-upload"
                data-testid="avatar-upload-label"
                className={`${button.secondary} cursor-pointer${
                  uploadingAvatar || deletingAvatar ? " cursor-not-allowed opacity-50" : ""
                }`}
              >
                {uploadingAvatar ? "Uploaden…" : "Nieuwe avatar uploaden"}
              </label>
              {profile?.avatarUrl && (
                <button
                  type="button"
                  onClick={handleDeleteAvatar}
                  disabled={deletingAvatar || uploadingAvatar}
                  data-testid="delete-avatar-button"
                  className={button.danger}
                >
                  {deletingAvatar ? "Verwijderen…" : "Avatar verwijderen"}
                </button>
              )}
              <p className="text-xs text-gray-500">
                JPEG, PNG, WebP of GIF. Maximaal 5 MB.
              </p>
            </div>
          </div>
        </div>

        {/* Profile info (read-only) */}
        <div className={card.padded} data-testid="account-info-section">
          <h2 className={`mb-4 ${typography.sectionHeading}`} data-testid="account-info-heading">
            Accountgegevens
          </h2>
          <dl className="space-y-3">
            <div>
              <dt className={typography.metaLabel}>
                Gebruikersnaam
              </dt>
              <dd className={typography.bodyValue} data-testid="profile-username">{profile?.username}</dd>
            </div>
            <div>
              <dt className={typography.metaLabel}>
                E-mail
              </dt>
              <dd className={typography.bodyValue} data-testid="profile-email">{profile?.email}</dd>
            </div>
          </dl>
        </div>

        {/* Editable fields */}
        <div className={card.padded} data-testid="edit-profile-section">
          <h2 className={`mb-4 ${typography.sectionHeading}`} data-testid="edit-profile-heading">
            Profielinformatie bewerken
          </h2>
          <div className="space-y-4" data-testid="edit-profile-form">
            <div>
              <label
                htmlFor="displayName"
                className={typography.label}
              >
                Weergavenaam
              </label>
              <input
                id="displayName"
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                disabled={saving}
                maxLength={100}
                placeholder="Voer uw weergavenaam in"
                data-testid="display-name-input"
                className={input.base}
              />
            </div>

            <div>
              <label
                htmlFor="bio"
                className={typography.label}
              >
                Biografie
              </label>
              <textarea
                id="bio"
                rows={4}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                disabled={saving}
                maxLength={500}
                placeholder="Vertel iets over uzelf"
                data-testid="bio-input"
                className={input.textarea}
              />
              <p className={typography.charCounter}>
                {bio.length}/500
              </p>
            </div>

            <div>
              <label
                htmlFor="location"
                className={typography.label}
              >
                Locatie
              </label>
              <input
                id="location"
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                disabled={saving}
                maxLength={100}
                placeholder="Voer uw locatie in"
                data-testid="location-input"
                className={input.base}
              />
            </div>

            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              data-testid="save-button"
              className={button.primary}
            >
              {saving ? (
                <>
                  <svg
                    className={button.spinner}
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                    />
                  </svg>
                  Opslaan…
                </>
              ) : (
                "Opslaan"
              )}
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
