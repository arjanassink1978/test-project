"use client";

import { useState, useEffect, useRef, ChangeEvent } from "react";
import LogoutButton from "@/components/LogoutButton";
import { getProfile, updateProfile, uploadAvatar, deleteAvatar } from "@/lib/api";
import type { UserProfile } from "@/types/profile";

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
  const [alert, setAlert] = useState<Alert | null>(null);
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
          setAlert({ kind: "error", message: "Profiel kon niet worden geladen." });
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
    setAlert({ kind, message });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function handleSave() {
    const validationError = validateForm(displayName, bio, location);
    if (validationError) {
      showAlert("error", validationError);
      return;
    }

    setSaving(true);
    setAlert(null);
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
    setAlert(null);
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
    setAlert(null);
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
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">
            Mijn profiel
          </h1>
          <LogoutButton />
        </div>

        {/* Alert */}
        {alert && (
          <div
            role="alert"
            className={`rounded-md border px-4 py-3 text-sm ${
              alert.kind === "success"
                ? "border-green-200 bg-green-50 text-green-700"
                : "border-red-200 bg-red-50 text-red-700"
            }`}
          >
            {alert.message}
          </div>
        )}

        {/* Avatar section */}
        <div className="rounded-xl bg-white px-6 py-6 shadow-md ring-1 ring-gray-900/5">
          <h2 className="mb-4 text-base font-semibold text-gray-900">Avatar</h2>
          <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start">
            <div className="flex-shrink-0">
              {profile?.avatarUrl ? (
                <img
                  src={profile.avatarUrl}
                  alt={`Avatar van ${username}`}
                  className="h-24 w-24 rounded-full object-cover ring-2 ring-gray-200"
                />
              ) : (
                <div className="flex h-24 w-24 items-center justify-center rounded-full bg-indigo-100 ring-2 ring-gray-200">
                  <span className="text-2xl font-bold text-indigo-600">
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
              />
              <label
                htmlFor="avatar-upload"
                className={`inline-flex cursor-pointer items-center justify-center rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 transition-colors ${
                  uploadingAvatar || deletingAvatar
                    ? "cursor-not-allowed opacity-50"
                    : ""
                }`}
              >
                {uploadingAvatar ? "Uploaden…" : "Nieuwe avatar uploaden"}
              </label>
              {profile?.avatarUrl && (
                <button
                  type="button"
                  onClick={handleDeleteAvatar}
                  disabled={deletingAvatar || uploadingAvatar}
                  className="inline-flex items-center justify-center rounded-lg border border-red-200 bg-white px-4 py-2 text-sm font-medium text-red-600 shadow-sm hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50 transition-colors"
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
        <div className="rounded-xl bg-white px-6 py-6 shadow-md ring-1 ring-gray-900/5">
          <h2 className="mb-4 text-base font-semibold text-gray-900">
            Accountgegevens
          </h2>
          <dl className="space-y-3">
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-gray-500">
                Gebruikersnaam
              </dt>
              <dd className="mt-1 text-sm text-gray-900">{profile?.username}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-gray-500">
                E-mail
              </dt>
              <dd className="mt-1 text-sm text-gray-900">{profile?.email}</dd>
            </div>
          </dl>
        </div>

        {/* Editable fields */}
        <div className="rounded-xl bg-white px-6 py-6 shadow-md ring-1 ring-gray-900/5">
          <h2 className="mb-4 text-base font-semibold text-gray-900">
            Profielinformatie bewerken
          </h2>
          <div className="space-y-4">
            <div>
              <label
                htmlFor="displayName"
                className="block text-sm font-medium text-gray-700 mb-1"
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
                className="block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 placeholder-gray-400 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:cursor-not-allowed disabled:opacity-50 sm:text-sm"
              />
            </div>

            <div>
              <label
                htmlFor="bio"
                className="block text-sm font-medium text-gray-700 mb-1"
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
                className="block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 placeholder-gray-400 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:cursor-not-allowed disabled:opacity-50 sm:text-sm resize-none"
              />
              <p className="mt-1 text-xs text-gray-400 text-right">
                {bio.length}/500
              </p>
            </div>

            <div>
              <label
                htmlFor="location"
                className="block text-sm font-medium text-gray-700 mb-1"
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
                className="block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 placeholder-gray-400 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:cursor-not-allowed disabled:opacity-50 sm:text-sm"
              />
            </div>

            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="flex w-full items-center justify-center rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:cursor-not-allowed disabled:opacity-50 transition-colors"
            >
              {saving ? (
                <>
                  <svg
                    className="mr-2 h-4 w-4 animate-spin"
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
