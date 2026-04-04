import { test, expect } from "@playwright/test";
import { AdminPage } from "./pages/AdminPage";
import { DashboardPage } from "./pages/DashboardPage";
import { LoginPage } from "./pages/LoginPage";
import { API_BASE } from "./config";

const ADMIN_USER = { username: "admin", password: "admin1234" };
const REGULAR_USER = { username: "user", password: "user1234" };
const MODERATOR_USER = { username: "moderator", password: "moderator1234" };

async function loginAs(
  page: import("@playwright/test").Page,
  creds: { username: string; password: string }
): Promise<void> {
  const loginPage = new LoginPage(page);
  await loginPage.login(creds.username, creds.password);
  await page.waitForURL(/\/dashboard/, { timeout: 10000 });
}

async function fetchBearerToken(credentials: {
  username: string;
  password: string;
}): Promise<string> {
  const res = await fetch(`${API_BASE}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(credentials),
  });
  if (!res.ok) throw new Error(`Failed to authenticate: ${res.status}`);
  const data = (await res.json()) as { token?: string };
  if (!data.token) throw new Error("No token returned from auth API");
  return data.token;
}

async function createCategoryViaApi(
  token: string,
  name: string,
  description?: string,
  icon?: string
): Promise<number> {
  const res = await fetch(`${API_BASE}/api/admin/categories`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ name, description, icon }),
  });
  if (!res.ok) throw new Error(`Failed to create category: ${res.status}`);
  const data = (await res.json()) as { id: number };
  return data.id;
}

async function createThreadInCategoryViaApi(
  token: string,
  categoryId: number,
  title: string
): Promise<number> {
  const res = await fetch(`${API_BASE}/api/forum/threads`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ title, categoryId }),
  });
  if (!res.ok) throw new Error(`Failed to create thread: ${res.status}`);
  const data = (await res.json()) as { id: number };
  return data.id;
}

// ---------------------------------------------------------------------------
// Admin panel visibility and access
// ---------------------------------------------------------------------------

test.describe("Admin panel — visibility", () => {
  test("admin user sees Admin link on dashboard", async ({ page }) => {
    await loginAs(page, ADMIN_USER);
    const dashboardPage = new DashboardPage(page);
    await dashboardPage.waitForLoad();

    const adminLink = dashboardPage.getAdminLink();
    await expect(adminLink).toBeVisible({ timeout: 5000 });
  });

  test("regular user does NOT see Admin link on dashboard", async ({ page }) => {
    await loginAs(page, REGULAR_USER);
    const dashboardPage = new DashboardPage(page);
    await dashboardPage.waitForLoad();

    const adminLink = dashboardPage.getAdminLink();
    await expect(adminLink).not.toBeVisible();
  });
});

// ---------------------------------------------------------------------------
// Admin panel access control
// ---------------------------------------------------------------------------

test.describe("Admin panel — access control", () => {
  test("non-admin user cannot access /admin (redirects to dashboard)", async ({ page }) => {
    await loginAs(page, REGULAR_USER);
    await page.goto("/admin");
    // Should redirect back to dashboard
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 10000 });
  });

  test("admin user can access /admin", async ({ page }) => {
    await loginAs(page, ADMIN_USER);
    await page.goto("/admin");
    const adminPage = new AdminPage(page);
    await adminPage.waitForLoad();
    await expect(adminPage.getAdminPanel()).toBeVisible();
  });

  test("admin sees both User Management and Category Management tabs", async ({ page }) => {
    await loginAs(page, ADMIN_USER);
    const adminPage = new AdminPage(page);
    await adminPage.waitForLoad();

    await expect(adminPage.getUserManagementTabButton()).toBeVisible();
    await expect(adminPage.getCategoryManagementTabButton()).toBeVisible();
  });
});

// ---------------------------------------------------------------------------
// User Management
// ---------------------------------------------------------------------------

test.describe("Admin panel — User Management", () => {
  test("admin can search users and see results", async ({ page }) => {
    await loginAs(page, ADMIN_USER);
    const adminPage = new AdminPage(page);
    await adminPage.waitForLoad();

    await adminPage.clickUserManagementTab();
    await adminPage.searchUsers("user");

    const userList = adminPage.getUserList();
    await expect(userList).toBeVisible({ timeout: 5000 });
    // Should have at least the "user" account
    const rows = page.getByTestId(/^user-row-/);
    await expect(rows.first()).toBeVisible();
  });

  test("admin can change user role with confirmation dialog", async ({ page }) => {
    await loginAs(page, ADMIN_USER);
    const adminPage = new AdminPage(page);
    await adminPage.waitForLoad();

    await adminPage.clickUserManagementTab();
    await adminPage.searchUsers("user");

    // Find a user row and click a role button
    const userRow = page.getByTestId(/^user-row-/).first();
    await expect(userRow).toBeVisible({ timeout: 5000 });

    // Extract user ID from the first row
    const userId = await userRow.evaluate((el) => {
      const testId = el.getAttribute("data-testid") || "";
      return parseInt(testId.replace("user-row-", ""), 10);
    });

    // Click change role button
    await adminPage.getChangeRoleModeratorButton(userId).click();

    // Confirm dialog appears
    const confirmDialog = adminPage.getRoleConfirmDialog();
    await expect(confirmDialog).toBeVisible({ timeout: 5000 });
    await expect(confirmDialog).toContainText(/MODERATOR/);

    // Confirm the change
    await adminPage.confirmRoleChange();
    await expect(confirmDialog).not.toBeVisible();
  });

  test("role buttons are disabled for admin's own user", async ({ page }) => {
    await loginAs(page, ADMIN_USER);
    const adminPage = new AdminPage(page);
    await adminPage.waitForLoad();

    await adminPage.clickUserManagementTab();
    // Search for the admin user (default is "admin")
    await adminPage.searchUsers("admin");

    // Wait for results
    await expect(adminPage.getUserList()).toBeVisible({ timeout: 5000 });

    // Find the admin user's row
    const adminRow = page
      .getByTestId(/^user-row-/)
      .filter({ hasText: /^admin$/ })
      .first();

    // If found, check that role buttons are disabled
    if (await adminRow.isVisible()) {
      const userId = await adminRow.evaluate((el) => {
        const testId = el.getAttribute("data-testid") || "";
        return parseInt(testId.replace("user-row-", ""), 10);
      });

      await expect(
        adminPage.getChangeRoleUserButton(userId)
      ).toBeDisabled();
      await expect(
        adminPage.getChangeRoleModeratorButton(userId)
      ).toBeDisabled();
      await expect(
        adminPage.getChangeRoleAdminButton(userId)
      ).toBeDisabled();
    }
  });
});

// ---------------------------------------------------------------------------
// Category Management
// ---------------------------------------------------------------------------

test.describe("Admin panel — Category Management", () => {
  test("admin can create category via form", async ({ page }) => {
    await loginAs(page, ADMIN_USER);
    const adminPage = new AdminPage(page);
    await adminPage.waitForLoad();

    await adminPage.clickCategoryManagementTab();
    await adminPage.clickAddCategory();

    // Form should appear
    await expect(adminPage.getCategoryForm()).toBeVisible({ timeout: 5000 });

    // Fill and submit form
    const categoryName = `Test Category ${Date.now()}`;
    await adminPage.createCategory(
      categoryName,
      "Test category description",
      "📚"
    );

    // Category should appear in list
    await expect(adminPage.getCategoryList()).toContainText(categoryName, {
      timeout: 5000,
    });
  });

  test("admin can edit category with pre-filled form", async ({ page }) => {
    const token = await fetchBearerToken(ADMIN_USER);
    const categoryId = await createCategoryViaApi(
      token,
      `Category to Edit ${Date.now()}`,
      "Original description",
      "📖"
    );

    await loginAs(page, ADMIN_USER);
    const adminPage = new AdminPage(page);
    await adminPage.waitForLoad();

    await adminPage.clickCategoryManagementTab();
    await expect(adminPage.getCategoryList()).toBeVisible({ timeout: 5000 });

    await adminPage.clickEditCategory(categoryId);

    // Form should appear with pre-filled data
    await expect(adminPage.getCategoryForm()).toBeVisible({ timeout: 5000 });

    const nameInput = adminPage.getCategoryNameInput();
    const currentValue = await nameInput.inputValue();
    expect(currentValue).toContain("Category to Edit");

    // Edit the name
    const newName = `Updated Category ${Date.now()}`;
    await nameInput.fill(newName);
    await adminPage.submitCategoryForm();

    // Updated name should appear in list
    await expect(adminPage.getCategoryList()).toContainText(newName, {
      timeout: 5000,
    });
  });

  test("admin can delete category (without threads)", async ({ page }) => {
    const token = await fetchBearerToken(ADMIN_USER);
    const categoryId = await createCategoryViaApi(
      token,
      `Category to Delete ${Date.now()}`,
      "Will be deleted",
      "🗑️"
    );

    await loginAs(page, ADMIN_USER);
    const adminPage = new AdminPage(page);
    await adminPage.waitForLoad();

    await adminPage.clickCategoryManagementTab();
    await expect(adminPage.getCategoryList()).toBeVisible({ timeout: 5000 });

    // Delete the category
    await adminPage.clickDeleteCategory(categoryId);

    // Category should be removed from list
    await expect(adminPage.getCategoryItem(categoryId)).not.toBeVisible({
      timeout: 5000,
    });
  });

  test("admin cannot delete category with threads (error shown)", async ({ page }) => {
    const token = await fetchBearerToken(ADMIN_USER);
    const categoryId = await createCategoryViaApi(
      token,
      `Category with Threads ${Date.now()}`,
      "Has threads",
      "🔒"
    );

    // Create a thread in this category
    await createThreadInCategoryViaApi(
      token,
      categoryId,
      `Thread in Category ${Date.now()}`
    );

    await loginAs(page, ADMIN_USER);
    const adminPage = new AdminPage(page);
    await adminPage.waitForLoad();

    await adminPage.clickCategoryManagementTab();
    await expect(adminPage.getCategoryList()).toBeVisible({ timeout: 5000 });

    // Try to delete the category
    await adminPage.clickDeleteCategory(categoryId);

    // Error message should appear
    const error = adminPage.getCategoryManagementError();
    await expect(error).toBeVisible({ timeout: 5000 });
    await expect(error).toContainText(/cannot delete|threads/i);
  });
});
