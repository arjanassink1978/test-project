/**
 * @jest-environment jsdom
 */
import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import RegisterForm from "./RegisterForm";

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

const fillForm = (
  email: string,
  username: string,
  password: string,
  confirmPassword: string
) => {
  fireEvent.change(screen.getByTestId("email-input"), {
    target: { value: email },
  });
  fireEvent.change(screen.getByTestId("username-input"), {
    target: { value: username },
  });
  fireEvent.change(screen.getByTestId("password-input"), {
    target: { value: password },
  });
  fireEvent.change(screen.getByTestId("confirm-password-input"), {
    target: { value: confirmPassword },
  });
};

describe("RegisterForm", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders the register form with correct data-testid attributes", () => {
    render(<RegisterForm />);

    expect(screen.getByTestId("register-form")).toBeInTheDocument();
    expect(screen.getByTestId("email-input")).toBeInTheDocument();
    expect(screen.getByTestId("username-input")).toBeInTheDocument();
    expect(screen.getByTestId("password-input")).toBeInTheDocument();
    expect(screen.getByTestId("confirm-password-input")).toBeInTheDocument();
    expect(screen.getByTestId("register-button")).toBeInTheDocument();
    expect(screen.getByTestId("login-link")).toBeInTheDocument();
  });

  it("renders the login link with correct href", () => {
    render(<RegisterForm />);

    const link = screen.getByTestId("login-link");
    expect(link).toHaveAttribute("href", "/login");
  });

  it("shows client-side validation errors when form is submitted empty", async () => {
    render(<RegisterForm />);

    fireEvent.click(screen.getByTestId("register-button"));

    await waitFor(() => {
      expect(screen.getByText(/e-mail is verplicht/i)).toBeInTheDocument();
      expect(screen.getByText(/gebruikersnaam is verplicht/i)).toBeInTheDocument();
      expect(screen.getByText(/wachtwoord is verplicht/i)).toBeInTheDocument();
    });

    // fetch should not be called when validation fails
    expect(fetch).not.toHaveBeenCalled();
  });

  it("shows error when email is invalid", async () => {
    render(<RegisterForm />);

    fillForm("not-an-email", "user", "password123", "password123");
    fireEvent.click(screen.getByTestId("register-button"));

    await waitFor(() => {
      expect(screen.getByText(/geldig e-mailadres/i)).toBeInTheDocument();
    });

    expect(fetch).not.toHaveBeenCalled();
  });

  it("shows error when username is too short", async () => {
    render(<RegisterForm />);

    fillForm("user@example.com", "ab", "password123", "password123");
    fireEvent.click(screen.getByTestId("register-button"));

    await waitFor(() => {
      expect(screen.getByText(/minstens 3 tekens/i)).toBeInTheDocument();
    });

    expect(fetch).not.toHaveBeenCalled();
  });

  it("shows error when passwords do not match", async () => {
    render(<RegisterForm />);

    fillForm("user@example.com", "username", "password123", "different");
    fireEvent.click(screen.getByTestId("register-button"));

    await waitFor(() => {
      expect(screen.getByText(/komen niet overeen/i)).toBeInTheDocument();
    });

    expect(fetch).not.toHaveBeenCalled();
  });

  it("redirects to login page on successful registration", async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({ ok: true, status: 201 });

    render(<RegisterForm />);

    fillForm("user@example.com", "testuser", "password123", "password123");
    fireEvent.click(screen.getByTestId("register-button"));

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith("/login");
    });
  });

  it("shows conflict error on 409 response", async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({ ok: false, status: 409 });

    render(<RegisterForm />);

    fillForm("user@example.com", "testuser", "password123", "password123");
    fireEvent.click(screen.getByTestId("register-button"));

    expect(await screen.findByTestId("register-error")).toBeInTheDocument();
    expect(screen.getByTestId("register-error")).toHaveTextContent(
      /al in gebruik/i
    );
  });

  it("shows server-provided message on 400 response", async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 400,
      json: async () => ({ message: "Ongeldig verzoek" }),
    });

    render(<RegisterForm />);

    fillForm("user@example.com", "testuser", "password123", "password123");
    fireEvent.click(screen.getByTestId("register-button"));

    expect(await screen.findByTestId("register-error")).toBeInTheDocument();
    expect(screen.getByTestId("register-error")).toHaveTextContent(
      /ongeldig verzoek/i
    );
  });

  it("shows connection error when fetch throws", async () => {
    (fetch as jest.Mock).mockRejectedValueOnce(new Error("Network failure"));

    render(<RegisterForm />);

    fillForm("user@example.com", "testuser", "password123", "password123");
    fireEvent.click(screen.getByTestId("register-button"));

    expect(await screen.findByTestId("register-error")).toBeInTheDocument();
    expect(screen.getByTestId("register-error")).toHaveTextContent(/verbinding/i);
  });

  it("disables inputs and button while loading", async () => {
    // Never resolves — keeps loading state active
    (fetch as jest.Mock).mockReturnValueOnce(new Promise(() => {}));

    render(<RegisterForm />);

    fillForm("user@example.com", "testuser", "password123", "password123");
    fireEvent.click(screen.getByTestId("register-button"));

    await waitFor(() => {
      expect(screen.getByTestId("email-input")).toBeDisabled();
      expect(screen.getByTestId("username-input")).toBeDisabled();
      expect(screen.getByTestId("password-input")).toBeDisabled();
      expect(screen.getByTestId("confirm-password-input")).toBeDisabled();
      expect(screen.getByTestId("register-button")).toBeDisabled();
    });
  });
});
