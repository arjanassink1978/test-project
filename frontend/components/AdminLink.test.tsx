/**
 * @jest-environment jsdom
 */
import React from "react";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import AdminLink from "./AdminLink";

jest.mock("next/link", () => {
  const MockLink = ({
    href,
    children,
    className,
    "data-testid": dataTestid,
  }: {
    href: string;
    children: React.ReactNode;
    className?: string;
    "data-testid"?: string;
  }) => (
    <a href={href} className={className} data-testid={dataTestid}>
      {children}
    </a>
  );
  MockLink.displayName = "MockLink";
  return MockLink;
});

describe("AdminLink", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("renders nothing when role is not ADMIN", () => {
    localStorage.setItem("role", "USER");
    const { container } = render(<AdminLink />);
    expect(container.firstChild).toBeNull();
  });

  it("renders nothing when role is MODERATOR", () => {
    localStorage.setItem("role", "MODERATOR");
    const { container } = render(<AdminLink />);
    expect(container.firstChild).toBeNull();
  });

  it("renders nothing when no role is stored", () => {
    const { container } = render(<AdminLink />);
    expect(container.firstChild).toBeNull();
  });

  it("renders admin link when role is ADMIN", () => {
    localStorage.setItem("role", "ADMIN");
    render(<AdminLink />);
    expect(screen.getByTestId("admin-link")).toBeInTheDocument();
  });

  it("links to /admin", () => {
    localStorage.setItem("role", "ADMIN");
    render(<AdminLink />);
    expect(screen.getByTestId("admin-link")).toHaveAttribute("href", "/admin");
  });

  it("displays Admin text", () => {
    localStorage.setItem("role", "ADMIN");
    render(<AdminLink />);
    expect(screen.getByTestId("admin-link")).toHaveTextContent("Admin");
  });
});
