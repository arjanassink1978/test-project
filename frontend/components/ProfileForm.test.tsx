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

describe("ProfileForm", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("shows a loading spinner while fetching profile", () => {
    // getProfile never resolves during this test
    mockGetProfile.mockReturnValue(new Promise(() => {}));

    render(<ProfileForm username="testuser" />);

    expect(screen.getByText(/profiel laden/i)).toBeInTheDocument();
  });

  it("renders profile data after loading", async () => {
    mockGetProfile.mockResolvedValueOnce(baseProfile);

    render(<ProfileForm username="testuser" />);

    await waitFor(() =>
      expect(screen.queryByText(/profiel laden/i)).not.toBeInTheDocument()
    );

    expect(screen.getByText("testuser")).toBeInTheDocument();
    expect(screen.getByText("test@example.com")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Test User")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Hello world")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Amsterdam")).toBeInTheDocument();
  });

  it("renders key data-testid attributes after loading", async () => {
    mockGetProfile.mockResolvedValueOnce(baseProfile);

    render(<ProfileForm username="testuser" />);

    await waitFor(() =>
      expect(screen.queryByText(/profiel laden/i)).not.toBeInTheDocument()
    );

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

  it("shows error alert when profile loading fails", async () => {
    mockGetProfile.mockRejectedValueOnce(new Error("Network error"));

    render(<ProfileForm username="testuser" />);

    await waitFor(() =>
      expect(
        screen.getByText(/profiel kon niet worden geladen/i)
      ).toBeInTheDocument()
    );
  });

  it("calls updateProfile and shows success alert when saving", async () => {
    mockGetProfile.mockResolvedValueOnce(baseProfile);
    mockUpdateProfile.mockResolvedValueOnce({ success: true, message: "ok" });

    render(<ProfileForm username="testuser" />);

    await waitFor(() =>
      expect(screen.queryByText(/profiel laden/i)).not.toBeInTheDocument()
    );

    // Change displayName
    const displayNameInput = screen.getByLabelText(/weergavenaam/i);
    fireEvent.change(displayNameInput, { target: { value: "New Name" } });

    fireEvent.click(screen.getByRole("button", { name: /opslaan/i }));

    await waitFor(() =>
      expect(
        screen.getByText(/profiel succesvol opgeslagen/i)
      ).toBeInTheDocument()
    );

    expect(mockUpdateProfile).toHaveBeenCalledWith("testuser", {
      displayName: "New Name",
      bio: "Hello world",
      location: "Amsterdam",
    });
  });

  it("shows error alert when saving fails", async () => {
    mockGetProfile.mockResolvedValueOnce(baseProfile);
    mockUpdateProfile.mockRejectedValueOnce(new Error("Server fout"));

    render(<ProfileForm username="testuser" />);

    await waitFor(() =>
      expect(screen.queryByText(/profiel laden/i)).not.toBeInTheDocument()
    );

    fireEvent.click(screen.getByRole("button", { name: /opslaan/i }));

    await waitFor(() =>
      expect(screen.getByText(/server fout/i)).toBeInTheDocument()
    );
  });

  it("validates displayName length and shows error without calling API", async () => {
    mockGetProfile.mockResolvedValueOnce(baseProfile);

    render(<ProfileForm username="testuser" />);

    await waitFor(() =>
      expect(screen.queryByText(/profiel laden/i)).not.toBeInTheDocument()
    );

    const displayNameInput = screen.getByLabelText(/weergavenaam/i);
    fireEvent.change(displayNameInput, { target: { value: "a".repeat(101) } });

    fireEvent.click(screen.getByRole("button", { name: /opslaan/i }));

    expect(
      screen.getByText(/weergavenaam mag maximaal 100 tekens bevatten/i)
    ).toBeInTheDocument();
    expect(mockUpdateProfile).not.toHaveBeenCalled();
  });

  it("shows avatar image when avatarUrl is provided", async () => {
    const profileWithAvatar = {
      ...baseProfile,
      avatarUrl: "data:image/png;base64,abc123",
    };
    mockGetProfile.mockResolvedValueOnce(profileWithAvatar);

    render(<ProfileForm username="testuser" />);

    await waitFor(() =>
      expect(screen.queryByText(/profiel laden/i)).not.toBeInTheDocument()
    );

    const avatarImg = screen.getByAltText(/avatar van testuser/i);
    expect(avatarImg).toBeInTheDocument();
    expect(avatarImg).toHaveAttribute("src", "data:image/png;base64,abc123");
  });

  it("shows initials placeholder when no avatar", async () => {
    mockGetProfile.mockResolvedValueOnce(baseProfile);

    render(<ProfileForm username="testuser" />);

    await waitFor(() =>
      expect(screen.queryByText(/profiel laden/i)).not.toBeInTheDocument()
    );

    // The avatar placeholder shows first letter uppercased
    expect(screen.getByText("T")).toBeInTheDocument();
  });

  it("shows delete avatar button only when avatarUrl is set", async () => {
    // Without avatar: no delete button
    mockGetProfile.mockResolvedValueOnce(baseProfile);
    const { unmount } = render(<ProfileForm username="testuser" />);

    await waitFor(() =>
      expect(screen.queryByText(/profiel laden/i)).not.toBeInTheDocument()
    );
    expect(
      screen.queryByRole("button", { name: /avatar verwijderen/i })
    ).not.toBeInTheDocument();

    unmount();

    // With avatar: delete button present
    mockGetProfile.mockResolvedValueOnce({
      ...baseProfile,
      avatarUrl: "data:image/png;base64,abc",
    });
    render(<ProfileForm username="testuser" />);

    await waitFor(() =>
      expect(
        screen.getByRole("button", { name: /avatar verwijderen/i })
      ).toBeInTheDocument()
    );
  });

  it("calls deleteAvatar and shows success message", async () => {
    mockGetProfile.mockResolvedValue({
      ...baseProfile,
      avatarUrl: "data:image/png;base64,abc",
    });
    mockDeleteAvatar.mockResolvedValueOnce({ success: true, message: "ok" });

    render(<ProfileForm username="testuser" />);

    await waitFor(() =>
      expect(screen.queryByText(/profiel laden/i)).not.toBeInTheDocument()
    );

    fireEvent.click(screen.getByRole("button", { name: /avatar verwijderen/i }));

    await waitFor(() =>
      expect(
        screen.getByText(/avatar succesvol verwijderd/i)
      ).toBeInTheDocument()
    );

    expect(mockDeleteAvatar).toHaveBeenCalledWith("testuser");
  });

  it("rejects avatar file with invalid type", async () => {
    mockGetProfile.mockResolvedValueOnce(baseProfile);

    render(<ProfileForm username="testuser" />);

    await waitFor(() =>
      expect(screen.queryByText(/profiel laden/i)).not.toBeInTheDocument()
    );

    const input = screen.getByLabelText(/avatar uploaden/i);
    const file = new File(["content"], "doc.pdf", { type: "application/pdf" });
    fireEvent.change(input, { target: { files: [file] } });

    expect(
      screen.getByText(/alleen jpeg, png, webp of gif/i)
    ).toBeInTheDocument();
    expect(mockUploadAvatar).not.toHaveBeenCalled();
  });

  it("rejects avatar file that is too large", async () => {
    mockGetProfile.mockResolvedValueOnce(baseProfile);

    render(<ProfileForm username="testuser" />);

    await waitFor(() =>
      expect(screen.queryByText(/profiel laden/i)).not.toBeInTheDocument()
    );

    const bigContent = new Uint8Array(6 * 1024 * 1024);
    const file = new File([bigContent], "big.png", { type: "image/png" });
    const input = screen.getByLabelText(/avatar uploaden/i);
    fireEvent.change(input, { target: { files: [file] } });

    expect(screen.getByRole("alert")).toHaveTextContent(/maximaal 5 mb/i);
    expect(mockUploadAvatar).not.toHaveBeenCalled();
  });

  it("calls uploadAvatar and shows success message for valid file", async () => {
    mockGetProfile.mockResolvedValue(baseProfile);
    mockUploadAvatar.mockResolvedValueOnce({ success: true, message: "ok" });

    render(<ProfileForm username="testuser" />);

    await waitFor(() =>
      expect(screen.queryByText(/profiel laden/i)).not.toBeInTheDocument()
    );

    const file = new File(["img"], "photo.png", { type: "image/png" });
    const input = screen.getByLabelText(/avatar uploaden/i);
    fireEvent.change(input, { target: { files: [file] } });

    await waitFor(() =>
      expect(
        screen.getByText(/avatar succesvol geupload/i)
      ).toBeInTheDocument()
    );

    expect(mockUploadAvatar).toHaveBeenCalledWith("testuser", file);
  });
});
