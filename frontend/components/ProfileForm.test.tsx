/**
 * @jest-environment jsdom
 */
import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import ProfileForm from "./ProfileForm";

// --- Module mocks -----------------------------------------------------------

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: jest.fn() }),
}));

jest.mock("@/components/LogoutButton", () => {
  const MockLogoutButton = () => <button type="button">Logout</button>;
  MockLogoutButton.displayName = "MockLogoutButton";
  return MockLogoutButton;
});

jest.mock("@/lib/api", () => ({
  getProfile: jest.fn(),
  updateProfile: jest.fn(),
  uploadAvatar: jest.fn(),
  deleteAvatar: jest.fn(),
}));

import { getProfile, updateProfile, uploadAvatar, deleteAvatar } from "@/lib/api";

const mockGetProfile = getProfile as jest.Mock;
const mockUpdateProfile = updateProfile as jest.Mock;
const mockUploadAvatar = uploadAvatar as jest.Mock;
const mockDeleteAvatar = deleteAvatar as jest.Mock;

// Mock scrollTo so jsdom does not throw
global.scrollTo = jest.fn() as unknown as typeof global.scrollTo;

// ---------------------------------------------------------------------------

const baseProfile = {
  username: "testuser",
  email: "test@example.com",
  displayName: "Test User",
  bio: "Hello world",
  location: "Amsterdam",
  avatarUrl: null,
};

async function waitForLoad() {
  await waitFor(() =>
    expect(screen.queryByText(/profiel laden/i)).not.toBeInTheDocument()
  );
}

