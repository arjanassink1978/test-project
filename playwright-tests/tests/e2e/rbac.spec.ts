import { test, expect } from "@playwright/test";
import { DashboardPage } from "./pages/DashboardPage";
import { AdminPage } from "./pages/AdminPage";
import { setupDefaultUserAuth, setupAdminAuth, setupModeratorAuth, loginAsDefaultUser } from "./fixtures/auth";
import { createThreadViaApi, deleteThreadViaApi } from "./fixtures/api";

test.describe("Role-Based Access Control (RBAC)", () => {
  test("admin link is visible only for admin users", async ({ page }) => {
    await setupDefaultUserAuth(page);

    const dashboard = new DashboardPage(page);
    await dashboard.goto();

    const hasAdminLink = await dashboard.hasAdminLink();
    expect(hasAdminLink).toBe(false);
  });

  test("admin link is visible for admin users", async ({ page }) => {
    await setupAdminAuth(page);

    const dashboard = new DashboardPage(page);
    await dashboard.goto();

    const hasAdminLink = await dashboard.hasAdminLink();
    expect(hasAdminLink).toBe(true);
  });

  test("admin link navigates to admin panel", async ({ page }) => {
    await setupAdminAuth(page);

    const dashboard = new DashboardPage(page);
    await dashboard.goto();
    await dashboard.clickAdminLink();

    await expect(page).toHaveURL("/admin");
  });

  test("non-admin user cannot access admin panel", async ({ page }) => {
    await loginAsDefaultUser(page);

    const adminPage = new AdminPage(page);
    await adminPage.goto();

    await expect(page).toHaveURL("/dashboard");
  });

  test("admin user can access admin panel", async ({ page }) => {
    await setupAdminAuth(page);

    const adminPage = new AdminPage(page);
    await adminPage.goto();

    await expect(page).toHaveURL("/admin");
    await expect(page.getByTestId("admin-panel")).toBeVisible();
  });

  test("admin can view user management tab", async ({ page }) => {
    await setupAdminAuth(page);

    const adminPage = new AdminPage(page);
    await adminPage.goto();
    await adminPage.clickUserManagementTab();

    await expect(page.getByTestId("user-management-tab")).toBeVisible();
  });

  test("admin can view category management tab", async ({ page }) => {
    await setupAdminAuth(page);

    const adminPage = new AdminPage(page);
    await adminPage.goto();
    await adminPage.clickCategoryManagementTab();

    await expect(page.getByTestId("category-management-tab")).toBeVisible();
  });

  test("moderator cannot access admin panel", async ({ page }) => {
    await setupModeratorAuth(page);

    const adminPage = new AdminPage(page);
    await adminPage.goto();

    await expect(page).toHaveURL("/dashboard");
  });

  test("moderator has forum navigation but no admin link", async ({ page }) => {
    await setupModeratorAuth(page);

    const dashboard = new DashboardPage(page);
    await dashboard.goto();

    const hasAdminLink = await dashboard.hasAdminLink();
    expect(hasAdminLink).toBe(false);
  });

  test("moderator can close thread", async ({ page }) => {
    const { token: userToken } = await setupDefaultUserAuth(page);

    const { id: threadId } = await createThreadViaApi(userToken, {
      title: `Thread for moderator test ${Date.now()}`,
      description: "Test thread",
      categoryId: 1,
    });

    const { token: modToken } = await setupModeratorAuth(page);
    const adminPage = new AdminPage(page);
    await adminPage.goto();

    await deleteThreadViaApi(modToken, threadId);
  });

  test("regular user cannot see admin panel link", async ({ page }) => {
    await loginAsDefaultUser(page);

    const dashboard = new DashboardPage(page);
    await dashboard.goto();

    const hasAdminLink = await dashboard.hasAdminLink();
    expect(hasAdminLink).toBe(false);
  });

  test("user role persists after page reload", async ({ page }) => {
    const { role } = await setupAdminAuth(page);

    const dashboard = new DashboardPage(page);
    await dashboard.goto();

    await page.reload();

    const storedRole = await page.evaluate(() => localStorage.getItem("role"));
    expect(storedRole).toBe(role);
  });

  test("logout clears role from localStorage", async ({ page }) => {
    await setupAdminAuth(page);

    const dashboard = new DashboardPage(page);
    await dashboard.goto();
    await dashboard.clickLogout();

    const storedRole = await page.evaluate(() => localStorage.getItem("role"));
    expect(storedRole).toBeNull();
  });
});
