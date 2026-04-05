import { test, expect } from "@playwright/test";
import { LoginPage } from "./pages/LoginPage";
import { RegisterPage } from "./pages/RegisterPage";
import { DashboardPage } from "./pages/DashboardPage";
import { loginAsDefaultUser } from "./fixtures/auth";
import { DEFAULT_USER } from "./config";

test.describe("Authentication", () => {
  test("login with invalid credentials shows error", async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();

    await loginPage.loginWith("nonexistent", "wrongpassword");

    const error = await loginPage.getError();
    expect(error).toBeTruthy();
    expect(error).toMatch(/[Ii]nvalid|[Oo]ngeldig|[Uu]nknown/);
  });

  test("login with correct credentials redirects to dashboard", async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();

    await loginPage.loginWith(DEFAULT_USER.username, DEFAULT_USER.password);

    await expect(page).toHaveURL("/dashboard");
  });

  test("login with empty username shows validation feedback", async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();

    await loginPage.fillPassword(DEFAULT_USER.password);
    await loginPage.submit();

    const error = await loginPage.getError();
    expect(error).toBeTruthy();
  });

  test("login with empty password shows validation feedback", async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();

    await loginPage.fillUsername(DEFAULT_USER.username);
    await loginPage.submit();

    const error = await loginPage.getError();
    expect(error).toBeTruthy();
  });

  test("register link on login page navigates to register", async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();

    await page.getByTestId("register-link").click();

    await expect(page).toHaveURL("/register");
  });

  test("register with valid credentials succeeds", async ({ page }) => {
    const registerPage = new RegisterPage(page);
    const uniqueUsername = `testuser_${Date.now()}`;
    const uniqueEmail = `test_${Date.now()}@example.com`;

    await registerPage.goto();

    await registerPage.registerWith(uniqueEmail, uniqueUsername, "testpass123", "testpass123");

    await expect(page).toHaveURL("/login");
  });

  test("register with mismatched passwords prevents submission", async ({ page }) => {
    const registerPage = new RegisterPage(page);

    await registerPage.goto();

    await registerPage.registerWith("test@example.com", "testuser", "password123", "different123");

    await expect(page).toHaveURL(/\/register/);
  });

  test("register with invalid email prevents submission", async ({ page }) => {
    const registerPage = new RegisterPage(page);

    await registerPage.goto();

    await registerPage.registerWith("invalidemail", "testuser", "password123", "password123");

    await expect(page).toHaveURL(/\/register/);
  });

  test("register with duplicate username shows error", async ({ page }) => {
    const registerPage = new RegisterPage(page);

    await registerPage.goto();

    await registerPage.registerWith(
      "newemail@example.com",
      DEFAULT_USER.username,
      "password123",
      "password123"
    );

    const error = await registerPage.getError();
    expect(error).toBeTruthy();
    expect(error).toMatch(/already|in use|gebruik/);
  });

  test("register with short password prevents submission", async ({ page }) => {
    const registerPage = new RegisterPage(page);

    await registerPage.goto();

    await registerPage.registerWith("test@example.com", "testuser", "short", "short");

    await expect(page).toHaveURL(/\/register/);
  });

  test("logout from dashboard navigates to home page", async ({ page }) => {
    await loginAsDefaultUser(page);

    const dashboard = new DashboardPage(page);
    await dashboard.clickLogout();

    await expect(page).toHaveURL("/");
  });
});
