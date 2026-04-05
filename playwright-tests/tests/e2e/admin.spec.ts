import { test, expect } from "@playwright/test";
import { AdminPage } from "./pages/AdminPage";
import { API_BASE } from "./config";
import { loginAsAdmin, loginAsDefaultUser, ADMIN_USER, DEFAULT_USER } from "./fixtures/auth";

/**
 * API Helper: Fetch JWT token for authentication
 */
async function fetchBearerToken(credentials: { username: string; password: string }): Promise<string> {
  const res = await fetch(`${API_BASE}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(credentials),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Auth failed (${res.status}): ${body}`);
  }
  const data = await res.json() as { token?: string };
  if (!data.token) throw new Error("No token returned from auth API");
  return data.token;
}

/**
 * API Helper: Fetch all users as admin
 */
async function getAllUsersViaApi(): Promise<Array<{ id: number; username: string; role: string }>> {
  const token = await fetchBearerToken(ADMIN_USER);
  const res = await fetch(`${API_BASE}/api/admin/users`, {
    method: "GET",
    headers: { "Authorization": `Bearer ${token}` },
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Fetch users failed (${res.status}): ${body}`);
  }
  const data = await res.json() as { content: Array<{ id: number; username: string; role: string }> };
  return data.content;
}

/**
 * API Helper: Fetch all forum categories
 */
async function getAllCategoriesViaApi(): Promise<Array<{ id: number; name: string }>> {
  const res = await fetch(`${API_BASE}/api/forum/categories`, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Fetch categories failed (${res.status}): ${body}`);
  }
  const data = await res.json() as Array<{ id: number; name: string }>;
  return data;
}

/**
 * API Helper: Create a test thread in a category
 */
async function createThreadViaApi(
  categoryId: number,
  credentials: { username: string; password: string }
): Promise<number> {
  const token = await fetchBearerToken(credentials);
  const res = await fetch(`${API_BASE}/api/forum/threads`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`,
    },
    body: JSON.stringify({
      title: `Test Thread ${Date.now()}`,
      description: "Test description",
      categoryId,
    }),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Create thread failed (${res.status}): ${body}`);
  }
  const data = await res.json() as { id: number };
  return data.id;
}

/**
 * API Helper: Get user role after update
 */
async function getUserRoleViaApi(userId: number): Promise<string> {
  const users = await getAllUsersViaApi();
  const user = users.find(u => u.id === userId);
  return user?.role ?? "";
}

// =========================================================================
// Admin Authorization Tests
// =========================================================================

test.describe("Admin Authorization", () => {
  test("admin can access /admin page", async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto("/admin");
    const adminPage = new AdminPage(page);
    await adminPage.waitForLoad();
    await expect(adminPage.getAdminPanel()).toBeVisible();
    await expect(page).toHaveURL(/\/admin/);
  });

  test("non-admin user is redirected from /admin to /dashboard", async ({ page }) => {
    await loginAsDefaultUser(page);
    await page.goto("/admin");
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 10000 });
  });
});

// =========================================================================
// User Management Tests
// =========================================================================

test.describe("User Management", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
    await page.waitForURL(/\/dashboard/, { timeout: 10000 });
    await page.goto("/admin");
  });

  test("admin can search for users by username", async ({ page }) => {
    const adminPage = new AdminPage(page);
    await adminPage.waitForLoad();
    await adminPage.clickUserManagementTab();

    const searchQuery = "user";
    await adminPage.searchUsers(searchQuery);

    const userList = adminPage.getUserList();
    await expect(userList).toBeVisible();

    const rows = page.getByTestId(/^user-row-/);
    const count = await rows.count();
    expect(count).toBeGreaterThan(0);
  });

  test("admin can change a user's role with confirmation dialog", async ({ page }) => {
    const adminPage = new AdminPage(page);
    await adminPage.waitForLoad();
    await adminPage.clickUserManagementTab();

    const users = await getAllUsersViaApi();
    const targetUser = users.find(u => u.role !== "ADMIN" && u.username !== "admin");

    if (!targetUser) {
      test.skip();
      return;
    }

    const originalRole = targetUser.role;
    const newRole = originalRole === "USER" ? "MODERATOR" : "USER";

    await adminPage.changeUserRole(targetUser.id, newRole as "USER" | "MODERATOR" | "ADMIN");

    await expect(adminPage.getRoleConfirmDialog()).not.toBeVisible({ timeout: 5000 });

    const updatedRole = await getUserRoleViaApi(targetUser.id);
    expect(updatedRole).toBe(newRole);
  });

  test("admin can cancel role change confirmation", async ({ page }) => {
    const adminPage = new AdminPage(page);
    await adminPage.waitForLoad();
    await adminPage.clickUserManagementTab();

    const users = await getAllUsersViaApi();
    const targetUser = users.find(u => u.role !== "ADMIN" && u.username !== "admin");

    if (!targetUser) {
      test.skip();
      return;
    }

    const originalRole = targetUser.role;
    const newRole = originalRole === "USER" ? "MODERATOR" : "USER";

    if (newRole === "USER") {
      await adminPage.getChangeRoleUserButton(targetUser.id).click();
    } else if (newRole === "MODERATOR") {
      await adminPage.getChangeRoleModeratorButton(targetUser.id).click();
    } else {
      await adminPage.getChangeRoleAdminButton(targetUser.id).click();
    }

    await expect(adminPage.getRoleConfirmDialog()).toBeVisible({ timeout: 5000 });

    await adminPage.cancelRoleChange();

    await expect(adminPage.getRoleConfirmDialog()).not.toBeVisible({ timeout: 5000 });

    const unchanged = await getUserRoleViaApi(targetUser.id);
    expect(unchanged).toBe(originalRole);
  });

  test("admin's own role buttons are disabled", async ({ page }) => {
    const adminPage = new AdminPage(page);
    await adminPage.waitForLoad();
    await adminPage.clickUserManagementTab();

    const users = await getAllUsersViaApi();
    const adminId = users.find(u => u.username === "admin")?.id;

    if (!adminId) {
      test.skip();
      return;
    }

    const roleButtons = [
      adminPage.getChangeRoleUserButton(adminId),
      adminPage.getChangeRoleModeratorButton(adminId),
      adminPage.getChangeRoleAdminButton(adminId),
    ];

    for (const button of roleButtons) {
      await expect(button).toBeDisabled();
    }
  });
});

