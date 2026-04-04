/**
 * @jest-environment jsdom
 */
import React from "react";
import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import "@testing-library/jest-dom";
import UserManagementTab from "./UserManagementTab";

const mockUsers = [
  { id: 1, username: "admin", email: "admin@example.com", role: "ADMIN" },
  { id: 2, username: "alice", email: "alice@example.com", role: "USER" },
  { id: 3, username: "mod", email: "mod@example.com", role: "MODERATOR" },
];

jest.mock("@/lib/api", () => ({
  searchUsers: jest.fn(),
  updateUserRole: jest.fn(),
}));

import * as api from "@/lib/api";

describe("UserManagementTab", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (api.searchUsers as jest.Mock).mockResolvedValue(mockUsers);
  });

  it("renders the user management tab container", async () => {
    render(<UserManagementTab token="tok" currentUserId={1} />);
    expect(screen.getByTestId("user-management-tab")).toBeInTheDocument();
  });

  it("renders search input with data-testid", async () => {
    render(<UserManagementTab token="tok" currentUserId={1} />);
    expect(screen.getByTestId("user-search-input")).toBeInTheDocument();
  });

  it("shows loading state initially", async () => {
    let resolve: (v: typeof mockUsers) => void;
    (api.searchUsers as jest.Mock).mockReturnValue(new Promise((res) => { resolve = res; }));
    render(<UserManagementTab token="tok" currentUserId={1} />);
    expect(screen.getByTestId("user-management-loading")).toBeInTheDocument();
    await act(async () => { resolve!(mockUsers); });
  });

  it("renders user list after loading", async () => {
    render(<UserManagementTab token="tok" currentUserId={99} />);
    expect(await screen.findByTestId("user-list")).toBeInTheDocument();
    expect(screen.getByTestId("user-row-1")).toBeInTheDocument();
    expect(screen.getByTestId("user-row-2")).toBeInTheDocument();
  });

  it("shows username, email and role for each user", async () => {
    render(<UserManagementTab token="tok" currentUserId={99} />);
    await screen.findByTestId("user-list");
    expect(screen.getByTestId("user-username-1")).toHaveTextContent("admin");
    expect(screen.getByTestId("user-email-1")).toHaveTextContent("admin@example.com");
    expect(screen.getByTestId("user-role-1")).toHaveTextContent("ADMIN");
  });

  it("shows no-users message when list is empty", async () => {
    (api.searchUsers as jest.Mock).mockResolvedValue([]);
    render(<UserManagementTab token="tok" currentUserId={1} />);
    expect(await screen.findByTestId("no-users-message")).toBeInTheDocument();
  });

  it("shows error when loading fails", async () => {
    (api.searchUsers as jest.Mock).mockRejectedValue(new Error("Server error"));
    render(<UserManagementTab token="tok" currentUserId={1} />);
    expect(await screen.findByTestId("user-management-error")).toHaveTextContent("Server error");
  });

  it("role buttons are disabled for the current user", async () => {
    render(<UserManagementTab token="tok" currentUserId={1} />);
    await screen.findByTestId("user-list");
    // user id=1 is current user — all their role buttons should be disabled
    const buttons = screen.getAllByRole("button");
    const userButtons = buttons.filter((b) => b.getAttribute("data-testid")?.includes("-1"));
    userButtons.forEach((btn) => {
      expect(btn).toBeDisabled();
    });
  });

  it("role buttons are enabled for other users", async () => {
    render(<UserManagementTab token="tok" currentUserId={1} />);
    await screen.findByTestId("user-list");
    const btn = screen.getByTestId("change-role-user-2");
    expect(btn).not.toBeDisabled();
  });

  it("calls updateUserRole when a role button is clicked", async () => {
    (api.updateUserRole as jest.Mock).mockResolvedValue({ id: 2, username: "alice", email: "alice@example.com", role: "MODERATOR" });
    render(<UserManagementTab token="tok" currentUserId={1} />);
    await screen.findByTestId("change-role-moderator-2");
    fireEvent.click(screen.getByTestId("change-role-moderator-2"));
    // Opens confirm dialog
    expect(await screen.findByTestId("role-confirm-dialog")).toBeInTheDocument();
    await act(async () => {
      fireEvent.click(screen.getByTestId("confirm-role-button"));
    });
    expect(api.updateUserRole).toHaveBeenCalledWith(2, "MODERATOR", "tok");
  });

  it("can cancel role change from confirm dialog", async () => {
    render(<UserManagementTab token="tok" currentUserId={1} />);
    await screen.findByTestId("change-role-moderator-2");
    fireEvent.click(screen.getByTestId("change-role-moderator-2"));
    expect(await screen.findByTestId("role-confirm-dialog")).toBeInTheDocument();
    fireEvent.click(screen.getByTestId("cancel-confirm-button"));
    expect(screen.queryByTestId("role-confirm-dialog")).not.toBeInTheDocument();
    expect(api.updateUserRole).not.toHaveBeenCalled();
  });

  it("shows error when updateUserRole fails", async () => {
    (api.updateUserRole as jest.Mock).mockRejectedValue(new Error("Role update failed"));
    render(<UserManagementTab token="tok" currentUserId={1} />);
    await screen.findByTestId("change-role-user-2");
    fireEvent.click(screen.getByTestId("change-role-user-2"));
    await act(async () => {
      fireEvent.click(screen.getByTestId("confirm-role-button"));
    });
    expect(await screen.findByTestId("user-management-error")).toHaveTextContent("Role update failed");
  });

  it("updates the displayed role after successful role change", async () => {
    const updated = { id: 2, username: "alice", email: "alice@example.com", role: "MODERATOR" };
    (api.updateUserRole as jest.Mock).mockResolvedValue(updated);
    render(<UserManagementTab token="tok" currentUserId={1} />);
    await screen.findByTestId("change-role-moderator-2");
    fireEvent.click(screen.getByTestId("change-role-moderator-2"));
    await act(async () => {
      fireEvent.click(screen.getByTestId("confirm-role-button"));
    });
    await waitFor(() => {
      expect(screen.getByTestId("user-role-2")).toHaveTextContent("MODERATOR");
    });
  });

  it("searches users when query input changes", async () => {
    render(<UserManagementTab token="tok" currentUserId={1} />);
    await screen.findByTestId("user-search-input");
    fireEvent.change(screen.getByTestId("user-search-input"), { target: { value: "alice" } });
    await waitFor(() => {
      expect(api.searchUsers).toHaveBeenCalledWith("alice", "tok");
    });
  });
});
