/**
 * @jest-environment jsdom
 */
import React from "react";
import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
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

function fillAndSubmit(username: string, password: string) {
  fireEvent.change(screen.getByTestId("username-input"), { target: { value: username } });
  fireEvent.change(screen.getByTestId("password-input"), { target: { value: password } });
  fireEvent.click(screen.getByTestId("login-button"));
}

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

  it("renders the register link pointing to /register", () => {
    render(<LoginForm />);
    const link = screen.getByTestId("register-link");
    expect(link).toHaveAttribute("href", "/register");
  });

  // onChange handler tests — verify state is actually updated
  it("updates username input value when typed", () => {
    render(<LoginForm />);
    const input = screen.getByTestId("username-input");
    fireEvent.change(input, { target: { value: "myuser" } });
    expect(input).toHaveValue("myuser");
  });

  it("updates password input value when typed", () => {
    render(<LoginForm />);
    const input = screen.getByTestId("password-input");
    fireEvent.change(input, { target: { value: "secret123" } });
    expect(input).toHaveValue("secret123");
  });

  it("typed username is reflected in the input, not a different value", () => {
    render(<LoginForm />);
    const input = screen.getByTestId("username-input");
    fireEvent.change(input, { target: { value: "alice" } });
    expect(input).toHaveValue("alice");
    expect(input).not.toHaveValue("bob");
    expect(input).not.toHaveValue("");
  });

  it("typed password is reflected in the input, not a different value", () => {
    render(<LoginForm />);
    const input = screen.getByTestId("password-input");
    fireEvent.change(input, { target: { value: "pass1" } });
    expect(input).toHaveValue("pass1");
    expect(input).not.toHaveValue("");
  });

  // fetch URL and POST method tests
  it("sends POST request to the correct login URL on submit", async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: jest.fn().mockResolvedValueOnce({ username: "testuser" }),
    });

    render(<LoginForm />);
    fillAndSubmit("testuser", "password123");

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledTimes(1);
    });

    const [url, options] = (fetch as jest.Mock).mock.calls[0];
    expect(url).toBe("http://localhost:8080/api/auth/login");
    expect(options.method).toBe("POST");
  });

  it("sends JSON content-type header", async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: jest.fn().mockResolvedValueOnce({ username: "testuser" }),
    });

    render(<LoginForm />);
    fillAndSubmit("testuser", "password123");

    await waitFor(() => expect(fetch).toHaveBeenCalledTimes(1));

    const [, options] = (fetch as jest.Mock).mock.calls[0];
    expect(options.headers).toEqual({ "Content-Type": "application/json" });
  });

  it("sends username and password in request body", async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: jest.fn().mockResolvedValueOnce({ username: "alice" }),
    });

    render(<LoginForm />);
    fillAndSubmit("alice", "mypassword");

    await waitFor(() => expect(fetch).toHaveBeenCalledTimes(1));

    const [, options] = (fetch as jest.Mock).mock.calls[0];
    expect(JSON.parse(options.body)).toEqual({ username: "alice", password: "mypassword" });
  });

  it("sends the exact username and password that were typed (not defaults)", async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: jest.fn().mockResolvedValueOnce({ username: "bob" }),
    });

    render(<LoginForm />);
    fillAndSubmit("bob", "correcthorse");

    await waitFor(() => expect(fetch).toHaveBeenCalledTimes(1));

    const [, options] = (fetch as jest.Mock).mock.calls[0];
    const body = JSON.parse(options.body);
    expect(body.username).toBe("bob");
    expect(body.password).toBe("correcthorse");
  });

  // localStorage tests
  it("stores the server-confirmed username in localStorage on successful login", async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: jest.fn().mockResolvedValueOnce({ username: "serveruser" }),
    });

    render(<LoginForm />);
    fillAndSubmit("serveruser", "pass");

    await waitFor(() => {
      expect(localStorage.getItem("username")).toBe("serveruser");
    });
  });

  it("stores the password in localStorage on successful login", async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: jest.fn().mockResolvedValueOnce({ username: "testuser" }),
    });

    render(<LoginForm />);
    fillAndSubmit("testuser", "mySecret");

    await waitFor(() => {
      expect(localStorage.getItem("password")).toBe("mySecret");
    });
  });

  it("does not store credentials in localStorage on failed login (401)", async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({ ok: false, status: 401 });

    render(<LoginForm />);
    fillAndSubmit("user", "wrong");

    await waitFor(() => expect(screen.getByTestId("login-error")).toBeInTheDocument());

    expect(localStorage.getItem("username")).toBeNull();
    expect(localStorage.getItem("password")).toBeNull();
  });

  it("does not store credentials on server error (500)", async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({ ok: false, status: 500 });

    render(<LoginForm />);
    fillAndSubmit("user", "pass");

    await waitFor(() => expect(screen.getByTestId("login-error")).toBeInTheDocument());

    expect(localStorage.getItem("username")).toBeNull();
    expect(localStorage.getItem("password")).toBeNull();
  });

  it("redirects to /dashboard (not another route) on successful login", async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: jest.fn().mockResolvedValueOnce({ username: "testuser" }),
    });

    render(<LoginForm />);
    fillAndSubmit("testuser", "password123");

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith("/dashboard");
    });
    expect(mockPush).not.toHaveBeenCalledWith("/");
    expect(mockPush).not.toHaveBeenCalledWith("/login");
  });

  // Error message tests
  it("shows 401 error message for invalid credentials", async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({ ok: false, status: 401 });

    render(<LoginForm />);
    fillAndSubmit("user", "wrong");

    expect(await screen.findByTestId("login-error")).toBeInTheDocument();
    expect(screen.getByTestId("login-error")).toHaveTextContent(
      /ongeldige gebruikersnaam of wachtwoord/i
    );
  });

  it("shows generic error message for unexpected server error (500)", async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({ ok: false, status: 500 });

    render(<LoginForm />);
    fillAndSubmit("user", "pass");

    expect(await screen.findByTestId("login-error")).toBeInTheDocument();
    expect(screen.getByTestId("login-error")).toHaveTextContent(/onverwachte fout/i);
  });

  it("shows different messages for 401 vs 500 responses", async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({ ok: false, status: 401 });
    const { unmount } = render(<LoginForm />);
    fillAndSubmit("user", "wrong");
    const error401 = await screen.findByTestId("login-error");
    const text401 = error401.textContent;
    unmount();

    (fetch as jest.Mock).mockResolvedValueOnce({ ok: false, status: 500 });
    render(<LoginForm />);
    fillAndSubmit("user", "pass");
    const error500 = await screen.findByTestId("login-error");
    expect(error500.textContent).not.toBe(text401);
  });

  it("shows connection error message when fetch throws", async () => {
    (fetch as jest.Mock).mockRejectedValueOnce(new Error("Network failure"));

    render(<LoginForm />);
    fillAndSubmit("user", "pass");

    expect(await screen.findByTestId("login-error")).toBeInTheDocument();
    expect(screen.getByTestId("login-error")).toHaveTextContent(/verbinding/i);
  });

  // Loading state tests
  it("disables inputs and button while loading", async () => {
    (fetch as jest.Mock).mockReturnValueOnce(new Promise(() => {}));

    render(<LoginForm />);
    fillAndSubmit("user", "pass");

    await waitFor(() => {
      expect(screen.getByTestId("username-input")).toBeDisabled();
      expect(screen.getByTestId("password-input")).toBeDisabled();
      expect(screen.getByTestId("login-button")).toBeDisabled();
    });
  });

  it("shows loading text in button while submitting", async () => {
    (fetch as jest.Mock).mockReturnValueOnce(new Promise(() => {}));

    render(<LoginForm />);
    fillAndSubmit("user", "pass");

    await waitFor(() => {
      expect(screen.getByTestId("login-button")).toHaveTextContent(/bezig met inloggen/i);
    });
  });

  it("does not redirect when response is not ok", async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({ ok: false, status: 401 });

    render(<LoginForm />);
    fillAndSubmit("user", "wrong");

    await waitFor(() => expect(screen.getByTestId("login-error")).toBeInTheDocument());
    expect(mockPush).not.toHaveBeenCalled();
  });

  it("clears previous error when submitting again", async () => {
    // First submission fails
    (fetch as jest.Mock).mockResolvedValueOnce({ ok: false, status: 401 });
    render(<LoginForm />);
    fillAndSubmit("user", "wrong");
    await screen.findByTestId("login-error");

    // Second submission succeeds — previous error clears
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: jest.fn().mockResolvedValueOnce({ username: "user" }),
    });
    await act(async () => {
      fillAndSubmit("user", "correct");
    });

    await waitFor(() => expect(mockPush).toHaveBeenCalledWith("/dashboard"));
    expect(screen.queryByTestId("login-error")).not.toBeInTheDocument();
  });

  it("stores the role in localStorage on successful login", async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: jest.fn().mockResolvedValueOnce({ username: "moderator", role: "MODERATOR" }),
    });

    render(<LoginForm />);
    fillAndSubmit("moderator", "moderator1234");

    await waitFor(() => {
      expect(localStorage.getItem("role")).toBe("MODERATOR");
    });
  });

  it("does not store role in localStorage when role is absent in response", async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: jest.fn().mockResolvedValueOnce({ username: "user" }),
    });

    render(<LoginForm />);
    fillAndSubmit("user", "user1234");

    await waitFor(() => {
      expect(localStorage.getItem("username")).toBe("user");
    });
    expect(localStorage.getItem("role")).toBeNull();
  });
});
