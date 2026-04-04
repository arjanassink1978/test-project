/**
 * @jest-environment jsdom
 */
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import AdminPanel from "./AdminPanel";

jest.mock("@/components/UserManagementTab", () => {
  const Mock = ({ token, currentUserId }: { token: string; currentUserId: number }) => (
    <div data-testid="user-management-tab">
      UserManagementTab token={token} currentUserId={currentUserId}
    </div>
  );
  Mock.displayName = "MockUserManagementTab";
  return Mock;
});

jest.mock("@/components/CategoryManagementTab", () => {
  const Mock = ({ token }: { token: string }) => (
    <div data-testid="category-management-tab">CategoryManagementTab token={token}</div>
  );
  Mock.displayName = "MockCategoryManagementTab";
  return Mock;
});

describe("AdminPanel", () => {
  const defaultProps = { token: "tok123", currentUserId: 42 };

  it("renders admin panel container", () => {
    render(<AdminPanel {...defaultProps} />);
    expect(screen.getByTestId("admin-panel")).toBeInTheDocument();
  });

  it("renders admin heading", () => {
    render(<AdminPanel {...defaultProps} />);
    expect(screen.getByTestId("admin-heading")).toHaveTextContent("Admin Panel");
  });

  it("renders tabs container", () => {
    render(<AdminPanel {...defaultProps} />);
    expect(screen.getByTestId("admin-tabs")).toBeInTheDocument();
  });

  it("shows User Management tab button", () => {
    render(<AdminPanel {...defaultProps} />);
    expect(screen.getByTestId("tab-users")).toHaveTextContent("User Management");
  });

  it("shows Category Management tab button", () => {
    render(<AdminPanel {...defaultProps} />);
    expect(screen.getByTestId("tab-categories")).toHaveTextContent("Category Management");
  });

  it("shows UserManagementTab by default", () => {
    render(<AdminPanel {...defaultProps} />);
    expect(screen.getByTestId("user-management-tab")).toBeInTheDocument();
    expect(screen.queryByTestId("category-management-tab")).not.toBeInTheDocument();
  });

  it("switches to CategoryManagementTab when category tab is clicked", () => {
    render(<AdminPanel {...defaultProps} />);
    fireEvent.click(screen.getByTestId("tab-categories"));
    expect(screen.getByTestId("category-management-tab")).toBeInTheDocument();
    expect(screen.queryByTestId("user-management-tab")).not.toBeInTheDocument();
  });

  it("switches back to UserManagementTab when user tab is clicked", () => {
    render(<AdminPanel {...defaultProps} />);
    fireEvent.click(screen.getByTestId("tab-categories"));
    fireEvent.click(screen.getByTestId("tab-users"));
    expect(screen.getByTestId("user-management-tab")).toBeInTheDocument();
    expect(screen.queryByTestId("category-management-tab")).not.toBeInTheDocument();
  });

  it("passes token and currentUserId to UserManagementTab", () => {
    render(<AdminPanel {...defaultProps} />);
    expect(screen.getByTestId("user-management-tab")).toHaveTextContent("token=tok123");
    expect(screen.getByTestId("user-management-tab")).toHaveTextContent("currentUserId=42");
  });

  it("passes token to CategoryManagementTab", () => {
    render(<AdminPanel {...defaultProps} />);
    fireEvent.click(screen.getByTestId("tab-categories"));
    expect(screen.getByTestId("category-management-tab")).toHaveTextContent("token=tok123");
  });
});
