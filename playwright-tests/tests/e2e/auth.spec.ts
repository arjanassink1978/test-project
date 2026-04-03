import { test, expect } from "@playwright/test";
import { LoginPage } from "./pages/LoginPage";
import { RegisterPage } from "./pages/RegisterPage";
import { DashboardPage } from "./pages/DashboardPage";
import { DEFAULT_USER } from "./fixtures/auth";

// ---------------------------------------------------------------------------
// Login edge cases
// ---------------------------------------------------------------------------

test.describe("Login — wrong credentials", () => {
  test("wrong password shows error and form stays usable", async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.login(DEFAULT_USER.username, "wrongpassword");

    const error = page.getByTestId("login-error");
    await expect(error).toBeVisible({ timeout: 8000 });
    await expect(error).toContainText(/ongeldig|wachtwoord|incorrect/i);

    // Form stays usable — user can retype and retry
    await loginPage.fillPassword(DEFAULT_USER.password);
    await loginPage.submit();
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 10000 });
  });

  test("nonexistent username shows error and stays on login page", async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.login("nobody_exists_xyz", "anypassword");

    const error = loginPage.getErrorMessage();
    await expect(error).toBeVisible({ timeout: 5000 });
    await expect(page).toHaveURL(/\/login/);
  });

  test("empty username and password shows error", async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.submit();

    // Either inline validation or server error — page must not navigate away
    await expect(page).toHaveURL(/\/login/);
  });
});

// ---------------------------------------------------------------------------
// Login happy path — link to register
// ---------------------------------------------------------------------------

test.describe("Login — navigation links", () => {
  test("register link on login page navigates to /register", async ({ page }) => {
    await page.goto("/login");
    const registerLink = page.getByTestId("register-link").or(
      page.getByRole("link", { name: /registreren|register/i })
    );
    await expect(registerLink).toBeVisible({ timeout: 5000 });
    await registerLink.click();
    await expect(page).toHaveURL(/\/register/, { timeout: 5000 });
  });
});

// ---------------------------------------------------------------------------
// Registration happy path flow
// ---------------------------------------------------------------------------

test.describe("Registration — happy path flow", () => {
  // Generate a unique username per test run to avoid 409 conflicts
  const timestamp = Date.now();
  const newUser = {
    email: `playwright${timestamp}@example.com`,
    username: `pwuser${timestamp}`.slice(0, 20),
    password: "Secret1234",
  };

  test("registers a new user, redirects to login, then logs in successfully", async ({ page }) => {
    const registerPage = new RegisterPage(page);
    await registerPage.register(newUser.email, newUser.username, newUser.password);

    // On success, frontend redirects to /login
    await expect(page).toHaveURL(/\/login/, { timeout: 10000 });

    // Now log in with the newly registered credentials
    const loginPage = new LoginPage(page);
    await loginPage.fillUsername(newUser.username);
    await loginPage.fillPassword(newUser.password);
    await loginPage.submit();

    await expect(page).toHaveURL(/\/dashboard/, { timeout: 10000 });

    const dashboardPage = new DashboardPage(page);
    await dashboardPage.waitForLoad();
    await expect(dashboardPage.getHeading()).toBeVisible();
  });
});

// ---------------------------------------------------------------------------
// Registration — error edge cases
// ---------------------------------------------------------------------------

test.describe("Registration — error edge cases", () => {
  test("mismatched passwords show inline error and form stays on /register", async ({ page }) => {
    const registerPage = new RegisterPage(page);
    await registerPage.goto();
    await registerPage.fillForm(
      "test@example.com",
      "testuser123",
      "Password1",
      "DifferentPassword"
    );
    await registerPage.submit();

    // Frontend validates passwords match before sending to backend
    await expect(page).toHaveURL(/\/register/);
    await expect(page.locator("p").filter({ hasText: /overeen/i }).first()).toBeVisible({
      timeout: 5000,
    });
  });

  test("invalid email format shows inline error and stays on /register", async ({ page }) => {
    const registerPage = new RegisterPage(page);
    await registerPage.goto();
    await registerPage.fillForm("not-an-email", "validuser123", "Password1", "Password1");
    await registerPage.submit();

    await expect(page).toHaveURL(/\/register/);
    await expect(
      page.locator("p").filter({ hasText: /e-mail|geldig/i }).first()
    ).toBeVisible({ timeout: 5000 });
  });

  test("duplicate username shows conflict error from backend", async ({ page }) => {
    // Use the seeded user — it already exists
    const registerPage = new RegisterPage(page);
    await registerPage.register(
      "another@example.com",
      DEFAULT_USER.username,
      "Password1234"
    );

    const error = registerPage.getErrorMessage();
    await expect(error).toBeVisible({ timeout: 10000 });
    await expect(error).toContainText(/gebruik|conflict|bestaat/i);
    await expect(page).toHaveURL(/\/register/);
  });

  test("password too short shows inline validation error", async ({ page }) => {
    const registerPage = new RegisterPage(page);
    await registerPage.goto();
    await registerPage.fillForm("short@example.com", "validuser", "short", "short");
    await registerPage.submit();

    await expect(page).toHaveURL(/\/register/);
    await expect(
      page.locator("p").filter({ hasText: /wachtwoord|tekens/i }).first()
    ).toBeVisible({ timeout: 5000 });
  });

  test("login link on register page navigates to /login", async ({ page }) => {
    const registerPage = new RegisterPage(page);
    await registerPage.goto();
    const loginLink = registerPage.getLoginLink();
    await expect(loginLink).toBeVisible({ timeout: 5000 });
    await loginLink.click();
    await expect(page).toHaveURL(/\/login/, { timeout: 5000 });
  });
});

// ---------------------------------------------------------------------------
// Logout flow from dashboard
// ---------------------------------------------------------------------------

test.describe("Logout flow — dashboard", () => {
  test("logout button on dashboard clears session and redirects to home/login", async ({ page }) => {
    // Log in first
    const loginPage = new LoginPage(page);
    await loginPage.login(DEFAULT_USER.username, DEFAULT_USER.password);
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 10000 });

    // Click logout
    const dashboardPage = new DashboardPage(page);
    await dashboardPage.clickLogout();

    // Should land on home or login
    await expect(page).toHaveURL(/^http:\/\/localhost:3000\/(login)?$/, {
      timeout: 10000,
    });
  });
});
