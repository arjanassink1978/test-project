/**
 * @jest-environment jsdom
 */
import React from "react";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import ProfileLink from "./ProfileLink";

jest.mock("next/link", () => {
  const MockLink = ({
    href,
    children,
    className,
  }: {
    href: string;
    children: React.ReactNode;
    className?: string;
  }) => (
    <a href={href} className={className}>
      {children}
    </a>
  );
  MockLink.displayName = "MockLink";
  return MockLink;
});

describe("ProfileLink", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("renders nothing when no username is stored", () => {
    const { container } = render(<ProfileLink />);
    expect(container.firstChild).toBeNull();
  });

  it("renders a link to the profile when username is stored", () => {
    localStorage.setItem("username", "arjan");
    render(<ProfileLink />);

    const link = screen.getByRole("link", { name: /mijn profiel/i });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute("href", "/profile/arjan");
  });

  it("uses the stored username in the href", () => {
    localStorage.setItem("username", "janedoe");
    render(<ProfileLink />);

    const link = screen.getByRole("link", { name: /mijn profiel/i });
    expect(link).toHaveAttribute("href", "/profile/janedoe");
  });
});
