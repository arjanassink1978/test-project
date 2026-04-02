/**
 * @jest-environment jsdom
 */
import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import LoginForm from "./LoginForm";

// --- Module mocks ------------------------------------------------------------

const mockPush = jest.fn();

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
}));

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

// Mock fetch globally
global.fetch = jest.fn();

// ---------------------------------------------------------------------------

describe("LoginForm", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
  });

  it("renders the login form with correct data-testid attributes", () => {
    render(<LoginForm />);

    expect(screen.getByTestId("login-form")).toBeInTheDocument();
    expect(screen.getByTestId("username-input")).toBeInTheDocument();
    expect(screen.getByTestId("password-input")).toBeInTheDocument();
    expect(screen.getByTestId("login-button")).toBeInTheDocument();
    expect(screen.getByTestId("register-link")).toBeInTheDocument();
  });

  it("renders username and password inputs", () => {
    render(<LoginForm />);

    expect(screen.getByLabelText(/gebruikersnaam/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/wachtwoord/i)).toBeInTheDocument();
  });

  it("renders the submit button", () => {
    render(<LoginForm />);

    expect(screen.getByRole("button", { name: /inloggen/i })).toBeInTheDocument();
  });

  it("renders the register link", () => {
    render(<LoginForm />);

    const link = screen.getByTestId("register-link");
    expect(link).toHaveAttribute("href", "/register");
  });

  it("shows error on failed login (401)", async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({ ok: false, status: 401 });

    render(<LoginForm />);

    fireEvent.change(screen.getByTestId("username-input"), {
      target: { value: "user" },
    });
    fireEvent.change(screen.getByTestId("password-input"), {
      target: { value: "wrong" },
    });
    fireEvent.click(screen.getByTestId("login-button"));

    expect(await screen.findByTestId("login-error")).toBeInTheDocument();
    expect(screen.getByTestId("login-error")).toHaveTextContent(
      /ongeldige gebruikersnaam of wachtwoord/i
    );
  });

  it("shows generic error on unexpected server error", async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({ ok: false, status: 500 });

    render(<LoginForm />);

    fireEvent.change(screen.getByTestId("username-input"), {
      target: { value: "user" },
    });
    fireEvent.change(screen.getByTestId("password-input"), {
      target: { value: "pass" },
    });
    fireEvent.click(screen.getByTestId("login-button"));

    expect(await screen.findByTestId("login-error")).toBeInTheDocument();
    expect(screen.getByTestId("login-error")).toHaveTextContent(
      /onverwachte fout/i
    );
  });

  it("shows connection error when fetch throws", async () => {
    (fetch as jest.Mock).mockRejectedValueOnce(new Error("Network failure"));

    render(<LoginForm />);

    fireEvent.change(screen.getByTestId("username-input"), {
      target: { value: "user" },
    });
    fireEvent.change(screen.getByTestId("password-input"), {
      target: { value: "pass" },
    });
    fireEvent.click(screen.getByTestId("login-button"));

    expect(await screen.findByTestId("login-error")).toBeInTheDocument();
    expect(screen.getByTestId("login-error")).toHaveTextContent(/verbinding/i);
  });

  it("redirects to dashboard and stores username on successful login", async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({ ok: true, status: 200 });

    render(<LoginForm />);

    fireEvent.change(screen.getByTestId("username-input"), {
      target: { value: "testuser" },
    });
    fireEvent.change(screen.getByTestId("password-input"), {
      target: { value: "password123" },
    });
    fireEvent.click(screen.getByTestId("login-button"));

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith("/dashboard");
    });

    expect(localStorage.getItem("username")).toBe("testuser");
  });

  it("disables inputs and button while loading", async () => {
    // Never resolves — keeps the loading state active
    (fetch as jest.Mock).mockReturnValueOnce(new Promise(() => {}));

    render(<LoginForm />);

    fireEvent.change(screen.getByTestId("username-input"), {
      target: { value: "user" },
    });
    fireEvent.change(screen.getByTestId("password-input"), {
      target: { value: "pass" },
    });
    fireEvent.click(screen.getByTestId("login-button"));

    await waitFor(() => {
      expect(screen.getByTestId("username-input")).toBeDisabled();
      expect(screen.getByTestId("password-input")).toBeDisabled();
      expect(screen.getByTestId("login-button")).toBeDisabled();
    });
  });
});
