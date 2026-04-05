import { test, expect } from "@playwright/test";
import { AdminPage } from "./pages/AdminPage";
import { LoginPage } from "./pages/LoginPage";

const ADMIN_USER = { username: "admin", password: "admin1234" };
const REGULAR_USER = { username: "user", password: "user1234" };

async function loginAs(
  page: import("@playwright/test").Page,
  creds: { username: string; password: string }
): Promise<void> {
  const loginPage = new LoginPage(page);
  await loginPage.login(creds.username, creds.password);
  await page.waitForURL(/\/dashboard/, { timeout: 10000 });
}

test.describe("Admin panel", () => {
  test("admin can access /admin", async ({ page }) => {
    await loginAs(page, ADMIN_USER);
    await page.goto("/admin");
    const adminPage = new AdminPage(page);
    await adminPage.waitForLoad();
    await expect(adminPage.getAdminPanel()).toBeVisible();
  });

  test("non-admin user cannot access /admin (redirects to dashboard)", async ({ page }) => {
    await loginAs(page, REGULAR_USER);
    await page.goto("/admin");
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 10000 });
  });
});
