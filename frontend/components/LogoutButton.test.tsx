/**
 * @jest-environment jsdom
 */
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import LogoutButton from "./LogoutButton";

const mockPush = jest.fn();

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
}));

describe("LogoutButton", () => {
  beforeEach(() => {
    mockPush.mockClear();
    localStorage.clear();
  });

  it("renders the logout button", () => {
    render(<LogoutButton />);
    expect(
      screen.getByRole("button", { name: /uitloggen/i })
    ).toBeInTheDocument();
  });

  it("has data-testid='logout-button'", () => {
    render(<LogoutButton />);
    expect(screen.getByTestId("logout-button")).toBeInTheDocument();
  });

  it("navigates to home on click", () => {
    render(<LogoutButton />);
    fireEvent.click(screen.getByRole("button", { name: /uitloggen/i }));
    expect(mockPush).toHaveBeenCalledWith("/");
  });

  it("removes username from localStorage on click", () => {
    localStorage.setItem("username", "arjan");
    render(<LogoutButton />);
    fireEvent.click(screen.getByRole("button", { name: /uitloggen/i }));
    expect(localStorage.getItem("username")).toBeNull();
  });

  it("does not throw when localStorage has no username", () => {
    render(<LogoutButton />);
    expect(() =>
      fireEvent.click(screen.getByRole("button", { name: /uitloggen/i }))
    ).not.toThrow();
    expect(mockPush).toHaveBeenCalledWith("/");
  });

  it("removes role from localStorage on click", () => {
    localStorage.setItem("role", "MODERATOR");
    render(<LogoutButton />);
    fireEvent.click(screen.getByRole("button", { name: /uitloggen/i }));
    expect(localStorage.getItem("role")).toBeNull();
  });
});
