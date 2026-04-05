import { Page } from "@playwright/test";
import { API_BASE, DEFAULT_USER, DEFAULT_MODERATOR, DEFAULT_ADMIN } from "../config";

type AuthCredentials = {
  username: string;
  password: string;
  email: string;
};

async function getAuthToken(credentials: AuthCredentials): Promise<string> {
  const response = await fetch(`${API_BASE}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      username: credentials.username,
      password: credentials.password,
    }),
  });

  if (!response.ok) {
    throw new Error(`Failed to login: ${response.status}`);
  }

  const data = (await response.json()) as { token?: string; role?: string };
  if (!data.token) {
    throw new Error("No token in login response");
  }

  return data.token;
}

async function decodeJwt(token: string): Promise<{ role?: string; userId?: number }> {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) {
      throw new Error("Invalid JWT format");
    }
    return JSON.parse(atob(parts[1]));
  } catch {
    throw new Error("Failed to decode JWT");
  }
}

export async function setupAuthViaAPI(
  page: Page,
  credentials: AuthCredentials
): Promise<{ token: string; role: string }> {
  await page.goto("/");

  const token = await getAuthToken(credentials);
  const decoded = await decodeJwt(token);
  const role = decoded.role || "USER";

  console.log(`[setupAuthViaAPI] User: ${credentials.username}, JWT decoded:`, decoded, `Extracted role: ${role}`);

  await page.evaluate(
    ({ authToken, username, role }) => {
      localStorage.setItem("authToken", authToken);
      localStorage.setItem("username", username);
      localStorage.setItem("role", role);
      console.log(`[setupAuthViaAPI browser] Stored in localStorage - authToken: ${authToken.substring(0, 20)}..., username: ${username}, role: ${role}`);
    },
    { authToken: token, username: credentials.username, role }
  );

  return { token, role };
}

export async function loginAsDefaultUser(page: Page): Promise<void> {
  await page.goto("/login");

  await page.getByTestId("username-input").fill(DEFAULT_USER.username);
  await page.getByTestId("password-input").fill(DEFAULT_USER.password);
  await page.getByTestId("login-button").click();

  await page.waitForURL("/dashboard");
}

export async function loginAsModerator(page: Page): Promise<void> {
  await page.goto("/login");

  await page.getByTestId("username-input").fill(DEFAULT_MODERATOR.username);
  await page.getByTestId("password-input").fill(DEFAULT_MODERATOR.password);
  await page.getByTestId("login-button").click();

  await page.waitForURL("/dashboard");
}

export async function loginAsAdmin(page: Page): Promise<void> {
  await page.goto("/login");

  await page.getByTestId("username-input").fill(DEFAULT_ADMIN.username);
  await page.getByTestId("password-input").fill(DEFAULT_ADMIN.password);
  await page.getByTestId("login-button").click();

  await page.waitForURL("/dashboard");
}

export async function setupDefaultUserAuth(page: Page): Promise<{ token: string; role: string }> {
  return setupAuthViaAPI(page, DEFAULT_USER);
}

export async function setupModeratorAuth(page: Page): Promise<{ token: string; role: string }> {
  // Use UI login instead of API to match working auth flow
  await loginAsModerator(page);

  // Extract token from localStorage
  const token = await page.evaluate(() => localStorage.getItem("authToken") || "");
  const role = "MODERATOR";

  return { token, role };
}

export async function setupAdminAuth(page: Page): Promise<{ token: string; role: string }> {
  // Use UI login instead of API to match working auth flow
  await loginAsAdmin(page);

  // Extract token from localStorage
  const token = await page.evaluate(() => localStorage.getItem("authToken") || "");
  const role = "ADMIN";

  return { token, role };
}