describe("ProfileForm", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // Loading state
  it("shows a loading spinner while fetching profile", () => {
    mockGetProfile.mockReturnValue(new Promise(() => {}));
    render(<ProfileForm username="testuser" />);
    expect(screen.getByText(/profiel laden/i)).toBeInTheDocument();
  });

  // Profile load
  it("renders profile data after loading", async () => {
    mockGetProfile.mockResolvedValueOnce(baseProfile);
    render(<ProfileForm username="testuser" />);
    await waitForLoad();

    expect(screen.getByText("testuser")).toBeInTheDocument();
    expect(screen.getByText("test@example.com")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Test User")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Hello world")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Amsterdam")).toBeInTheDocument();
  });

  it("populates displayName input from loaded profile (not empty string)", async () => {
    mockGetProfile.mockResolvedValueOnce(baseProfile);
    render(<ProfileForm username="testuser" />);
    await waitForLoad();

    const input = screen.getByTestId("display-name-input");
    expect(input).toHaveValue("Test User");
    expect(input).not.toHaveValue("");
  });

  it("populates bio textarea from loaded profile (not empty string)", async () => {
    mockGetProfile.mockResolvedValueOnce(baseProfile);
    render(<ProfileForm username="testuser" />);
    await waitForLoad();

    const textarea = screen.getByTestId("bio-input");
    expect(textarea).toHaveValue("Hello world");
    expect(textarea).not.toHaveValue("");
  });

  it("populates location input from loaded profile (not empty string)", async () => {
    mockGetProfile.mockResolvedValueOnce(baseProfile);
    render(<ProfileForm username="testuser" />);
    await waitForLoad();

    const input = screen.getByTestId("location-input");
    expect(input).toHaveValue("Amsterdam");
    expect(input).not.toHaveValue("");
  });

  it("uses empty string initial value when profile fields are null", async () => {
    mockGetProfile.mockResolvedValueOnce({
      ...baseProfile,
      displayName: null,
      bio: null,
      location: null,
    });
    render(<ProfileForm username="testuser" />);
    await waitForLoad();

    expect(screen.getByTestId("display-name-input")).toHaveValue("");
    expect(screen.getByTestId("bio-input")).toHaveValue("");
    expect(screen.getByTestId("location-input")).toHaveValue("");
  });

  it("calls getProfile with the provided username", async () => {
    mockGetProfile.mockResolvedValueOnce(baseProfile);
    render(<ProfileForm username="specificuser" />);
    await waitForLoad();
    expect(mockGetProfile).toHaveBeenCalledWith("specificuser");
  });

  // Error on load
  it("shows error alert when profile loading fails", async () => {
    mockGetProfile.mockRejectedValueOnce(new Error("Network error"));
    render(<ProfileForm username="testuser" />);

    await waitFor(() =>
      expect(screen.getByText(/profiel kon niet worden geladen/i)).toBeInTheDocument()
    );
  });

  // Rendered test IDs
  it("renders key data-testid attributes after loading", async () => {
    mockGetProfile.mockResolvedValueOnce(baseProfile);
    render(<ProfileForm username="testuser" />);
    await waitForLoad();

    expect(screen.getByTestId("profile-heading")).toBeInTheDocument();
    expect(screen.getByTestId("avatar-section")).toBeInTheDocument();
    expect(screen.getByTestId("account-info-section")).toBeInTheDocument();
    expect(screen.getByTestId("profile-username")).toHaveTextContent("testuser");
    expect(screen.getByTestId("profile-email")).toHaveTextContent("test@example.com");
    expect(screen.getByTestId("edit-profile-section")).toBeInTheDocument();
    expect(screen.getByTestId("display-name-input")).toBeInTheDocument();
    expect(screen.getByTestId("bio-input")).toBeInTheDocument();
    expect(screen.getByTestId("location-input")).toBeInTheDocument();
    expect(screen.getByTestId("save-button")).toBeInTheDocument();
    expect(screen.getByTestId("avatar-upload-input")).toBeInTheDocument();
  });

  // onChange handlers — verify state actually updates
  it("updates displayName when typing in the input", async () => {
    mockGetProfile.mockResolvedValueOnce(baseProfile);
    render(<ProfileForm username="testuser" />);
    await waitForLoad();

    const input = screen.getByTestId("display-name-input");
    fireEvent.change(input, { target: { value: "New Name" } });
    expect(input).toHaveValue("New Name");
    expect(input).not.toHaveValue("Test User");
  });

  it("updates bio when typing in the textarea", async () => {
    mockGetProfile.mockResolvedValueOnce(baseProfile);
    render(<ProfileForm username="testuser" />);
    await waitForLoad();

    const textarea = screen.getByTestId("bio-input");
    fireEvent.change(textarea, { target: { value: "New bio text" } });
    expect(textarea).toHaveValue("New bio text");
    expect(textarea).not.toHaveValue("Hello world");
  });

  it("updates location when typing in the input", async () => {
    mockGetProfile.mockResolvedValueOnce(baseProfile);
    render(<ProfileForm username="testuser" />);
    await waitForLoad();

    const input = screen.getByTestId("location-input");
    fireEvent.change(input, { target: { value: "Rotterdam" } });
    expect(input).toHaveValue("Rotterdam");
    expect(input).not.toHaveValue("Amsterdam");
  });

  it("bio character counter reflects current bio length", async () => {
    mockGetProfile.mockResolvedValueOnce({ ...baseProfile, bio: "AB" });
    render(<ProfileForm username="testuser" />);
    await waitForLoad();

    expect(screen.getByText("2/500")).toBeInTheDocument();

    fireEvent.change(screen.getByTestId("bio-input"), { target: { value: "ABCDE" } });
    expect(screen.getByText("5/500")).toBeInTheDocument();
  });

  // Save / updateProfile
  it("calls updateProfile with the correct arguments on save", async () => {
    mockGetProfile.mockResolvedValueOnce(baseProfile);
    mockUpdateProfile.mockResolvedValueOnce({ success: true, message: "ok" });
    render(<ProfileForm username="testuser" />);
    await waitForLoad();

    fireEvent.change(screen.getByTestId("display-name-input"), { target: { value: "New Name" } });
    fireEvent.click(screen.getByTestId("save-button"));

    await waitFor(() =>
      expect(screen.getByText(/profiel succesvol opgeslagen/i)).toBeInTheDocument()
    );

    expect(mockUpdateProfile).toHaveBeenCalledWith("testuser", {
      displayName: "New Name",
      bio: "Hello world",
      location: "Amsterdam",
    });
  });

  it("calls updateProfile with the username prop, not a hardcoded value", async () => {
    mockGetProfile.mockResolvedValueOnce(baseProfile);
    mockUpdateProfile.mockResolvedValueOnce({ success: true, message: "ok" });
    render(<ProfileForm username="differentuser" />);
    await waitForLoad();

    fireEvent.click(screen.getByTestId("save-button"));

    await waitFor(() => expect(mockUpdateProfile).toHaveBeenCalled());
    expect(mockUpdateProfile).toHaveBeenCalledWith(
      "differentuser",
      expect.objectContaining({ displayName: "Test User" })
    );
  });

  it("shows success alert after saving", async () => {
    mockGetProfile.mockResolvedValueOnce(baseProfile);
    mockUpdateProfile.mockResolvedValueOnce({ success: true, message: "ok" });
    render(<ProfileForm username="testuser" />);
    await waitForLoad();

    fireEvent.click(screen.getByTestId("save-button"));

    await waitFor(() =>
      expect(screen.getByText(/profiel succesvol opgeslagen/i)).toBeInTheDocument()
    );
  });

  it("shows error alert when saving fails with Error instance", async () => {
    mockGetProfile.mockResolvedValueOnce(baseProfile);
    mockUpdateProfile.mockRejectedValueOnce(new Error("Server fout"));
    render(<ProfileForm username="testuser" />);
    await waitForLoad();

    fireEvent.click(screen.getByTestId("save-button"));

    await waitFor(() =>
      expect(screen.getByText(/server fout/i)).toBeInTheDocument()
    );
  });

  it("shows fallback error message when saving fails with non-Error", async () => {
    mockGetProfile.mockResolvedValueOnce(baseProfile);
    mockUpdateProfile.mockRejectedValueOnce("some string error");
    render(<ProfileForm username="testuser" />);
    await waitForLoad();

    fireEvent.click(screen.getByTestId("save-button"));

    await waitFor(() =>
      expect(screen.getByText(/opslaan mislukt/i)).toBeInTheDocument()
    );
  });

  it("does not call updateProfile when form is saving", async () => {
    mockGetProfile.mockResolvedValueOnce(baseProfile);
    // Never resolves to keep saving state active
    mockUpdateProfile.mockReturnValueOnce(new Promise(() => {}));
    render(<ProfileForm username="testuser" />);
    await waitForLoad();

    fireEvent.click(screen.getByTestId("save-button"));

    await waitFor(() =>
      expect(screen.getByTestId("save-button")).toBeDisabled()
    );
    // Second click while disabled should not trigger another call
    fireEvent.click(screen.getByTestId("save-button"));
    expect(mockUpdateProfile).toHaveBeenCalledTimes(1);
  });

  // Validation — boundary tests
  it("validates displayName length: exactly 100 chars is valid", async () => {
    mockGetProfile.mockResolvedValueOnce(baseProfile);
    mockUpdateProfile.mockResolvedValueOnce({ success: true, message: "ok" });
    render(<ProfileForm username="testuser" />);
    await waitForLoad();

    fireEvent.change(screen.getByTestId("display-name-input"), {
      target: { value: "a".repeat(100) },
    });
    fireEvent.click(screen.getByTestId("save-button"));

    await waitFor(() => expect(mockUpdateProfile).toHaveBeenCalledTimes(1));
    expect(screen.queryByText(/weergavenaam mag maximaal/i)).not.toBeInTheDocument();
  });

  it("validates displayName length: 101 chars is invalid", async () => {
    mockGetProfile.mockResolvedValueOnce(baseProfile);
    render(<ProfileForm username="testuser" />);
    await waitForLoad();

    fireEvent.change(screen.getByTestId("display-name-input"), {
      target: { value: "a".repeat(101) },
    });
    fireEvent.click(screen.getByTestId("save-button"));

    expect(screen.getByText(/weergavenaam mag maximaal 100 tekens/i)).toBeInTheDocument();
    expect(mockUpdateProfile).not.toHaveBeenCalled();
  });

  it("validates bio length: exactly 500 chars is valid", async () => {
    mockGetProfile.mockResolvedValueOnce(baseProfile);
    mockUpdateProfile.mockResolvedValueOnce({ success: true, message: "ok" });
    render(<ProfileForm username="testuser" />);
    await waitForLoad();

    fireEvent.change(screen.getByTestId("bio-input"), {
      target: { value: "b".repeat(500) },
    });
    fireEvent.click(screen.getByTestId("save-button"));

    await waitFor(() => expect(mockUpdateProfile).toHaveBeenCalledTimes(1));
    expect(screen.queryByText(/biografie mag maximaal/i)).not.toBeInTheDocument();
  });

  it("validates bio length: 501 chars is invalid", async () => {
    mockGetProfile.mockResolvedValueOnce(baseProfile);
    render(<ProfileForm username="testuser" />);
    await waitForLoad();

    fireEvent.change(screen.getByTestId("bio-input"), {
      target: { value: "b".repeat(501) },
    });
    fireEvent.click(screen.getByTestId("save-button"));

    expect(screen.getByText(/biografie mag maximaal 500 tekens/i)).toBeInTheDocument();
    expect(mockUpdateProfile).not.toHaveBeenCalled();
  });

  it("validates location length: exactly 100 chars is valid", async () => {
    mockGetProfile.mockResolvedValueOnce(baseProfile);
    mockUpdateProfile.mockResolvedValueOnce({ success: true, message: "ok" });
    render(<ProfileForm username="testuser" />);
    await waitForLoad();

    fireEvent.change(screen.getByTestId("location-input"), {
      target: { value: "c".repeat(100) },
    });
    fireEvent.click(screen.getByTestId("save-button"));

    await waitFor(() => expect(mockUpdateProfile).toHaveBeenCalledTimes(1));
    expect(screen.queryByText(/locatie mag maximaal/i)).not.toBeInTheDocument();
  });

  it("validates location length: 101 chars is invalid", async () => {
    mockGetProfile.mockResolvedValueOnce(baseProfile);
    render(<ProfileForm username="testuser" />);
    await waitForLoad();

    fireEvent.change(screen.getByTestId("location-input"), {
      target: { value: "c".repeat(101) },
    });
    fireEvent.click(screen.getByTestId("save-button"));

    expect(screen.getByText(/locatie mag maximaal 100 tekens/i)).toBeInTheDocument();
    expect(mockUpdateProfile).not.toHaveBeenCalled();
  });

  it("shows displayName error (not bio/location error) for displayName violation", async () => {
    mockGetProfile.mockResolvedValueOnce(baseProfile);
    render(<ProfileForm username="testuser" />);
    await waitForLoad();

    fireEvent.change(screen.getByTestId("display-name-input"), {
      target: { value: "a".repeat(101) },
    });
    fireEvent.click(screen.getByTestId("save-button"));

    const alert = screen.getByRole("alert");
    expect(alert).toHaveTextContent(/weergavenaam/i);
    expect(alert).not.toHaveTextContent(/biografie/i);
    expect(alert).not.toHaveTextContent(/locatie/i);
  });

  // Avatar section
  it("shows avatar image when avatarUrl is provided", async () => {
    mockGetProfile.mockResolvedValueOnce({
      ...baseProfile,
      avatarUrl: "data:image/png;base64,abc123",
    });
    render(<ProfileForm username="testuser" />);
    await waitForLoad();

    const img = screen.getByAltText(/avatar van testuser/i);
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute("src", "data:image/png;base64,abc123");
  });

  it("shows initials placeholder when no avatar", async () => {
    mockGetProfile.mockResolvedValueOnce(baseProfile);
    render(<ProfileForm username="testuser" />);
    await waitForLoad();

    expect(screen.getByTestId("avatar-placeholder")).toBeInTheDocument();
    expect(screen.getByText("T")).toBeInTheDocument();
  });

  it("shows placeholder initial using first character of username uppercased", async () => {
    mockGetProfile.mockResolvedValueOnce({ ...baseProfile, avatarUrl: null });
    render(<ProfileForm username="alice" />);
    await waitForLoad();

    expect(screen.getByText("A")).toBeInTheDocument();
  });

  it("shows delete avatar button only when avatarUrl is set", async () => {
    mockGetProfile.mockResolvedValueOnce(baseProfile);
    const { unmount } = render(<ProfileForm username="testuser" />);
    await waitForLoad();

    expect(screen.queryByTestId("delete-avatar-button")).not.toBeInTheDocument();
    unmount();

    mockGetProfile.mockResolvedValueOnce({
      ...baseProfile,
      avatarUrl: "data:image/png;base64,abc",
    });
    render(<ProfileForm username="testuser" />);
    await waitForLoad();

    expect(screen.getByTestId("delete-avatar-button")).toBeInTheDocument();
  });

  it("calls deleteAvatar with the username and shows success", async () => {
    mockGetProfile.mockResolvedValue({
      ...baseProfile,
      avatarUrl: "data:image/png;base64,abc",
    });
    mockDeleteAvatar.mockResolvedValueOnce({ success: true, message: "ok" });

    render(<ProfileForm username="testuser" />);
    await waitForLoad();

    fireEvent.click(screen.getByTestId("delete-avatar-button"));

    await waitFor(() =>
      expect(screen.getByText(/avatar succesvol verwijderd/i)).toBeInTheDocument()
    );

    expect(mockDeleteAvatar).toHaveBeenCalledWith("testuser");
  });

  it("calls deleteAvatar with the correct username (not hardcoded)", async () => {
    mockGetProfile.mockResolvedValue({
      ...baseProfile,
      avatarUrl: "data:image/png;base64,abc",
    });
    mockDeleteAvatar.mockResolvedValueOnce({ success: true, message: "ok" });

    render(<ProfileForm username="anotheruser" />);
    await waitForLoad();

    fireEvent.click(screen.getByTestId("delete-avatar-button"));

    await waitFor(() => expect(mockDeleteAvatar).toHaveBeenCalled());
    expect(mockDeleteAvatar).toHaveBeenCalledWith("anotheruser");
  });

  it("shows error when deleteAvatar fails with Error instance", async () => {
    mockGetProfile.mockResolvedValue({
      ...baseProfile,
      avatarUrl: "data:image/png;base64,abc",
    });
    mockDeleteAvatar.mockRejectedValueOnce(new Error("Delete mislukt"));

    render(<ProfileForm username="testuser" />);
    await waitForLoad();

    fireEvent.click(screen.getByTestId("delete-avatar-button"));

    await waitFor(() =>
      expect(screen.getByText(/delete mislukt/i)).toBeInTheDocument()
    );
  });

  it("shows fallback error when deleteAvatar fails with non-Error", async () => {
    mockGetProfile.mockResolvedValue({
      ...baseProfile,
      avatarUrl: "data:image/png;base64,abc",
    });
    mockDeleteAvatar.mockRejectedValueOnce("unknown");

    render(<ProfileForm username="testuser" />);
    await waitForLoad();

    fireEvent.click(screen.getByTestId("delete-avatar-button"));

    await waitFor(() =>
      expect(screen.getByText(/avatar verwijderen mislukt/i)).toBeInTheDocument()
    );
  });

  it("hides avatar image (shows placeholder) after avatar is deleted", async () => {
    mockGetProfile.mockResolvedValue({
      ...baseProfile,
      avatarUrl: "data:image/png;base64,abc",
    });
    mockDeleteAvatar.mockResolvedValueOnce({ success: true });

    render(<ProfileForm username="testuser" />);
    await waitForLoad();

    expect(screen.getByTestId("avatar-image")).toBeInTheDocument();

    fireEvent.click(screen.getByTestId("delete-avatar-button"));

    await waitFor(() =>
      expect(screen.queryByTestId("avatar-image")).not.toBeInTheDocument()
    );
    expect(screen.getByTestId("avatar-placeholder")).toBeInTheDocument();
  });

  // Avatar upload
  it("rejects avatar file with invalid type", async () => {
    mockGetProfile.mockResolvedValueOnce(baseProfile);
    render(<ProfileForm username="testuser" />);
    await waitForLoad();

    const file = new File(["content"], "doc.pdf", { type: "application/pdf" });
    fireEvent.change(screen.getByTestId("avatar-upload-input"), {
      target: { files: [file] },
    });

    expect(screen.getByText(/alleen jpeg, png, webp of gif/i)).toBeInTheDocument();
    expect(mockUploadAvatar).not.toHaveBeenCalled();
  });

  it("rejects avatar file that is too large (>5MB)", async () => {
    mockGetProfile.mockResolvedValueOnce(baseProfile);
    render(<ProfileForm username="testuser" />);
    await waitForLoad();

    const bigContent = new Uint8Array(6 * 1024 * 1024);
    const file = new File([bigContent], "big.png", { type: "image/png" });
    fireEvent.change(screen.getByTestId("avatar-upload-input"), {
      target: { files: [file] },
    });

    expect(screen.getByRole("alert")).toHaveTextContent(/maximaal 5 mb/i);
    expect(mockUploadAvatar).not.toHaveBeenCalled();
  });

  it("accepts avatar file that is exactly 5MB", async () => {
    mockGetProfile.mockResolvedValueOnce(baseProfile);
    mockUploadAvatar.mockResolvedValueOnce({ success: true });
    render(<ProfileForm username="testuser" />);
    await waitForLoad();

    // CONSTRAINT: max 5MB (5 * 1024 * 1024 bytes) — must match backend
    const exactContent = new Uint8Array(5 * 1024 * 1024);
    const file = new File([exactContent], "exact.png", { type: "image/png" });
    fireEvent.change(screen.getByTestId("avatar-upload-input"), {
      target: { files: [file] },
    });

    await waitFor(() => expect(mockUploadAvatar).toHaveBeenCalledTimes(1));
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("calls uploadAvatar with username and file for valid upload", async () => {
    mockGetProfile.mockResolvedValue(baseProfile);
    mockUploadAvatar.mockResolvedValueOnce({ success: true, message: "ok" });

    render(<ProfileForm username="testuser" />);
    await waitForLoad();

    const file = new File(["img"], "photo.png", { type: "image/png" });
    fireEvent.change(screen.getByTestId("avatar-upload-input"), {
      target: { files: [file] },
    });

    await waitFor(() =>
      expect(screen.getByText(/avatar succesvol geupload/i)).toBeInTheDocument()
    );

    expect(mockUploadAvatar).toHaveBeenCalledWith("testuser", file);
  });

  it("calls uploadAvatar with the correct username (not hardcoded)", async () => {
    mockGetProfile.mockResolvedValue(baseProfile);
    mockUploadAvatar.mockResolvedValueOnce({ success: true });

    render(<ProfileForm username="uploaduser" />);
    await waitForLoad();

    const file = new File(["img"], "photo.png", { type: "image/png" });
    fireEvent.change(screen.getByTestId("avatar-upload-input"), {
      target: { files: [file] },
    });

    await waitFor(() => expect(mockUploadAvatar).toHaveBeenCalled());
    expect(mockUploadAvatar).toHaveBeenCalledWith("uploaduser", file);
  });

  it("shows error when uploadAvatar fails with Error instance", async () => {
    mockGetProfile.mockResolvedValue(baseProfile);
    mockUploadAvatar.mockRejectedValueOnce(new Error("Upload fout"));

    render(<ProfileForm username="testuser" />);
    await waitForLoad();

    const file = new File(["img"], "photo.png", { type: "image/png" });
    fireEvent.change(screen.getByTestId("avatar-upload-input"), {
      target: { files: [file] },
    });

    await waitFor(() =>
      expect(screen.getByText(/upload fout/i)).toBeInTheDocument()
    );
  });

  it("shows fallback error when uploadAvatar fails with non-Error", async () => {
    mockGetProfile.mockResolvedValue(baseProfile);
    mockUploadAvatar.mockRejectedValueOnce("unknown error");

    render(<ProfileForm username="testuser" />);
    await waitForLoad();

    const file = new File(["img"], "photo.png", { type: "image/png" });
    fireEvent.change(screen.getByTestId("avatar-upload-input"), {
      target: { files: [file] },
    });

    await waitFor(() =>
      expect(screen.getByText(/avatar uploaden mislukt/i)).toBeInTheDocument()
    );
  });

  it("accepts jpeg, png, webp and gif file types", async () => {
    const validTypes = [
      { name: "a.jpg", type: "image/jpeg" },
      { name: "a.png", type: "image/png" },
      { name: "a.webp", type: "image/webp" },
      { name: "a.gif", type: "image/gif" },
    ];

    for (const { name, type } of validTypes) {
      jest.clearAllMocks();
      mockGetProfile.mockResolvedValueOnce(baseProfile);
      mockUploadAvatar.mockResolvedValueOnce({ success: true });

      const { unmount } = render(<ProfileForm username="testuser" />);
      await waitForLoad();

      const file = new File(["img"], name, { type });
      fireEvent.change(screen.getByTestId("avatar-upload-input"), {
        target: { files: [file] },
      });

      await waitFor(() => expect(mockUploadAvatar).toHaveBeenCalledTimes(1));
      expect(screen.queryByText(/alleen jpeg/i)).not.toBeInTheDocument();
      unmount();
    }
  });

  // Alert display
  it("shows success alert with green styling", async () => {
    mockGetProfile.mockResolvedValueOnce(baseProfile);
    mockUpdateProfile.mockResolvedValueOnce({ success: true });
    render(<ProfileForm username="testuser" />);
    await waitForLoad();

    fireEvent.click(screen.getByTestId("save-button"));

    await waitFor(() => {
      const alertEl = screen.getByTestId("profile-alert");
      expect(alertEl).toBeInTheDocument();
      expect(alertEl.className).toContain("green");
    });
  });

  it("shows error alert with red styling", async () => {
    mockGetProfile.mockRejectedValueOnce(new Error("fail"));
    render(<ProfileForm username="testuser" />);

    await waitFor(() => {
      const alertEl = screen.getByTestId("profile-alert");
      expect(alertEl.className).toContain("red");
    });
  });
});
