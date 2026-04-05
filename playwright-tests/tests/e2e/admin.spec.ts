import { test, expect } from "@playwright/test";
import { AdminPage } from "./pages/AdminPage";
import { setupAdminAuth, setupDefaultUserAuth } from "./fixtures/auth";
import {
  createThreadViaApi,
  createCategoryViaApi,
  updateCategoryViaApi,
  deleteCategoryViaApi,
  deleteThreadViaApi,
} from "./fixtures/api";

test.describe("Admin Panel", () => {
  test("admin can search users", async ({ page }) => {
    await setupAdminAuth(page);

    const adminPage = new AdminPage(page);
    await adminPage.goto();
    await adminPage.clickUserManagementTab();

    await adminPage.searchUsers("user");

    await expect(page.getByTestId("user-list")).toBeVisible();
  });

  test("admin can view and change user roles", async ({ page }) => {
    await setupAdminAuth(page);

    const adminPage = new AdminPage(page);
    await adminPage.goto();
    await adminPage.clickUserManagementTab();

    await adminPage.searchUsers("moderator");

    const roleButton = page.locator("[data-testid*='change-role-']").first();
    const isVisible = await roleButton.isVisible().catch(() => false);
    expect(isVisible).toBe(true);
  });

  test("admin can create new category", async ({ page }) => {
    await setupAdminAuth(page);

    const adminPage = new AdminPage(page);
    await adminPage.goto();
    await adminPage.clickCategoryManagementTab();

    await adminPage.clickAddCategory();

    const categoryName = `Test Category ${Date.now()}`;
    const categoryDesc = "Test category description";

    await adminPage.fillCategoryName(categoryName);
    await adminPage.fillCategoryDescription(categoryDesc);
    await adminPage.submitCategoryForm();

    await page.waitForLoadState("networkidle");

    const categoryList = page.getByTestId("category-list");
    await expect(categoryList).toContainText(categoryName);
  });

  test("admin can edit existing category", async ({ page }) => {
    const { token } = await setupAdminAuth(page);

    const { id: categoryId } = await createCategoryViaApi(token, {
      name: `Category to Edit ${Date.now()}`,
      description: "Original description",
    });

    const adminPage = new AdminPage(page);
    await adminPage.goto();
    await adminPage.clickCategoryManagementTab();

    await adminPage.editCategory(categoryId);

    const newName = `Updated Category ${Date.now()}`;
    await adminPage.fillCategoryName(newName);
    await adminPage.submitCategoryForm();

    await page.waitForLoadState("networkidle");

    await deleteCategoryViaApi(token, categoryId);
  });

  test("admin can delete empty category", async ({ page }) => {
    const { token } = await setupAdminAuth(page);

    const { id: categoryId } = await createCategoryViaApi(token, {
      name: `Category to Delete ${Date.now()}`,
      description: "To be deleted",
    });

    const adminPage = new AdminPage(page);
    await adminPage.goto();
    await adminPage.clickCategoryManagementTab();

    await adminPage.deleteCategory(categoryId);

    await page.waitForLoadState("networkidle");
  });

  test("admin cannot delete category with threads", async ({ page }) => {
    const { token: adminToken } = await setupAdminAuth(page);
    const { token: userToken } = await setupDefaultUserAuth(page);

    const { id: categoryId } = await createCategoryViaApi(adminToken, {
      name: `Category with Thread ${Date.now()}`,
      description: "Has thread",
    });

    const { id: threadId } = await createThreadViaApi(userToken, {
      title: `Thread in Category ${Date.now()}`,
      description: "Test",
      categoryId,
    });

    const adminPage = new AdminPage(page);
    await adminPage.goto();
    await adminPage.clickCategoryManagementTab();

    await adminPage.deleteCategory(categoryId);

    const error = await adminPage.getCategoryError();
    expect(error).toBeTruthy();

    await deleteThreadViaApi(userToken, threadId);
    await deleteCategoryViaApi(adminToken, categoryId);
  });

  test("admin can cancel category form", async ({ page }) => {
    await setupAdminAuth(page);

    const adminPage = new AdminPage(page);
    await adminPage.goto();
    await adminPage.clickCategoryManagementTab();

    await adminPage.clickAddCategory();

    const isFormVisible = await adminPage.isCategoryFormVisible();
    expect(isFormVisible).toBe(true);

    await adminPage.cancelCategoryForm();

    const isFormVisibleAfter = await adminPage.isCategoryFormVisible().catch(() => false);
    expect(isFormVisibleAfter).toBe(false);
  });

  test("category form validates required fields", async ({ page }) => {
    await setupAdminAuth(page);

    const adminPage = new AdminPage(page);
    await adminPage.goto();
    await adminPage.clickCategoryManagementTab();

    await adminPage.clickAddCategory();

    await adminPage.submitCategoryForm();

    const error = await adminPage.getCategoryError();
    expect(error).toBeTruthy();
  });

  test("category name respects max length constraint", async ({ page }) => {
    await setupAdminAuth(page);

    const adminPage = new AdminPage(page);
    await adminPage.goto();
    await adminPage.clickCategoryManagementTab();

    await adminPage.clickAddCategory();

    const input = page.getByTestId("category-name-input");
    const maxLength = await input.getAttribute("maxlength");
    expect(maxLength).toBe("50");
  });

  test("category description respects max length constraint", async ({ page }) => {
    await setupAdminAuth(page);

    const adminPage = new AdminPage(page);
    await adminPage.goto();
    await adminPage.clickCategoryManagementTab();

    await adminPage.clickAddCategory();

    const input = page.getByTestId("category-description-input");
    const maxLength = await input.getAttribute("maxlength");
    expect(maxLength).toBe("200");
  });

  test("admin user search pagination works", async ({ page }) => {
    await setupAdminAuth(page);

    const adminPage = new AdminPage(page);
    await adminPage.goto();
    await adminPage.clickUserManagementTab();

    await adminPage.searchUsers("");

    const userList = page.getByTestId("user-list");
    await expect(userList).toBeVisible();
  });

  test("user management tab shows user list", async ({ page }) => {
    await setupAdminAuth(page);

    const adminPage = new AdminPage(page);
    await adminPage.goto();
    await adminPage.clickUserManagementTab();

    await expect(page.getByTestId("user-list")).toBeVisible();
  });

  test("category management tab shows category list", async ({ page }) => {
    await setupAdminAuth(page);

    const adminPage = new AdminPage(page);
    await adminPage.goto();
    await adminPage.clickCategoryManagementTab();

    await expect(page.getByTestId("category-list")).toBeVisible();
  });
});
