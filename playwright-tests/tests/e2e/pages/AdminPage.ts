import { Page, expect, Locator } from "@playwright/test";

/**
 * Page Object for /admin.
 *
 * Admin panel with two tabs: User Management and Category Management.
 * - User Management: search users, change roles with confirmation dialog
 * - Category Management: create, edit, delete categories
 */
export class AdminPage {
  constructor(private readonly page: Page) {}

  async waitForLoad() {
    await expect(this.page).toHaveURL(/\/admin/, { timeout: 10000 });
    await expect(this.getAdminPanel()).toBeVisible({ timeout: 10000 });
  }

  /**
   * Expected data-testid: "admin-panel"
   */
  getAdminPanel(): Locator {
    return this.page.getByTestId("admin-panel");
  }

  // =========================================================================
  // Tab Navigation
  // =========================================================================

  /**
   * Expected data-testid: "user-management-tab"
   */
  getUserManagementTabButton(): Locator {
    return this.page.getByTestId("user-management-tab");
  }

  async clickUserManagementTab() {
    await this.getUserManagementTabButton().click();
  }

  /**
   * Expected data-testid: "category-management-tab"
   */
  getCategoryManagementTabButton(): Locator {
    return this.page.getByTestId("category-management-tab");
  }

  async clickCategoryManagementTab() {
    await this.getCategoryManagementTabButton().click();
  }

  // =========================================================================
  // User Management Tab
  // =========================================================================

  /**
   * Expected data-testid: "user-management-tab" (the container)
   */
  getUserManagementContainer(): Locator {
    return this.page.getByTestId("user-management-tab");
  }

  /**
   * Expected data-testid: "user-search-input"
   */
  getUserSearchInput(): Locator {
    return this.page.getByTestId("user-search-input");
  }

  async searchUsers(query: string) {
    await this.getUserSearchInput().fill(query);
    await this.page.waitForTimeout(300); // Wait for search debounce
  }

  /**
   * Expected data-testid: "user-list"
   */
  getUserList(): Locator {
    return this.page.getByTestId("user-list");
  }

  /**
   * Expected data-testid: "user-row-{id}"
   */
  getUserRow(userId: number): Locator {
    return this.page.getByTestId(`user-row-${userId}`);
  }

  /**
   * Expected data-testid: "change-role-user-{id}"
   */
  getChangeRoleUserButton(userId: number): Locator {
    return this.page.getByTestId(`change-role-user-${userId}`);
  }

  /**
   * Expected data-testid: "change-role-moderator-{id}"
   */
  getChangeRoleModeratorButton(userId: number): Locator {
    return this.page.getByTestId(`change-role-moderator-${userId}`);
  }

  /**
   * Expected data-testid: "change-role-admin-{id}"
   */
  getChangeRoleAdminButton(userId: number): Locator {
    return this.page.getByTestId(`change-role-admin-${userId}`);
  }

  /**
   * Expected data-testid: "role-confirm-dialog"
   */
  getRoleConfirmDialog(): Locator {
    return this.page.getByTestId("role-confirm-dialog");
  }

  /**
   * Expected data-testid: "confirm-role-button"
   */
  getConfirmRoleButton(): Locator {
    return this.page.getByTestId("confirm-role-button");
  }

  async confirmRoleChange() {
    await this.getConfirmRoleButton().click();
  }

  /**
   * Expected data-testid: "cancel-confirm-button"
   */
  getCancelConfirmButton(): Locator {
    return this.page.getByTestId("cancel-confirm-button");
  }

  async cancelRoleChange() {
    await this.getCancelConfirmButton().click();
  }

  /**
   * Expected data-testid: "user-management-error"
   */
  getUserManagementError(): Locator {
    return this.page.getByTestId("user-management-error");
  }

  // =========================================================================
  // Category Management Tab
  // =========================================================================

  /**
   * Expected data-testid: "category-management-tab" (the container)
   */
  getCategoryManagementContainer(): Locator {
    return this.page.getByTestId("category-management-tab");
  }

  /**
   * Expected data-testid: "add-category-button"
   */
  getAddCategoryButton(): Locator {
    return this.page.getByTestId("add-category-button");
  }