// =========================================================================
// Category Management Tests
// =========================================================================

test.describe("Category Management", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto("/admin");
  });

  test("admin can create a new category via form", async ({ page }) => {
    const adminPage = new AdminPage(page);
    await adminPage.waitForLoad();
    await adminPage.clickCategoryManagementTab();

    await adminPage.clickAddCategory();
    await expect(adminPage.getCategoryForm()).toBeVisible({ timeout: 5000 });

    const categoryName = `Test Category ${Date.now()}`;
    const categoryDesc = "This is a test category for admin panel E2E testing";
    await adminPage.createCategory(categoryName, categoryDesc, "📚");

    await expect(adminPage.getCategoryForm()).not.toBeVisible({ timeout: 10000 });

    const categoryList = adminPage.getCategoryList();
    await expect(categoryList).toContainText(categoryName);

    const categories = await getAllCategoriesViaApi();
    const created = categories.find(c => c.name === categoryName);
    expect(created).toBeDefined();
  });

  test("admin can edit an existing category", async ({ page }) => {
    const adminPage = new AdminPage(page);
    await adminPage.waitForLoad();
    await adminPage.clickCategoryManagementTab();

    const categories = await getAllCategoriesViaApi();
    if (categories.length === 0) {
      test.skip();
      return;
    }

    const targetCategory = categories[0];
    const newName = `Edited Category ${Date.now()}`;

    await adminPage.editCategory(targetCategory.id, newName, "Updated description", "🎯");

    await expect(adminPage.getCategoryForm()).not.toBeVisible({ timeout: 10000 });

    const categoryList = adminPage.getCategoryList();
    await expect(categoryList).toContainText(newName);

    const updated = await getAllCategoriesViaApi();
    const editedCategory = updated.find(c => c.id === targetCategory.id);
    expect(editedCategory?.name).toBe(newName);
  });

  test("admin can delete a category without threads", async ({ page }) => {
    const adminPage = new AdminPage(page);
    await adminPage.waitForLoad();
    await adminPage.clickCategoryManagementTab();

    await adminPage.clickAddCategory();
    await expect(adminPage.getCategoryForm()).toBeVisible({ timeout: 5000 });

    const categoryName = `Category to Delete ${Date.now()}`;
    await adminPage.createCategory(categoryName, "This will be deleted", "🗑️");

    await expect(adminPage.getCategoryForm()).not.toBeVisible({ timeout: 10000 });

    const categories = await getAllCategoriesViaApi();
    const targetCategory = categories.find(c => c.name === categoryName);

    if (!targetCategory) {
      test.skip();
      return;
    }

    await adminPage.clickDeleteCategory(targetCategory.id);

    const categoryList = adminPage.getCategoryList();
    await expect(categoryList).not.toContainText(categoryName, { timeout: 10000 });

    const remaining = await getAllCategoriesViaApi();
    const deleted = remaining.find(c => c.id === targetCategory.id);
    expect(deleted).toBeUndefined();
  });

  test("admin sees error when trying to delete category with threads", async ({ page }) => {
    const adminPage = new AdminPage(page);
    await adminPage.waitForLoad();
    await adminPage.clickCategoryManagementTab();

    const categories = await getAllCategoriesViaApi();
    if (categories.length === 0) {
      test.skip();
      return;
    }

    const targetCategory = categories[0];

    await createThreadViaApi(targetCategory.id, ADMIN_USER);

    await adminPage.clickDeleteCategory(targetCategory.id);

    const errorMessage = adminPage.getCategoryManagementError();
    await expect(errorMessage).toBeVisible({ timeout: 5000 });
    await expect(errorMessage).toContainText(/thread|can.*delete|cannot|409/i);

    const stillExists = await getAllCategoriesViaApi();
    const notDeleted = stillExists.find(c => c.id === targetCategory.id);
    expect(notDeleted).toBeDefined();
  });
});