  async clickAddCategory() {
    await this.getAddCategoryButton().click();
  }

  /**
   * Expected data-testid: "category-list"
   */
  getCategoryList(): Locator {
    return this.page.getByTestId("category-list");
  }

  /**
   * Expected data-testid: "category-item-{id}"
   */
  getCategoryItem(categoryId: number): Locator {
    return this.page.getByTestId(`category-item-${categoryId}`);
  }

  /**
   * Expected data-testid: "edit-category-{id}"
   */
  getEditCategoryButton(categoryId: number): Locator {
    return this.page.getByTestId(`edit-category-${categoryId}`);
  }

  async clickEditCategory(categoryId: number) {
    await this.getEditCategoryButton(categoryId).click();
  }

  /**
   * Expected data-testid: "delete-category-{id}"
   */
  getDeleteCategoryButton(categoryId: number): Locator {
    return this.page.getByTestId(`delete-category-${categoryId}`);
  }

  async clickDeleteCategory(categoryId: number) {
    await this.getDeleteCategoryButton(categoryId).click();
  }

  /**
   * Expected data-testid: "category-form"
   */
  getCategoryForm(): Locator {
    return this.page.getByTestId("category-form");
  }

  /**
   * Expected data-testid: "category-name-input"
   */
  getCategoryNameInput(): Locator {
    return this.page.getByTestId("category-name-input");
  }

  /**
   * Expected data-testid: "category-description-input"
   */
  getCategoryDescriptionInput(): Locator {
    return this.page.getByTestId("category-description-input");
  }

  /**
   * Expected data-testid: "category-icon-input"
   */
  getCategoryIconInput(): Locator {
    return this.page.getByTestId("category-icon-input");
  }

  /**
   * Expected data-testid: "category-form-submit"
   */
  getCategoryFormSubmitButton(): Locator {
    return this.page.getByTestId("category-form-submit");
  }

  async submitCategoryForm() {
    await this.getCategoryFormSubmitButton().click();
  }

  /**
   * Expected data-testid: "category-form-cancel"
   */
  getCategoryFormCancelButton(): Locator {
    return this.page.getByTestId("category-form-cancel");
  }

  async cancelCategoryForm() {
    await this.getCategoryFormCancelButton().click();
  }

  /**
   * Expected data-testid: "category-form-error"
   */
  getCategoryFormError(): Locator {
    return this.page.getByTestId("category-form-error");
  }

  /**
   * Expected data-testid: "category-management-error"
   */
  getCategoryManagementError(): Locator {
    return this.page.getByTestId("category-management-error");
  }

  // =========================================================================
  // Helper Methods
  // =========================================================================

  /**
   * Fill in the category form with the given data and submit
   */
  async createCategory(name: string, description: string, icon: string = "") {
    await this.getCategoryNameInput().fill(name);
    if (description) {
      await this.getCategoryDescriptionInput().fill(description);
    }
    if (icon) {
      await this.getCategoryIconInput().fill(icon);
    }
    await this.submitCategoryForm();
  }

  /**
   * Edit an existing category
   */
  async editCategory(
    categoryId: number,
    name: string,
    description: string,
    icon: string = ""
  ) {
    await this.clickEditCategory(categoryId);
    await this.page.waitForTimeout(300);
    await this.getCategoryNameInput().fill(name);
    if (description) {
      await this.getCategoryDescriptionInput().fill(description);
    }
    if (icon) {
      await this.getCategoryIconInput().fill(icon);
    }
    await this.submitCategoryForm();
  }

  /**
   * Change user role with confirmation
   */
  async changeUserRole(userId: number, role: "USER" | "MODERATOR" | "ADMIN") {
    if (role === "USER") {
      await this.getChangeRoleUserButton(userId).click();
    } else if (role === "MODERATOR") {
      await this.getChangeRoleModeratorButton(userId).click();
    } else {
      await this.getChangeRoleAdminButton(userId).click();
    }
    await expect(this.getRoleConfirmDialog()).toBeVisible({ timeout: 5000 });
    await this.confirmRoleChange();
  }
}
